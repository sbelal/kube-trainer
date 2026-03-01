# Resource Monitoring

Knowing how much CPU and memory your Pods consume is critical for right-sizing your deployments, preventing OOM kills, and planning capacity. Kubernetes provides built-in tools for this — you just need to enable them.

---

## The Metrics Pipeline

Kubernetes doesn't collect resource metrics by default. You need the **Metrics Server** — a lightweight component that scrapes resource usage from the kubelet on each node.

```
┌────────────┐    scrape     ┌─────────────────┐    query     ┌──────────────┐
│  kubelet   │ ◄──────────── │ Metrics Server  │ ◄─────────── │ kubectl top  │
│ (per node) │               │ (cluster-wide)  │              │ (your CLI)   │
└────────────┘               └─────────────────┘              └──────────────┘
```

> 💡 **In production**, you'd use Prometheus + Grafana for full monitoring. Metrics Server is the lightweight built-in option for basic usage data.

---

## Step 1: Enable Metrics Server

In minikube, Metrics Server is available as an addon:

```bash
minikube addons enable metrics-server
```

Verify it's running:

```bash
kubectl get pods -n kube-system -l k8s-app=metrics-server
```

You should see a Pod in **Running** status:

```
NAME                              READY   STATUS    RESTARTS   AGE
metrics-server-xxxxxxxxxx-xxxxx   1/1     Running   0          30s
```

> ⚠️ **Wait 1–2 minutes** after enabling before using `kubectl top`. The Metrics Server needs time to start collecting data.

---

## Step 2: Monitor Node Resources

See how much CPU and memory your cluster nodes are using:

```bash
kubectl top nodes
```

Output:

```
NAME       CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
minikube   250m         12%    1200Mi          60%
```

| Column | Meaning |
|---|---|
| `CPU(cores)` | Current CPU usage (e.g., `250m` = 0.25 CPU cores) |
| `CPU%` | Percentage of allocatable CPU |
| `MEMORY(bytes)` | Current memory usage |
| `MEMORY%` | Percentage of allocatable memory |

> 💡 **CPU units:** `1000m` (millicores) = 1 full CPU core. So `250m` = 25% of one core.

---

## Step 3: Monitor Pod Resources

See how much each Pod is consuming:

```bash
kubectl top pods
```

Output:

```
NAME                         CPU(cores)   MEMORY(bytes)
hello-app-xxxxxxxxxx-aaaaa   2m           25Mi
hello-app-xxxxxxxxxx-bbbbb   1m           24Mi
hello-app-xxxxxxxxxx-ccccc   3m           26Mi
```

### Filter by Label

```bash
kubectl top pods -l app=hello-app
```

### Sort by CPU or Memory

```bash
# Sort by CPU usage (highest first)
kubectl top pods --sort-by=cpu

# Sort by memory usage (highest first)
kubectl top pods --sort-by=memory
```

### View Container-Level Metrics

If a Pod has multiple containers, use `--containers`:

```bash
kubectl top pods --containers
```

---

## Step 4: Understand Resource Requests and Limits

In the `deployment-with-probes.yaml`, we defined resources:

```yaml
resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    cpu: 200m
    memory: 128Mi
```

| Field | Purpose | What Happens |
|---|---|---|
| **Requests** | Minimum guaranteed resources | Used by the **scheduler** to place the Pod on a node with enough capacity |
| **Limits** | Maximum allowed resources | Pod is **throttled** (CPU) or **OOM-killed** (memory) if it exceeds this |

```
                  Requests          Limits
                     │                 │
    0m ──────────────┼─────────────────┼──────── max
                     │                 │
              "Reserve this      "Never use more
               much for me"       than this"
```

### Why Requests and Limits Matter

| Without Requests | Without Limits |
|---|---|
| Scheduler can't make smart decisions | A misbehaving Pod can consume all node resources |
| Pod might land on an overloaded node | Other Pods on the same node get starved |
| Unpredictable performance | Cascading failures across the cluster |

> ⚠️ **Best practice:** Always set resource requests. Set limits for memory (to prevent OOM kills affecting other Pods). CPU limits are debated — some teams omit them to avoid throttling.

---

## Step 5: Compare Usage vs. Requests

With `kubectl top` and the manifest, you can check if your resources are right-sized:

```bash
# Current usage
kubectl top pods -l app=hello-app

# What we requested
kubectl get deployment hello-app -o jsonpath='{.spec.template.spec.containers[0].resources}'
```

| Metric | Requested | Limit | Actual Usage |
|---|---|---|---|
| CPU | 50m | 200m | ~2-3m |
| Memory | 64Mi | 128Mi | ~25Mi |

> 💡 In this demo app, the actual usage is well below requests. In production, you'd tune requests closer to actual usage (with headroom) to avoid wasting cluster resources.

---

## QoS Classes

Kubernetes assigns a **Quality of Service** class to each Pod based on its resource configuration:

| QoS Class | Condition | Eviction Priority |
|---|---|---|
| **Guaranteed** | Every container has requests = limits for CPU and memory | Last to be evicted |
| **Burstable** | At least one container has requests or limits (but they don't match) | Middle |
| **BestEffort** | No requests or limits set | First to be evicted |

Check your Pod's QoS class:

```bash
kubectl get pod <pod-name> -o jsonpath='{.status.qosClass}'
```

Our deployment has requests ≠ limits, so it's **Burstable**.

---

## What You Learned

| Concept | What you did |
|---|---|
| **Metrics Server** | Enabled the addon in minikube for resource metrics |
| **kubectl top nodes** | Monitored cluster-wide CPU and memory usage |
| **kubectl top pods** | Monitored per-Pod resource consumption |
| **Resource requests** | Understood the scheduler's guaranteed minimum |
| **Resource limits** | Understood the maximum CPU/memory cap |
| **QoS classes** | Learned how Kubernetes prioritizes Pods during eviction |

---

**Next up:** [Debugging Techniques →](./04-debugging-techniques.md)
