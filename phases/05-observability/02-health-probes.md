# Health Probes

Health probes let Kubernetes automatically detect when your app is broken, not ready, or still starting up — and take action without human intervention. They are essential for production-grade deployments.

---

## Why Probes Matter

Without probes, Kubernetes has no idea if your app is actually working. A container can be "Running" but completely broken (e.g., deadlocked, out of memory, lost database connection). Probes give Kubernetes the ability to:

- **Restart** broken containers automatically
- **Remove** unready Pods from Service traffic
- **Wait** for slow-starting apps before sending traffic

---

## The Three Probe Types

| Probe | Question It Answers | What Happens on Failure |
|---|---|---|
| **Liveness** | "Is the app alive?" | Kubernetes **restarts** the container |
| **Readiness** | "Is the app ready to serve traffic?" | Kubernetes **removes** the Pod from Service endpoints |
| **Startup** | "Has the app finished starting up?" | Kubernetes **waits** (liveness/readiness probes are paused) |

```
Pod Lifecycle with Probes:

  Container starts
       │
       ▼
  ┌─────────────┐     Failing?     ┌──────────────────┐
  │ Startup      │ ──────────────► │ Kill & restart    │
  │ Probe        │                 │ the container     │
  └──────┬──────┘                 └──────────────────┘
         │ Succeeds
         ▼
  ┌─────────────┐     Failing?     ┌──────────────────┐
  │ Readiness    │ ──────────────► │ Remove from       │
  │ Probe        │                 │ Service endpoints │
  └──────┬──────┘                 └──────────────────┘
         │ Succeeds
         ▼
  ┌─────────────┐     Failing?     ┌──────────────────┐
  │ Liveness     │ ──────────────► │ Kill & restart    │
  │ Probe        │                 │ the container     │
  └─────────────┘                 └──────────────────┘
```

---

## Probe Mechanisms

Kubernetes supports three ways to probe a container:

| Mechanism | How It Works | Best For |
|---|---|---|
| **HTTP GET** | Sends an HTTP request; 2xx = success | Web apps with health endpoints |
| **TCP Socket** | Tries to open a TCP connection | Databases, non-HTTP services |
| **Exec** | Runs a command inside the container; exit 0 = success | Complex checks (e.g., check a file exists) |

For our Node.js app, we'll use **HTTP GET** probes.

---

## Step 1: Understand the Probe-Enabled Deployment

Look at `app/deployment-with-probes.yaml`:

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
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 3
          periodSeconds: 5
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /startup
            port: 3000
          periodSeconds: 5
          failureThreshold: 30
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 200m
            memory: 128Mi
```

### Probe Configuration Explained

| Field | Meaning |
|---|---|
| `httpGet.path` | The HTTP endpoint to call |
| `httpGet.port` | The port to send the request to |
| `initialDelaySeconds` | Wait this long before the first probe |
| `periodSeconds` | How often to probe |
| `failureThreshold` | How many failures before taking action |
| `successThreshold` | How many successes needed to be considered healthy (default: 1) |
| `timeoutSeconds` | How long to wait for a response (default: 1s) |

> 💡 **Startup probe math:** With `periodSeconds: 5` and `failureThreshold: 30`, Kubernetes will wait up to **150 seconds** for the app to start. During this time, the liveness and readiness probes are **disabled**.

---

## Step 2: Deploy with Probes

First, rebuild the image (we added new endpoints in `server.js`):

```bash
eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

Now apply the probe-enabled Deployment:

```bash
kubectl apply -f app/deployment-with-probes.yaml
```

Watch the rollout:

```bash
kubectl rollout status deployment/hello-app
```

---

## Step 3: Verify Probes Are Configured

Use `kubectl describe` to confirm the probes are set:

```bash
kubectl describe deployment hello-app
```

Look for the **Liveness**, **Readiness**, and **Startup** sections in the output:

