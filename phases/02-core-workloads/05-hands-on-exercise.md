# Hands-On Exercise: Phase 2 Checkpoint

Time to put it all together. In this exercise you'll set up the final state that the Phase 2 verifier checks for. If you've been following along with the previous lessons, most of this should already be done.

---

## Objectives

By the end of this exercise, you should have:

1. ✅ The standalone `hello-app` Pod from Phase 1 **cleaned up**
2. ✅ A `hello-app` **Deployment** running with **3 replicas**
3. ✅ All 3 Pods in **Running** state
4. ✅ At least one rollout in the **deployment history**

---

## Step 1: Clean Up the Standalone Pod

The Phase 1 exercise had you create a bare Pod with `kubectl apply -f app/pod.yaml`. Deployments are the proper way to manage Pods, so let's remove the standalone one:

```bash
kubectl delete pod hello-app --ignore-not-found
```

> 💡 From now on, you should always use Deployments instead of bare Pods. Bare Pods don't get rescheduled if they fail — Deployments do.

---

## Step 2: Ensure the Image Is Built

```bash
# Point Docker at minikube
eval $(minikube docker-env)

# Build the image
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

---

## Step 3: Deploy with a Deployment

Apply the Deployment manifest:

```bash
kubectl apply -f app/deployment.yaml
```

Verify:

```bash
kubectl get deployment hello-app
```

Expected:

```
NAME        READY   UP-TO-DATE   AVAILABLE   AGE
hello-app   3/3     3            3           30s
```

---

## Step 4: Verify Pods Are Running

```bash
kubectl get pods -l app=hello-app
```

All 3 Pods should show `1/1 Running`:

```
NAME                         READY   STATUS    RESTARTS   AGE
hello-app-6d4f5b7c8f-abc12   1/1     Running   0          1m
hello-app-6d4f5b7c8f-def34   1/1     Running   0          1m
hello-app-6d4f5b7c8f-ghi56   1/1     Running   0          1m
```

---

## Step 5: Test Self-Healing

Delete a Pod and watch the Deployment recreate it:

```bash
# Delete one Pod
kubectl delete pod $(kubectl get pods -l app=hello-app -o jsonpath='{.items[0].metadata.name}')

# Watch — a new one should appear immediately
kubectl get pods -l app=hello-app --watch
```

Press `Ctrl+C` once you see 3 Pods in `Running` state again.

---

## Step 6: Check Rollout History

```bash
kubectl rollout history deployment/hello-app
```

You should see at least 1 revision:

```
REVISION  CHANGE-CAUSE
1         <none>
```

---

## Step 7: Test the App (Optional)

Port-forward to one of the Pods and verify the app works:

```bash
kubectl port-forward deployment/hello-app 3000:3000
```

In another terminal:

```bash
curl http://localhost:3000
curl http://localhost:3000/health
```

Press `Ctrl+C` to stop port-forwarding.

---

## What You Learned in Phase 2

| Concept | What You Did |
|---|---|
| **Pod lifecycle** | Understood Pending → Running → Succeeded/Failed |
| **Labels & selectors** | Used `-l app=hello-app` to query resources |
| **ReplicaSets** | Saw self-healing and scaling firsthand |
| **Deployments** | Created a Deployment to manage your app |
| **Rolling updates** | Updated the image and watched a zero-downtime rollout |
| **Rollbacks** | Reverted to a previous version with `kubectl rollout undo` |

### What's Coming Next

In **Phase 3: Networking & Services**, you'll learn how to expose your Deployment to the network so other services (and your browser) can reach it — without using `kubectl port-forward`.

---

## Verify Your Progress

Run the Phase 2 verification:

```bash
# From the repo root
node verify-phase.js 2
```

All checks should pass ✅. Once they do, you're ready for **Phase 3: Networking & Services**!

---

**🎉 Congratulations!** You've completed Phase 2. You now understand how Kubernetes manages application workloads — from individual Pods to self-healing, scalable Deployments with rolling updates.
