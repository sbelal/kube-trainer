# Container Logging

Logs are your first line of defense when something goes wrong. In Kubernetes, container stdout and stderr are captured automatically — you just need to know how to access them.

---

## How Kubernetes Logging Works

When a container writes to **stdout** or **stderr**, Kubernetes captures those streams and stores them on the node. You access them with `kubectl logs`.

```
┌─────────────────────────────────────────────────────────┐
│                     Kubernetes Node                     │
│                                                         │
│   ┌──────────┐     stdout/stderr     ┌──────────────┐  │
│   │   Pod     │ ──────────────────►  │  Log Files   │  │
│   │ (app)     │                      │  (on node)   │  │
│   └──────────┘                       └──────┬───────┘  │
│                                              │          │
│                                    kubectl logs         │
│                                              │          │
└──────────────────────────────────────────────┼──────────┘
                                               ▼
                                        Your terminal
```

> 💡 **Key insight:** Kubernetes doesn't manage long-term log storage. Node-level logs are rotated and eventually lost. For production, you'd use a log aggregation system (EFK stack, Loki, etc.) — but `kubectl logs` is perfect for development and debugging.

---

## Prerequisites

Make sure your Deployment is running:

```bash
# Check your cluster
minikube status

# Ensure your image is built inside minikube
eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..

# Apply the Deployment
kubectl apply -f app/deployment.yaml
```

---

## Step 1: View Pod Logs

Get the name of a running Pod:

```bash
kubectl get pods -l app=hello-app
```

View its logs:

```bash
# Replace with your actual Pod name
kubectl logs <pod-name>
```

You should see the startup message:

```
🧊 Kube-Trainer app listening on http://localhost:3000
   Hostname: hello-app-xxxxxxxxxx-xxxxx
   Endpoints: / | /health | /ready | /startup
```

> 💡 **Tip:** You don't need to copy the full Pod name. You can use a Deployment reference instead:
>
> ```bash
> kubectl logs deployment/hello-app
> ```
>
> This shows logs from one of the Deployment's Pods.

---

## Step 2: Generate Some Log Traffic

Let's create some log entries by hitting the app's endpoints:

```bash
# Run a temporary Pod to send requests
kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -- \
  sh -c 'for i in 1 2 3 4 5; do curl -s http://hello-app-clusterip/health; echo; sleep 1; done'
```

> ⚠️ **Note:** This requires the `hello-app-clusterip` Service from Phase 3. If you don't have it, you can port-forward instead:
>
> ```bash
> kubectl port-forward deployment/hello-app 8080:3000 &
> curl http://localhost:8080/health
> ```

Now check the logs again:

```bash
kubectl logs deployment/hello-app
```

You should see timestamped request logs like:

```
[2025-01-15T10:30:45.123Z] GET /health — from 172.17.0.5
[2025-01-15T10:30:46.234Z] GET /health — from 172.17.0.5
```

---

## Step 3: Follow Logs in Real Time

Use the `-f` flag to stream logs (like `tail -f`):

```bash
kubectl logs -f deployment/hello-app
```

While this is running in one terminal, open another and generate traffic:

```bash
kubectl run curl-test2 --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s http://hello-app-clusterip/health
```

You'll see the log entry appear instantly in the first terminal. Press `Ctrl+C` to stop following.

---

## Step 4: View Logs from All Pods

When you have multiple replicas, `kubectl logs deployment/hello-app` only shows logs from **one** Pod. To see logs from **all** Pods matching a label:

```bash
kubectl logs -l app=hello-app --all-containers=true
```

Add `--prefix` to see which Pod each line comes from:

```bash
kubectl logs -l app=hello-app --all-containers=true --prefix
```

Output:

```
[pod/hello-app-xxxxx-aaaaa/hello-app] [2025-01-15T10:30:45.123Z] GET /health — from 172.17.0.5
[pod/hello-app-xxxxx-bbbbb/hello-app] 🧊 Kube-Trainer app listening on http://localhost:3000
```

---

## Step 5: View Previous Container Logs

If a container crashes and restarts, its current logs are from the **new** container. To see logs from the **previous** (crashed) container:

```bash
kubectl logs <pod-name> --previous
```

> 💡 **When to use `--previous`:** When you see a Pod in `CrashLoopBackOff` status and want to know what happened before the crash.

---

## Step 6: Limit Log Output

For Pods with lots of logs, you can limit the output:

```bash
# Show only the last 20 lines
kubectl logs deployment/hello-app --tail=20

# Show logs from the last 5 minutes
kubectl logs deployment/hello-app --since=5m

# Show logs from the last hour
kubectl logs deployment/hello-app --since=1h
```

---

## Useful kubectl logs Flags

| Flag | Purpose | Example |
|---|---|---|
| `-f` | Follow (stream) logs in real time | `kubectl logs -f <pod>` |
| `--previous` | Logs from the previous container instance | `kubectl logs --previous <pod>` |
| `--tail=N` | Show only the last N lines | `kubectl logs --tail=50 <pod>` |
| `--since=T` | Show logs from the last T (e.g., 5m, 1h) | `kubectl logs --since=10m <pod>` |
| `-l` | Select Pods by label | `kubectl logs -l app=hello-app` |
| `--all-containers` | Include all containers in the Pod | `kubectl logs -l app=hello-app --all-containers` |
| `--prefix` | Prefix each line with the Pod/container name | `kubectl logs -l app=hello-app --prefix` |
| `-c` | Logs from a specific container (multi-container Pods) | `kubectl logs <pod> -c sidecar` |

---

## What You Learned

| Concept | What you did |
|---|---|
| **Container logging** | Kubernetes captures stdout/stderr automatically |
| **kubectl logs** | Viewed logs from a Pod and a Deployment |
| **Log following** | Streamed logs in real time with `-f` |
| **Multi-Pod logs** | Used `-l` and `--prefix` to view logs across replicas |
| **Previous logs** | Accessed crashed container logs with `--previous` |
| **Log filtering** | Limited output with `--tail` and `--since` |

---

**Next up:** [Health Probes →](./02-health-probes.md)
