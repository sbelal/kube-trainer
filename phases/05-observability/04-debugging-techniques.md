# Debugging Techniques

When things go wrong in Kubernetes — and they will — you need a systematic approach to find and fix the problem. This lesson covers the essential debugging tools and techniques you'll use daily.

---

## The Debugging Workflow

When a Pod isn't behaving correctly, follow this flow:

```
  Something's wrong!
       │
       ▼
  kubectl get pods          ← What's the Pod STATUS?
       │
       ├── Pending          → Check events: scheduling issues
       ├── CrashLoopBackOff → Check logs: app is crashing
       ├── ImagePullBackOff → Check image name/registry
       ├── Running (but broken) → Check logs + describe
       │
       ▼
  kubectl describe pod      ← Read the Events section
       │
       ▼
  kubectl logs              ← What did the app say?
       │
       ▼
  kubectl exec              ← Get inside and investigate
```

---

## Step 1: Check Pod Status

Start by listing your Pods:

```bash
kubectl get pods -l app=hello-app
```

Healthy output looks like:

```
NAME                         READY   STATUS    RESTARTS   AGE
hello-app-xxxxxxxxxx-aaaaa   1/1     Running   0          5m
hello-app-xxxxxxxxxx-bbbbb   1/1     Running   0          5m
hello-app-xxxxxxxxxx-ccccc   1/1     Running   0          5m
```

### Common Bad Statuses

| Status | Meaning | Likely Cause |
|---|---|---|
| **Pending** | Pod can't be scheduled | Not enough resources on nodes, or no matching node |
| **CrashLoopBackOff** | Container keeps crashing | App error, bad command, missing dependency |
| **ImagePullBackOff** | Can't pull the container image | Wrong image name, registry auth issues |
| **ErrImagePull** | Failed to pull image | Same as above, initial failure |
| **OOMKilled** | Container exceeded memory limit | Memory limit too low or memory leak |
| **Evicted** | Node was under resource pressure | Other Pods consuming too much |

---

## Step 2: Describe the Pod

`kubectl describe` is your most powerful debugging tool. It shows everything about a resource:

```bash
kubectl describe pod <pod-name>
```

This outputs a lot of information. Focus on these key sections:

### Status & Conditions

```
Status:     Running
Conditions:
  Type              Status
  Initialized       True
  Ready             True
  ContainersReady   True
  PodScheduled      True
```

If any condition is `False`, that tells you exactly what's wrong.

### Events (Most Important!)

Scroll to the bottom — the **Events** section tells you what happened:

```
Events:
  Type     Reason     Age   From               Message
  ----     ------     ----  ----               -------
  Normal   Scheduled  5m    default-scheduler  Successfully assigned default/hello-app-xxx to minikube
  Normal   Pulled     5m    kubelet            Container image "kube-trainer-app:latest" already present
  Normal   Created    5m    kubelet            Created container hello-app
  Normal   Started    5m    kubelet            Started container hello-app
```

**Warning** events indicate problems:

```
  Warning  Unhealthy  30s  kubelet  Liveness probe failed: HTTP probe failed with statuscode: 404
  Warning  BackOff    10s  kubelet  Back-off restarting failed container
```

---

## Step 3: View Cluster Events

See all events across your namespace (not just one Pod):

```bash
# All events, sorted by time
kubectl get events --sort-by=.metadata.creationTimestamp

# Only warning events
kubectl get events --field-selector type=Warning

# Watch events in real time
kubectl get events -w
```

> 💡 **Events are ephemeral.** Kubernetes only keeps events for about 1 hour by default. If you need longer retention, use a monitoring solution.

---

## Step 4: Shell into a Running Container

Sometimes you need to get inside a container to investigate:

```bash
# Open a shell
kubectl exec -it <pod-name> -- sh
```

Once inside, you can:

```bash
# Check the filesystem
ls -la /app/

# Check environment variables
env

# Check network connectivity
wget -qO- http://hello-app-clusterip/health 2>/dev/null || echo "Cannot reach service"

# Check the running processes
ps aux

# Check the listening ports
netstat -tlnp 2>/dev/null || ss -tlnp

# Exit the container shell
exit
```

