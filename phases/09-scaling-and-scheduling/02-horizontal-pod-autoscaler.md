# Horizontal Pod Autoscaler (HPA)

The Horizontal Pod Autoscaler automatically scales the number of Pods in a Deployment based on observed metrics like CPU utilization. Instead of manually running `kubectl scale`, HPA does it for you — reacting to real traffic patterns.

---

## How HPA Works

HPA runs a **control loop** that:

1. **Reads metrics** from the metrics-server (CPU, memory, or custom metrics)
2. **Calculates** the desired replica count based on target utilization
3. **Scales** the Deployment up or down to meet the target

```
┌─────────────────────────────────────────────────────────────┐
│                     HPA Control Loop                         │
│                                                              │
│   metrics-server ──► HPA controller ──► Deployment          │
│   (CPU: 80%)         "Target is 50%"    "Scale to 5 pods"   │
│                       desired =                              │
│                       current × (80/50)                      │
│                       = 3 × 1.6 = 5                          │
│                                                              │
│   Every 15 seconds (default)                                 │
└─────────────────────────────────────────────────────────────┘
```

### The Scaling Formula

```
desiredReplicas = ceil( currentReplicas × (currentMetricValue / targetMetricValue) )
```

For example:
- 3 replicas running at 80% CPU average
- Target is 50% CPU
- Desired = ceil(3 × 80/50) = ceil(4.8) = **5 replicas**

> 💡 **Cooldown periods:** HPA won't scale down immediately after scaling up. By default, it waits **5 minutes** before scaling down to prevent flapping (rapid scale up/down cycles).

---

## Prerequisites

Ensure your cluster is running with metrics-server enabled:

```bash
minikube status
minikube addons enable metrics-server
```

Deploy the app with resource requests (required for CPU-based HPA):

```bash
eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..

kubectl apply -f app/deployment-with-resources.yaml
kubectl rollout status deployment/hello-app
kubectl apply -f app/clusterip-service.yaml
```

> ⚠️ **Important:** HPA requires resource **requests** to be set on your containers. Without them, HPA can't calculate CPU percentage utilization.

---

## Step 1: Create the HPA Manifest

Create the file `app/hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hello-app-hpa
  labels:
    app: hello-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hello-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
```

### Key Fields

| Field | Value | Meaning |
|---|---|---|
| `scaleTargetRef` | Deployment/hello-app | Which workload to scale |
| `minReplicas` | 2 | Never scale below 2 Pods |
| `maxReplicas` | 10 | Never scale above 10 Pods |
| `averageUtilization` | 50 | Target 50% of the CPU request (50m × 50% = 25m per Pod) |

---

## Step 2: Apply the HPA

```bash
kubectl apply -f app/hpa.yaml
```

Check HPA status:

```bash
kubectl get hpa
```

Expected output (after metrics-server has collected data):

```
NAME            REFERENCE              TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
hello-app-hpa   Deployment/hello-app   2%/50%    2         10        3          30s
```

> 💡 **`<unknown>/50%` targets?** If you see `<unknown>` in the TARGETS column, wait 1–2 minutes for the metrics-server to start collecting data.

---

## Step 3: Inspect the HPA

Get detailed HPA information:

```bash
kubectl describe hpa hello-app-hpa
```

Look for:
- **Current metrics** — actual CPU utilization
- **Desired replicas** — what HPA wants to scale to
- **Conditions** — `ScalingActive`, `AbleToScale`, `ScalingLimited`

---

## Step 4: Watch HPA Scale Down

Since our hello-app has very low CPU usage at idle, HPA should scale the Deployment down to `minReplicas` (2):

```bash
# Watch the HPA in real time
kubectl get hpa hello-app-hpa -w
```

After the cooldown period (up to 5 minutes), you should see replicas decrease to 2:

```
NAME            REFERENCE              TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
hello-app-hpa   Deployment/hello-app   2%/50%    2         10        3          1m
hello-app-hpa   Deployment/hello-app   2%/50%    2         10        2          5m
```

Press `Ctrl+C` to stop watching.

Confirm the Deployment was scaled:

```bash
kubectl get deployment hello-app
```

---

## Step 5: Generate Load (Optional)

To see HPA scale *up*, you can generate load against the app:

```bash
# In a separate terminal, run a load generator
kubectl run load-generator --image=busybox --rm -it --restart=Never -- \
  /bin/sh -c "while true; do wget -q -O- http://hello-app-clusterip:3000/ > /dev/null; done"
```

In another terminal, watch the HPA:

```bash
kubectl get hpa hello-app-hpa -w
```

As CPU utilization rises above 50%, HPA will increase the replica count. When you stop the load generator (`Ctrl+C`), replicas will gradually scale back down after the cooldown.

---

## HPA vs Manual Scaling

| Feature | `kubectl scale` | HPA |
|---|---|---|
| Trigger | Manual command | Automatic (metric-based) |
| Adapts to traffic | No | Yes |
| Prevents over-provisioning | No | Yes (scales down when idle) |
| Prevents under-provisioning | No | Yes (scales up under load) |
| Use case | Quick testing | Production workloads |

---

## Useful Commands

| Command | Purpose |
|---|---|
| `kubectl get hpa` | List all HPAs |
| `kubectl describe hpa <name>` | Detailed HPA info with conditions |
| `kubectl get hpa <name> -w` | Watch HPA changes in real time |
| `kubectl delete hpa <name>` | Remove an HPA |
| `kubectl top pods` | Check current resource usage |

---

## What You Learned

| Concept | What you did |
|---|---|
| **HPA** | Created an autoscaler targeting 50% CPU utilization |
| **Scaling formula** | Understood how desired replicas are calculated |
| **Min/max replicas** | Set boundaries (2–10) for autoscaling |
| **Metrics-server** | Required backend for CPU/memory-based HPA |
| **Scale down** | Observed HPA reducing replicas when idle |

---

**Next up:** [Node Affinity →](./03-node-affinity.md)
