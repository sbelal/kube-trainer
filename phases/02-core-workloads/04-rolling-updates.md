# Rolling Updates & Rollbacks

One of Kubernetes' most powerful features is **zero-downtime updates**. When you change your application (new image, new config), the Deployment rolls out the change gradually — replacing old Pods with new ones while keeping the app available.

---

## How Rolling Updates Work

When you update a Deployment's Pod template (e.g., change the container image), Kubernetes:

1. Creates a **new ReplicaSet** with the updated Pod template
2. Gradually scales **up** the new ReplicaSet
3. Gradually scales **down** the old ReplicaSet
4. Keeps the app available throughout

```
Before update:
  ReplicaSet-v1: [Pod] [Pod] [Pod]    ← 3 running

During update:
  ReplicaSet-v1: [Pod] [Pod]          ← scaling down
  ReplicaSet-v2: [Pod] [Pod]          ← scaling up

After update:
  ReplicaSet-v1: (0 replicas, kept for rollback history)
  ReplicaSet-v2: [Pod] [Pod] [Pod]    ← 3 running
```

> 💡 **The old ReplicaSet isn't deleted.** Kubernetes keeps it (scaled to 0) so you can roll back instantly.

---

## Update Strategy

The Deployment's `spec.strategy` controls how updates happen:

```yaml
spec:
  strategy:
    type: RollingUpdate        # The default
    rollingUpdate:
      maxSurge: 1              # Max extra Pods during update
      maxUnavailable: 0        # Max Pods that can be down during update
```

| Field | Meaning | Default |
|---|---|---|
| `maxSurge` | How many extra Pods can exist above the desired count during an update | 25% |
| `maxUnavailable` | How many Pods can be unavailable during an update | 25% |

### Common Strategies

| Strategy | maxSurge | maxUnavailable | Behavior |
|---|---|---|---|
| **Safe** | 1 | 0 | Always has at least `replicas` Pods running. Slower but safest. |
| **Fast** | 2 | 1 | Allows temporary overcapacity and undercapacity. Faster rollout. |
| **Recreate** | N/A | N/A | Kills all old Pods before creating new ones (use `type: Recreate`). Causes downtime. |

---

## Hands-On: Perform a Rolling Update

### Step 1: Verify Your Deployment

Make sure the Deployment from the previous lesson is running:

```bash
kubectl get deployment hello-app
```

Expected: 3/3 READY. If it's not, apply it:

```bash
kubectl apply -f app/deployment.yaml
```

### Step 2: Check Current Rollout History

```bash
kubectl rollout history deployment/hello-app
```

Output:

```
deployment.apps/hello-app
REVISION  CHANGE-CAUSE
1         <none>
```

You have one revision — the initial deployment.

### Step 3: Build a New Image Version

Let's create a "v2" of the app by rebuilding with a tag:

```bash
# Ensure Docker is pointed at minikube
eval $(minikube docker-env)

# Build a v2 image
cd app/
docker build -t kube-trainer-app:v2 .
cd ..
```

> 💡 In a real project, you'd change the code before building v2. For this exercise, the same code with a different tag is enough to demonstrate the update mechanism.

### Step 4: Trigger the Rolling Update

Update the Deployment to use the new image:

```bash
kubectl set image deployment/hello-app hello-app=kube-trainer-app:v2
```

This tells Kubernetes: "Change the container named `hello-app` in the Deployment to use image `kube-trainer-app:v2`."

> 💡 **Best practice:** In real-world workflows, you should update the `image` field in your `deployment.yaml` manifest and run `kubectl apply -f app/deployment.yaml` instead. This keeps your YAML files as the **source of truth** and makes changes trackable in version control. We're using `kubectl set image` here because it's a quick way to learn how rolling updates work.

### Step 5: Watch the Rollout

```bash
kubectl rollout status deployment/hello-app
```

Output:

```
Waiting for deployment "hello-app" rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for deployment "hello-app" rollout to finish: 2 out of 3 new replicas have been updated...
deployment "hello-app" successfully rolled out
```

### Step 6: Verify the Update

```bash
# Check the Deployment
kubectl get deployment hello-app

# See both ReplicaSets (old scaled to 0, new at 3)
kubectl get replicasets -l app=hello-app
```

```
NAME                   DESIRED   CURRENT   READY   AGE
hello-app-6d4f5b7c8f   0         0         0       10m   ← old (v1)
hello-app-7e5f6c8d9g   3         3         3       1m    ← new (v2)
```

### Step 7: Check Rollout History

```bash
kubectl rollout history deployment/hello-app
```

```
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
```

Now you have 2 revisions.

---

## Rolling Back

### Undo the Last Update

If something goes wrong with v2, roll back to the previous version:

```bash
kubectl rollout undo deployment/hello-app
```

Output:

```
deployment.apps/hello-app rolled back
```

### Watch the Rollback

```bash
kubectl rollout status deployment/hello-app
```

### Verify the Rollback

```bash
# See ReplicaSets — the v1 RS is scaled back up
kubectl get replicasets -l app=hello-app

# Check which image is running
kubectl get deployment hello-app -o jsonpath='{.spec.template.spec.containers[0].image}'
```

The output should show `kube-trainer-app:latest` — you're back to v1.

### Roll Back to a Specific Revision

```bash
# View history
kubectl rollout history deployment/hello-app

# Roll back to a specific revision
kubectl rollout undo deployment/hello-app --to-revision=2
```

---

## Recording Change Causes

You can annotate deployments to record why a change was made. After triggering an update, set the `kubernetes.io/change-cause` annotation:

```bash
# After updating to v2
kubectl annotate deployment/hello-app kubernetes.io/change-cause="Updated to v2" --overwrite
```

Now `kubectl rollout history` will show the cause:

```
REVISION  CHANGE-CAUSE
1         <none>
2         Updated to v2
```

> 💡 **Tip:** Annotate right after each update so your rollout history stays meaningful. This makes it easy to know *why* each revision exists when deciding which version to roll back to.

---

## Prepare for the Final Exercise

Before moving to the final hands-on exercise, make sure:

1. Your Deployment is running with the **latest** image:
   ```bash
   kubectl set image deployment/hello-app hello-app=kube-trainer-app:latest
   kubectl rollout status deployment/hello-app
   ```

2. You have 3 replicas:
   ```bash
   kubectl scale deployment hello-app --replicas=3
   ```

---

## Summary

| Concept | What You Learned |
|---|---|
| **Rolling updates** | Gradually replace Pods with a new version — no downtime |
| **Strategy** | `maxSurge` and `maxUnavailable` control the rollout speed |
| **Rollout commands** | `kubectl rollout status`, `kubectl rollout history` |
| **Rollback** | `kubectl rollout undo` to revert to a previous version |
| **Multiple ReplicaSets** | Each update creates a new RS; old ones are kept for rollback |

---

**Next up:** [Hands-On Exercise →](./05-hands-on-exercise.md)