> 💡 **Our app uses `node:20-alpine`**, so common tools like `curl` might not be available. Use `wget` instead, or install tools with `apk add curl` (in alpine-based containers).

### Run a One-Off Command

You don't need an interactive shell for quick checks:

```bash
# Check environment variables
kubectl exec <pod-name> -- env

# Check if the app is listening
kubectl exec <pod-name> -- wget -qO- http://localhost:3000/health

# Check the Node.js process
kubectl exec <pod-name> -- ps aux
```

---

## Step 5: Debug a Broken Deployment

Let's practice debugging with an intentionally broken deployment. Create a Pod that will fail:

```bash
# Create a Pod with a non-existent image
kubectl run broken-app --image=does-not-exist:latest
```

Watch the status:

```bash
kubectl get pod broken-app -w
```

You'll see it cycle through `ErrImagePull` → `ImagePullBackOff`:

```
NAME         READY   STATUS             RESTARTS   AGE
broken-app   0/1     ImagePullBackOff   0          30s
```

Investigate with `describe`:

```bash
kubectl describe pod broken-app
```

In the Events section, you'll find:

```
Warning  Failed   15s  kubelet  Failed to pull image "does-not-exist:latest": ...
Warning  Failed   15s  kubelet  Error: ErrImagePull
Warning  BackOff  5s   kubelet  Back-off pulling image "does-not-exist:latest"
```

Clean up:

```bash
kubectl delete pod broken-app
```

---

## Step 6: Debug with Port Forwarding

Port forwarding lets you access a Pod directly from your machine — bypassing Services:

```bash
# Forward local port 8080 to Pod port 3000
kubectl port-forward <pod-name> 8080:3000
```

Then in another terminal:

```bash
curl http://localhost:8080/health
```

This is useful when:
- Your Service isn't working and you want to verify the Pod itself is fine
- You need to access a Pod's debug endpoint that isn't exposed via a Service
- You're developing and want quick access without setting up Services

Press `Ctrl+C` to stop port forwarding.

---

## Step 7: Ephemeral Debug Containers (Advanced)

For minimal container images (like `distroless` or `scratch`) that don't have a shell, you can use ephemeral debug containers:

```bash
# Attach a debug container to a running Pod
kubectl debug -it <pod-name> --image=busybox -- sh
```

> 💡 **Ephemeral containers** are temporary containers added to an existing Pod for debugging. They share the Pod's network namespace, so you can inspect network issues from inside.

> ⚠️ **Note:** Ephemeral containers require Kubernetes 1.25+ and are not available in all environments.

---

## Quick Reference: Debugging Commands

| Command | Purpose |
|---|---|
| `kubectl get pods` | Check Pod status |
| `kubectl describe pod <pod>` | Detailed Pod info + events |
| `kubectl logs <pod>` | View container stdout/stderr |
| `kubectl logs --previous <pod>` | Logs from crashed container |
| `kubectl exec -it <pod> -- sh` | Shell into a container |
| `kubectl exec <pod> -- <cmd>` | Run a command in a container |
| `kubectl get events` | Cluster-wide event stream |
| `kubectl port-forward <pod> local:remote` | Direct access to a Pod |
| `kubectl debug -it <pod> --image=busybox` | Attach a debug container |
| `kubectl get pod <pod> -o yaml` | Full Pod spec in YAML |

---

## What You Learned

| Concept | What you did |
|---|---|
| **Debugging workflow** | Followed a systematic approach: status → describe → logs → exec |
| **kubectl describe** | Read Pod conditions and events to identify issues |
| **kubectl exec** | Shelled into a container to inspect the runtime environment |
| **Cluster events** | Viewed and filtered cluster-wide events |
| **Common failures** | Debugged `ImagePullBackOff` and understood other failure modes |
| **Port forwarding** | Accessed a Pod directly for debugging |

---

**Next up:** [Hands-On Exercise: Observability →](./05-hands-on-exercise.md)
