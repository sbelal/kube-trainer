# Resource Quotas & Limit Ranges

In the previous phase, you learned how to set resource requests and limits on individual containers. **ResourceQuotas** and **LimitRanges** take this further by enforcing constraints at the **namespace level** — preventing any single team or environment from consuming more than its fair share.

---

## Why Namespace-Level Limits Matter

Individual container limits protect against a single runaway Pod. But what about a team that creates hundreds of Pods?

```
Without ResourceQuota:              With ResourceQuota:

  Namespace: team-a                   Namespace: team-a
  ┌─────────────────────┐             ┌─────────────────────┐
  │ Pod Pod Pod Pod Pod  │             │ Pod Pod Pod (3 max) │
  │ Pod Pod Pod Pod Pod  │             │                     │
  │ Pod Pod Pod Pod Pod  │             │ CPU: 2/4 cores used │
  │ 💥 Starves team-b   │             │ ✅ Fair sharing     │
  └─────────────────────┘             └─────────────────────┘
```

---

## ResourceQuota vs LimitRange

| Resource | Scope | Purpose |
|---|---|---|
| **ResourceQuota** | Entire namespace | Caps the **total** resources all Pods can use |
| **LimitRange** | Per container/Pod | Sets **default** and **min/max** for individual containers |

> 💡 **Think of it this way:** ResourceQuota is a team budget. LimitRange is the spending policy for each purchase.

---

## Prerequisites

Make sure your cluster and the `hello-prod` namespace are ready:

```bash
minikube status
kubectl get namespace hello-prod
```

If the namespace doesn't exist, create it first:

```bash
kubectl apply -f app/namespace.yaml
```

---

## Step 1: Create a ResourceQuota

Create the file `app/resourcequota.yaml`:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: hello-prod-quota
  namespace: hello-prod
spec:
  hard:
    requests.cpu: "1"
    requests.memory: 512Mi
    limits.cpu: "2"
    limits.memory: 1Gi
    pods: "10"
```

This quota says: within the `hello-prod` namespace, all Pods combined cannot exceed:
- **1 CPU** in requests, **2 CPU** in limits
- **512Mi** memory in requests, **1Gi** in limits
- **10 Pods** total

Apply it:

```bash
kubectl apply -f app/resourcequota.yaml
```

Verify:

```bash
kubectl describe resourcequota hello-prod-quota -n hello-prod
```

Expected output:

```
Name:            hello-prod-quota
Namespace:       hello-prod
Resource         Used   Hard
--------         ----   ----
limits.cpu       0      2
limits.memory    0      1Gi
pods             0      10
requests.cpu     0      1
requests.memory  0      512Mi
```

---

## Step 2: Create a LimitRange

Create the file `app/limitrange.yaml`:

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: hello-prod-limits
  namespace: hello-prod
spec:
  limits:
  - type: Container
    default:
      cpu: 200m
      memory: 128Mi
    defaultRequest:
      cpu: 50m
      memory: 64Mi
    max:
      cpu: 500m
      memory: 256Mi
    min:
      cpu: 25m
      memory: 32Mi
```

This LimitRange sets:
- **Defaults:** If a container doesn't specify resources, it gets `200m` CPU / `128Mi` memory as limits
- **Default requests:** `50m` CPU / `64Mi` memory
- **Max/Min:** No container can request more than `500m` CPU / `256Mi` memory, or less than `25m` / `32Mi`

Apply it:

```bash
kubectl apply -f app/limitrange.yaml
```

Verify:

```bash
kubectl describe limitrange hello-prod-limits -n hello-prod
```

---

## Step 3: Test the Constraints

First, clean up any existing deployments in the namespace, then re-deploy:

```bash
kubectl delete deployment hello-app -n hello-prod --ignore-not-found
kubectl apply -f app/deployment.yaml -n hello-prod
kubectl rollout status deployment/hello-app -n hello-prod
```

Check that the LimitRange injected default resources:

```bash
kubectl get pods -n hello-prod -l app=hello-app -o jsonpath='{.items[0].spec.containers[0].resources}' | python3 -m json.tool
```

You should see the LimitRange defaults applied automatically.

---

## Step 4: Test Quota Enforcement

Check remaining capacity:

```bash
kubectl describe resourcequota hello-prod-quota -n hello-prod
```

The "Used" column should now show resources consumed by the hello-app Pods.

Try to exceed the quota by scaling the Deployment beyond what the quota allows:

```bash
# Scale up — some replicas will fail to schedule if they exceed the quota
kubectl scale deployment hello-app --replicas=15 -n hello-prod
```

Check the ReplicaSet events:

```bash
kubectl get events -n hello-prod --sort-by='.lastTimestamp' | tail -5
```

You'll see quota exceeded errors for Pods that couldn't be created.

Scale back down:

```bash
kubectl scale deployment hello-app --replicas=3 -n hello-prod
```

---

## Useful Commands

| Command | Purpose |
|---|---|
| `kubectl get resourcequota -n <ns>` | List quotas in a namespace |
| `kubectl describe resourcequota <name> -n <ns>` | See quota usage vs limits |
| `kubectl get limitrange -n <ns>` | List limit ranges in a namespace |
| `kubectl describe limitrange <name> -n <ns>` | See default/min/max settings |

---

## What You Learned

| Concept | What you did |
|---|---|
| **ResourceQuota** | Capped total CPU, memory, and Pod count for `hello-prod` |
| **LimitRange** | Set default and min/max per-container resources |
| **Quota enforcement** | Saw Kubernetes reject Pods that exceed the quota |
| **Auto-injection** | Verified LimitRange injects defaults into Pods without explicit resources |

---

**Next up:** [GitOps Overview →](./03-gitops-overview.md)
