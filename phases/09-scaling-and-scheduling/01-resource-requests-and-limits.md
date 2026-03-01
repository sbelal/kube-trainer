# Resource Requests & Limits

Every container in Kubernetes can declare how much **CPU** and **memory** it needs (requests) and the maximum it's allowed to use (limits). These settings drive scheduling decisions and protect your cluster from runaway workloads.

---

## Why Resources Matter

Without resource settings, Kubernetes has no idea how much capacity your app needs. This leads to:

- **Over-scheduling** — too many Pods on one node, causing resource starvation
- **Under-scheduling** — nodes sit idle because the scheduler can't make informed decisions
- **Noisy neighbors** — one Pod consuming all the CPU/memory and starving others

```
Without Resources:                    With Resources:

  Node (4 CPU, 8Gi)                     Node (4 CPU, 8Gi)
  ┌─────────────────┐                   ┌─────────────────┐
  │ Pod A: ???       │                   │ Pod A: 500m CPU  │
  │ Pod B: ???       │                   │ Pod B: 1 CPU     │
  │ Pod C: ???       │                   │ Pod C: 500m CPU  │
  │ Pod D: ???       │                   │ ── 2 CPU free ── │
  │ 💥 OOM Kill!    │                   │ ✅ Stable        │
  └─────────────────┘                   └─────────────────┘
```

---

## Requests vs Limits

| Setting | Purpose | Used By |
|---|---|---|
| **Requests** | Minimum resources guaranteed to the container | Scheduler (for placement decisions) |
| **Limits** | Maximum resources the container can use | Kubelet (enforces at runtime) |

- **CPU** is measured in **millicores** (`m`). `1000m` = 1 full CPU core. `500m` = half a core.
- **Memory** is measured in bytes. Use `Mi` (mebibytes) or `Gi` (gibibytes).

```yaml
resources:
  requests:
    cpu: 100m       # "I need at least 0.1 CPU"
    memory: 64Mi    # "I need at least 64 MiB"
  limits:
    cpu: 500m       # "Never use more than 0.5 CPU"
    memory: 128Mi   # "Never use more than 128 MiB"
```

> 💡 **What happens at the limit?**
> - **CPU limit hit** → the container is **throttled** (slowed down) but keeps running
> - **Memory limit hit** → the container is **OOM killed** (restarted)

---

## QoS Classes

Kubernetes assigns a **Quality of Service** class to each Pod based on its resource settings:

| QoS Class | Condition | Eviction Priority |
|---|---|---|
| **Guaranteed** | Every container has matching requests = limits for CPU & memory | Last to be evicted |
| **Burstable** | At least one container has requests or limits set (but not equal) | Middle priority |
| **BestEffort** | No requests or limits set on any container | First to be evicted |

```
Eviction Priority (node under pressure):

  First evicted ──► BestEffort   (no resources set)
                    Burstable    (some resources set)
  Last evicted  ──► Guaranteed   (requests = limits)
```

> ⚠️ **Production tip:** Always set resource requests at minimum. Without them, your Pods are BestEffort and will be the first to go under memory pressure.

---

## Prerequisites

Make sure your cluster is running:

```bash
minikube status
```

If it's not running: `minikube start`

Enable the metrics-server addon (needed for `kubectl top`):

```bash
minikube addons enable metrics-server
```

---

## Step 1: Create a Resource-Constrained Deployment

Create the file `app/deployment-with-resources.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-app
  labels:
    app: hello-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hello-app
  template:
    metadata:
      labels:
        app: hello-app
    spec:
      containers:
      - name: hello-app
        image: kube-trainer-app:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 200m
            memory: 128Mi
```

Apply it:

```bash
kubectl apply -f app/deployment-with-resources.yaml
kubectl rollout status deployment/hello-app
```

---

## Step 2: Verify Resource Settings

Check the Pod spec to confirm resources are set:

```bash
kubectl get pods -l app=hello-app -o jsonpath='{.items[0].spec.containers[0].resources}' | python3 -m json.tool
```

Expected output:

```json
{
    "limits": {
        "cpu": "200m",
        "memory": "128Mi"
    },
    "requests": {
        "cpu": "50m",
        "memory": "64Mi"
    }
}
```

---

## Step 3: Check the QoS Class

```bash
kubectl get pods -l app=hello-app -o jsonpath='{.items[0].status.qosClass}'
```

Since requests ≠ limits, this should output `Burstable`.

> 💡 **Try it:** If you set `requests` = `limits` (e.g., both CPU 200m, both memory 128Mi), the QoS class would change to `Guaranteed`.

---

## Step 4: Monitor Resource Usage

After the metrics-server has been running for a minute or two, check actual resource usage:

```bash
# Pod-level resource usage
kubectl top pods -l app=hello-app

# Node-level resource usage
kubectl top nodes
```

Example output:

```
NAME                      CPU(cores)   MEMORY(bytes)
hello-app-xxxxx-aaaaa     1m           15Mi
hello-app-xxxxx-bbbbb     1m           14Mi
hello-app-xxxxx-ccccc     1m           15Mi
```

---

## Step 5: See Scheduling with Resources

Check how the scheduler placed Pods based on available resources:

```bash
kubectl describe nodes minikube | grep -A 10 "Allocated resources"
```

This shows:
- Total **requests** summed across all Pods on the node
- How much capacity remains for new Pods

---

## Useful Commands

| Command | Purpose |
|---|---|
| `kubectl top pods` | View actual CPU/memory usage |
| `kubectl top nodes` | View node-level resource usage |
| `kubectl describe pod <name>` | See resource settings and QoS class |
| `kubectl get pod <name> -o jsonpath='{.status.qosClass}'` | Get QoS class directly |
| `kubectl describe node <name>` | See allocated vs allocatable resources |

---

## What You Learned

| Concept | What you did |
|---|---|
| **Requests** | Set minimum CPU (50m) and memory (64Mi) for scheduling |
| **Limits** | Set maximum CPU (200m) and memory (128Mi) for enforcement |
| **QoS classes** | Understood Guaranteed, Burstable, and BestEffort |
| **kubectl top** | Monitored actual resource usage with metrics-server |
| **Scheduling** | Saw how the scheduler uses requests for placement |

---

**Next up:** [Horizontal Pod Autoscaler →](./02-horizontal-pod-autoscaler.md)
