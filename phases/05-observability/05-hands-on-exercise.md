# Hands-On Exercise: Observability

Time to put everything together! In this exercise, you'll deploy the application with full observability features and work through a realistic debugging scenario.

---

## Objectives

By the end of this exercise, you should have:

- ✅ Deployed the app with liveness, readiness, and startup probes
- ✅ Verified probes are configured correctly
- ✅ Enabled the Metrics Server and checked resource usage
- ✅ Used `kubectl logs`, `describe`, and `exec` to investigate Pods
- ✅ Debugged and fixed a broken deployment

---

## Setup

### 1. Ensure Your Cluster Is Running

```bash
minikube status
```

If it's not running: `minikube start`

### 2. Build the Latest Image

The app has been updated with new endpoints (`/ready`, `/startup`) and request logging:

```bash
eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

### 3. Enable Metrics Server

```bash
minikube addons enable metrics-server
```

---

## Part 1: Deploy with Probes

Apply the probe-enabled Deployment:

```bash
kubectl apply -f app/deployment-with-probes.yaml
```

Wait for it to be ready:

```bash
kubectl rollout status deployment/hello-app
```

Verify all Pods are running:

```bash
kubectl get pods -l app=hello-app
```

All 3 Pods should show `1/1 READY` and `STATUS Running`.

---

## Part 2: Verify Probes

Confirm all three probes are configured:

```bash
kubectl describe deployment hello-app | grep -A 3 'Liveness\|Readiness\|Startup'
```

You should see:

```
    Liveness:     http-get http://:3000/health delay=5s timeout=1s period=10s #success=1 #failure=3
    Readiness:    http-get http://:3000/ready delay=3s timeout=1s period=5s #success=1 #failure=3
    Startup:      http-get http://:3000/startup delay=0s timeout=1s period=5s #success=1 #failure=30
```

---

## Part 3: Check Logs

View logs from the Deployment:

```bash
kubectl logs deployment/hello-app --tail=10
```

You should see startup messages and probe request logs (probes generate HTTP requests that are logged).

View logs from all Pods with prefixes:

```bash
kubectl logs -l app=hello-app --prefix --tail=5
```

---

## Part 4: Monitor Resources

Wait 1–2 minutes after enabling Metrics Server, then check resource usage:

```bash
# Node-level
kubectl top nodes

# Pod-level
kubectl top pods -l app=hello-app
```

Verify the Deployment has resource requests configured:

```bash
kubectl get deployment hello-app -o jsonpath='{.spec.template.spec.containers[0].resources}' | python3 -m json.tool
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

## Part 5: Debug an Intentional Failure

Let's create a broken deployment and fix it.

### Create the Problem

```bash
# Create a broken Pod
kubectl run broken-app --image=kube-trainer-app:latest --env="PORT=abc" -- node /app/server.js
```

This starts the app with an invalid port, which may cause unexpected behavior.

### Investigate

```bash
# Check status
kubectl get pod broken-app

# Check events
kubectl describe pod broken-app | tail -15

# Check logs
kubectl logs broken-app
```

### Clean Up

```bash
kubectl delete pod broken-app
```

---

## Part 6: Shell into a Pod

Get inside a running Pod to explore:

```bash
# Get a Pod name
POD_NAME=$(kubectl get pods -l app=hello-app -o jsonpath='{.items[0].metadata.name}')

# Shell in
kubectl exec -it $POD_NAME -- sh
```

Once inside:

```bash
# Check the running process
ps aux

# Check your environment
env | grep PORT

# Hit the health endpoint locally
wget -qO- http://localhost:3000/health

# Check the readiness endpoint
wget -qO- http://localhost:3000/ready

# Exit
exit
```

---

## Verification

Run the phase verification to check your progress:

```bash
node verify-phase.js 5
```

All checks should pass:

- ✅ Deployment has a liveness probe configured
- ✅ Deployment has a readiness probe configured
- ✅ Deployment has a startup probe configured
- ✅ Metrics Server is running
- ✅ Deployment has resource requests configured

---

## What You Accomplished

| Task | Status |
|---|---|
| Deployed with health probes | ✅ |
| Verified probe configuration | ✅ |
| Enabled Metrics Server | ✅ |
| Monitored CPU/memory usage | ✅ |
| Inspected logs across Pods | ✅ |
| Debugged a broken Pod | ✅ |
| Used kubectl exec for investigation | ✅ |

---

## Summary

In this phase, you learned the core observability tools:

| Tool | Purpose |
|---|---|
| **kubectl logs** | View container output — first thing to check |
| **Health probes** | Automated health checks — Kubernetes acts without you |
| **kubectl top** | Resource usage monitoring — right-size your Pods |
| **kubectl describe** | Detailed resource info — read the Events section |
| **kubectl exec** | Get inside a container — last-resort investigation |

These tools will be your daily companions when working with Kubernetes in any environment.

---

🎉 **Phase 5 Complete!** You now have a solid foundation in Kubernetes observability.

---

**Next up:** [Jobs →](../06-advanced-workloads/01-jobs.md)
