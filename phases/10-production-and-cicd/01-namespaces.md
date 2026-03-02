# Namespaces

Namespaces are Kubernetes' built-in mechanism for dividing a single cluster into multiple **virtual clusters**. They provide isolation, organization, and access control for teams, environments, and applications.

---

## Why Namespaces Matter

Without namespaces, every resource lives in one big pool:

```
Single Namespace (default):

  ┌──────────────────────────────────────┐
  │  frontend-deploy   backend-deploy    │
  │  redis-deploy      monitoring-pod    │
  │  test-pod          debug-pod         │
  │  💥 Name collisions, no isolation   │
  └──────────────────────────────────────┘

With Namespaces:

  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  production  │  │   staging    │  │  monitoring  │
  │  frontend    │  │  frontend    │  │  prometheus  │
  │  backend     │  │  backend     │  │  grafana     │
  │  ✅ Isolated │  │  ✅ Isolated │  │  ✅ Isolated │
  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Default Namespaces

Every Kubernetes cluster starts with four namespaces:

| Namespace | Purpose |
|---|---|
| **default** | Where resources go if you don't specify a namespace |
| **kube-system** | Kubernetes system components (API server, scheduler, etc.) |
| **kube-public** | Publicly readable data (rarely used directly) |
| **kube-node-lease** | Node heartbeat tracking for the control plane |

> 💡 **Production tip:** Never deploy application workloads into `kube-system`. Create dedicated namespaces for your apps.

---

## Prerequisites

Make sure your cluster is running:

```bash
minikube status
```

If it's not running: `minikube start`

Build the latest image:

```bash
eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

---

## Step 1: List Existing Namespaces

```bash
kubectl get namespaces
```

You'll see the four default namespaces:

```
NAME              STATUS   AGE
default           Active   10d
kube-node-lease   Active   10d
kube-public       Active   10d
kube-system       Active   10d
```

---

## Step 2: Create a Namespace

Create the file `app/namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: hello-prod
  labels:
    env: production
    team: hello
```

Apply it:

```bash
kubectl apply -f app/namespace.yaml
```

Verify:

```bash
kubectl get namespace hello-prod
```

You can also create namespaces imperatively:

```bash
# Imperative (quick but not declarative)
kubectl create namespace hello-staging
```

---

## Step 3: Deploy into a Namespace

Deploy the hello-app into the `hello-prod` namespace:

```bash
kubectl apply -f app/deployment.yaml -n hello-prod
kubectl apply -f app/clusterip-service.yaml -n hello-prod
kubectl rollout status deployment/hello-app -n hello-prod
```

Verify the Pods are in the right namespace:

```bash
kubectl get pods -n hello-prod
```

> 💡 **Key insight:** Resources in different namespaces are completely independent. You can have a `hello-app` Deployment in both `default` and `hello-prod` — they don't conflict.

---

## Step 4: Switch Your Default Namespace

Instead of typing `-n hello-prod` every time, you can switch your default context:

```bash
# Set default namespace for the current context
kubectl config set-context --current --namespace=hello-prod

# Now all commands target hello-prod by default
kubectl get pods
# Shows pods in hello-prod

# Switch back to default
kubectl config set-context --current --namespace=default
```

---

## Step 5: Cross-Namespace Communication

Services can be accessed across namespaces using their fully qualified DNS name:

```
<service-name>.<namespace>.svc.cluster.local
```

For example, to reach the hello-app service from another namespace:

```bash
# From any namespace, you can reach hello-app in hello-prod:
# hello-app-clusterip.hello-prod.svc.cluster.local:3000
```

Test it:

```bash
kubectl run dns-test --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s --max-time 5 http://hello-app-clusterip.hello-prod.svc.cluster.local:3000/health
```

---

## Step 6: Clean Up the Staging Namespace

Remove the imperatively created namespace (keep `hello-prod` — we need it for later lessons):

```bash
kubectl delete namespace hello-staging
```

> ⚠️ **Warning:** Deleting a namespace deletes **everything** inside it — all Pods, Services, Deployments, ConfigMaps, Secrets, etc. Be very careful in production.

---

## Useful Commands

| Command | Purpose |
|---|---|
| `kubectl get namespaces` | List all namespaces |
| `kubectl create namespace <name>` | Create a namespace imperatively |
| `kubectl get pods -n <namespace>` | List Pods in a specific namespace |
| `kubectl get all -n <namespace>` | List all resources in a namespace |
| `kubectl config set-context --current --namespace=<ns>` | Switch default namespace |
| `kubectl delete namespace <name>` | Delete a namespace and everything in it |

---

## What You Learned

| Concept | What you did |
|---|---|
| **Namespaces** | Understood virtual cluster isolation |
| **Default namespaces** | Identified the four built-in namespaces |
| **Creating namespaces** | Created `hello-prod` declaratively and `hello-staging` imperatively |
| **Deploying into namespaces** | Deployed hello-app into `hello-prod` |
| **Cross-namespace DNS** | Accessed a service across namespaces using FQDN |

---

**Next up:** [Resource Quotas & Limit Ranges →](./02-resource-quotas-and-limit-ranges.md)
