# Network Policies

By default, every Pod in Kubernetes can communicate with every other Pod — no restrictions. **NetworkPolicies** let you control which Pods can talk to each other, acting as a firewall at the Pod level.

---

## How Network Policies Work

A NetworkPolicy selects Pods using labels and defines rules for **ingress** (incoming) and **egress** (outgoing) traffic.

```
┌──────────────────────────────────────────────────────────────┐
│                    Without NetworkPolicy                      │
│                                                              │
│   Pod A ◄──────────► Pod B ◄──────────► Pod C               │
│          (all traffic allowed between all Pods)              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                    With NetworkPolicy                         │
│                                                              │
│   Pod A ──────X────► Pod B ◄────────── Pod C                │
│   (blocked)          (only Pod C       (allowed,             │
│                       allowed in)       has matching label)  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

> ⚠️ **Important:** NetworkPolicies require a **CNI plugin** that supports them. Minikube's default networking (kindnet) does **not** enforce NetworkPolicies. We'll enable the **Calico** CNI to make them work.

---

## Prerequisites

### Enable the CNI Plugin

To enforce NetworkPolicies in minikube, enable the Calico network plugin:

```bash
# If you need to restart minikube with Calico support:
minikube stop
minikube start --cni=calico
```

> 💡 **Note:** If you already have a minikube cluster running without Calico, you may need to delete and recreate it:
> ```bash
> minikube delete
> minikube start --cni=calico
> ```
>
> After recreating, rebuild your image and reapply your Deployments:
> ```bash
> eval $(minikube docker-env)
> cd app/ && docker build -t kube-trainer-app:latest . && cd ..
> kubectl apply -f app/deployment.yaml
> kubectl apply -f app/clusterip-service.yaml
> kubectl apply -f app/serviceaccount.yaml
> kubectl apply -f app/role.yaml
> kubectl apply -f app/rolebinding.yaml
> ```

Verify Calico is running:

```bash
kubectl get pods -n kube-system -l k8s-app=calico-node
```

You should see a Pod with `STATUS Running`.

---

## Step 1: Test Default Connectivity

Before applying any NetworkPolicy, verify that Pods can communicate freely:

```bash
# Run a test Pod and curl the hello-app Service
kubectl run test-access --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s --max-time 5 http://hello-app-clusterip:3000/health
```

You should get: `{"status":"ok","hostname":"..."}` — traffic is allowed.

---

## Step 2: Create a NetworkPolicy

Create the file `app/networkpolicy.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: hello-app-netpol
  labels:
    app: hello-app
spec:
  podSelector:
    matchLabels:
      app: hello-app
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              access: hello-app
      ports:
        - protocol: TCP
          port: 3000
```

This policy says:
- **Applies to:** Pods with label `app: hello-app`
- **Allows ingress:** Only from Pods with label `access: hello-app`, on port 3000
- **Blocks:** All other ingress traffic to hello-app Pods

Apply it:

```bash
kubectl apply -f app/networkpolicy.yaml
```

Verify it exists:

```bash
kubectl get networkpolicy hello-app-netpol
```

Describe it to see the rules:

```bash
kubectl describe networkpolicy hello-app-netpol
```

---

## Step 3: Test the Policy — Blocked Traffic

Now try to access the app **without** the required label:

```bash
# This should FAIL (timeout) — the test Pod doesn't have the access label
kubectl run test-blocked --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s --max-time 5 http://hello-app-clusterip:3000/health
```

This should time out or return an error — the NetworkPolicy blocks the traffic because the source Pod doesn't have the label `access: hello-app`.

---

## Step 4: Test the Policy — Allowed Traffic

Now try with the required label:

```bash
# This should SUCCEED — the test Pod has the access label
kubectl run test-allowed --image=curlimages/curl --rm -it --restart=Never \
  --labels="access=hello-app" -- \
  curl -s --max-time 5 http://hello-app-clusterip:3000/health
```

You should get: `{"status":"ok","hostname":"..."}` — traffic is allowed because the Pod has the matching label.

---

## Step 5: Understanding the NetworkPolicy Spec

Let's break down the key fields:

### `podSelector`

Selects which Pods the policy applies to. An empty selector `{}` applies to **all** Pods in the namespace:

```yaml
# Apply to all Pods in the namespace
podSelector: {}

# Apply to only Pods with a specific label
podSelector:
  matchLabels:
    app: hello-app
```

### `policyTypes`

Controls which direction of traffic is restricted:

```yaml
policyTypes:
  - Ingress         # Restrict incoming traffic
  - Egress          # Restrict outgoing traffic
```

> 💡 **Default behavior:** If you specify `Ingress` in `policyTypes` but provide no `ingress` rules, **all** ingress is blocked. Same for `Egress`.

### `ingress` / `egress` rules

Each rule specifies `from` (ingress) or `to` (egress) sources, plus optional `ports`:

```yaml
ingress:
  - from:
      - podSelector:            # From Pods with matching labels
          matchLabels:
            role: frontend
      - namespaceSelector:      # From Pods in matching namespaces
          matchLabels:
            env: production
    ports:
      - protocol: TCP
        port: 3000
```

> ⚠️ **AND vs OR:** Multiple items under the same `from` array entry are **AND**ed. Separate `from` entries are **OR**ed. Be careful with indentation!

---

## Common NetworkPolicy Patterns

### Deny All Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  # No ingress rules = all ingress blocked
```

### Allow Only DNS Egress

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-only
spec:
  podSelector:
    matchLabels:
      app: hello-app
  policyTypes:
    - Egress
  egress:
    - to: []
      ports:
        - protocol: UDP
          port: 53
```

---

## Useful kubectl Commands for NetworkPolicies

| Command | Purpose |
|---|---|
| `kubectl get networkpolicy` | List NetworkPolicies |
| `kubectl describe networkpolicy <name>` | Show policy details and rules |
| `kubectl delete networkpolicy <name>` | Remove a policy |

---

## What You Learned

| Concept | What you did |
|---|---|
| **Default networking** | All Pods can talk to all Pods without policies |
| **NetworkPolicy** | Created a policy to restrict ingress to hello-app |
| **Label-based access** | Only Pods with `access: hello-app` label can reach the app |
| **Testing** | Verified blocked and allowed traffic with test Pods |
| **Policy spec** | Understood podSelector, policyTypes, ingress/egress rules |

---

**Next up:** [Security Best Practices →](./04-security-best-practices.md)