```
    Liveness:     http-get http://:3000/health delay=5s timeout=1s period=10s #success=1 #failure=3
    Readiness:    http-get http://:3000/ready delay=3s timeout=1s period=5s #success=1 #failure=3
    Startup:      http-get http://:3000/startup delay=0s timeout=1s period=5s #success=1 #failure=30
```

You can also check individual Pods:

```bash
# Get a Pod name
kubectl get pods -l app=hello-app

# Describe a specific Pod
kubectl describe pod <pod-name>
```

---

## Step 4: See Probes in Action

Check the Events section at the bottom of `kubectl describe pod`:

```bash
kubectl describe pod <pod-name> | tail -20
```

For a healthy Pod, you won't see probe failure events — which is good! You'll see normal startup events like:

```
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  1m    default-scheduler  Successfully assigned default/hello-app-xxx to minikube
  Normal  Pulled     1m    kubelet            Container image "kube-trainer-app:latest" already present
  Normal  Created    1m    kubelet            Created container hello-app
  Normal  Started    1m    kubelet            Started container hello-app
```

---

## Step 5: Simulate a Liveness Probe Failure

To see what happens when a liveness probe fails, let's create a deliberately broken deployment:

```bash
# Patch the Deployment to use a bad liveness probe path
kubectl patch deployment hello-app --type='json' -p='[
  {"op": "replace", "path": "/spec/template/spec/containers/0/livenessProbe/httpGet/path", "value": "/does-not-exist"}
]'
```

Watch the Pods:

```bash
kubectl get pods -l app=hello-app -w
```

After about 30 seconds (initialDelay + 3 failures × 10s period), you'll see containers restarting:

```
NAME                         READY   STATUS    RESTARTS   AGE
hello-app-xxxxx-aaaaa        1/1     Running   1 (5s ago)  2m
hello-app-xxxxx-bbbbb        1/1     Running   0           2m
hello-app-xxxxx-ccccc        0/1     Running   1 (2s ago)  2m
```

Check the events:

```bash
kubectl describe pod <pod-name> | grep -A 5 "Liveness"
```

You'll see:

```
Warning  Unhealthy  30s  kubelet  Liveness probe failed: HTTP probe failed with statuscode: 404
Normal   Killing    30s  kubelet  Container hello-app failed liveness probe, will be restarted
```

Press `Ctrl+C` to stop watching.

### Fix It

Restore the correct probe path:

```bash
kubectl apply -f app/deployment-with-probes.yaml
kubectl rollout status deployment/hello-app
```

---

## When to Use Each Probe

| Scenario | Probe |
|---|---|
| App might deadlock or hang | **Liveness** — restarts the container |
| App needs to warm up caches or load data before serving | **Readiness** — prevents traffic until ready |
| App takes a long time to start (e.g., JVM, large model) | **Startup** — prevents liveness from killing a slow starter |
| Simple health check for a web server | **Liveness + Readiness** (can use the same endpoint) |
| Graceful shutdown: draining connections | **Readiness** — returns failure during shutdown grace period |

> ⚠️ **Common mistake:** Using the **same endpoint** for liveness and readiness. Your readiness probe might check dependencies (database, cache) while the liveness probe should only check if the process is alive. If your liveness probe checks the database, a database outage will cause all Pods to restart — making things worse!

---

## What You Learned

| Concept | What you did |
|---|---|
| **Liveness probe** | Configured HTTP GET to `/health` — restarts on failure |
| **Readiness probe** | Configured HTTP GET to `/ready` — removes from traffic on failure |
| **Startup probe** | Configured HTTP GET to `/startup` — protects slow starters |
| **Probe parameters** | Set `initialDelaySeconds`, `periodSeconds`, `failureThreshold` |
| **Failure simulation** | Patched a bad probe path to see Kubernetes restart containers |

---

**Next up:** [Resource Monitoring →](./03-resource-monitoring.md)
