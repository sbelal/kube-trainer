# ReplicaSets

You've been running a single Pod — but what happens if it crashes? Nobody restarts it. What if you need 3 copies for traffic? You'd have to create them manually. A **ReplicaSet** solves both problems.

---

## What is a ReplicaSet?

A ReplicaSet ensures that a **specified number of identical Pods** are running at all times. If a Pod dies, the ReplicaSet creates a replacement. If there are too many, it removes extras.

```
You declare: "I want 3 Pods"
ReplicaSet:  "Got it. I'll make sure there are always exactly 3."
```

### How It Works

1. You specify a **desired replica count** (e.g., 3)
2. The ReplicaSet watches the actual number of matching Pods
3. If actual < desired → it creates new Pods
4. If actual > desired → it deletes excess Pods
5. This runs continuously (reconciliation loop)

---

## ReplicaSet Manifest

Here's what a ReplicaSet looks like:

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: hello-app-rs
  labels:
    app: hello-app
spec:
  replicas: 3               # ← Desired number of Pods
  selector:
    matchLabels:
      app: hello-app         # ← Find Pods with this label
  template:                  # ← Template for creating new Pods
    metadata:
      labels:
        app: hello-app       # ← Must match the selector above!
    spec:
      containers:
      - name: hello-app
        image: kube-trainer-app:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
```

Let's break down the key parts:

| Field | Purpose |
|---|---|
| `replicas` | How many Pods to maintain |
| `selector.matchLabels` | How the ReplicaSet finds its Pods |
| `template` | The Pod specification used to create new Pods |
| `template.metadata.labels` | Labels applied to created Pods — **must match the selector** |

> ⚠️ **Critical rule:** The `template.metadata.labels` must match `selector.matchLabels`. If they don't, Kubernetes will reject the ReplicaSet because it creates Pods it can't find.

---

## The Label Connection

This is the most important concept to understand:

```
ReplicaSet selector: app=hello-app
         ↓ looks for
Pods with label: app=hello-app
         ↓ counts them
3 running? → Done.
2 running? → Create 1 more from template.
4 running? → Delete 1.
```

The ReplicaSet doesn't "own" Pods in a hard sense — it finds them via labels. This means:

1. If you create a Pod manually with label `app=hello-app`, the ReplicaSet will count it
2. If you remove the label from a Pod, the ReplicaSet will ignore it and create a replacement
3. If you add the label to an existing Pod, the ReplicaSet might delete it (if it now has too many)

---

## Hands-On: See Self-Healing in Action

> ⚠️ **Before starting:** If you still have the standalone `hello-app` Pod from Phase 1, delete it first to avoid conflicts:
> ```bash
> kubectl delete pod hello-app
> ```

### Step 1: Create a ReplicaSet

Create a file called `rs-demo.yaml` (you can put it anywhere — we'll delete it later):

```yaml
# rs-demo.yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: hello-app-rs
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
```

Apply it:

```bash
kubectl apply -f rs-demo.yaml
```

### Step 2: Watch the Pods Appear

```bash
kubectl get pods --watch
```

You should see 3 Pods spin up:

```
NAME                 READY   STATUS    RESTARTS   AGE
hello-app-rs-abc12   1/1     Running   0          5s
hello-app-rs-def34   1/1     Running   0          5s
hello-app-rs-ghi56   1/1     Running   0          5s
```

Press `Ctrl+C` to stop watching.

### Step 3: Delete a Pod and Watch Recovery

```bash
# Pick one of the Pod names from above and delete it
kubectl delete pod <pod-name>

# Immediately watch — a new one appears!
kubectl get pods --watch
```

The ReplicaSet notices the count dropped to 2 and immediately creates a replacement. **This is self-healing.**

### Step 4: Inspect the ReplicaSet

```bash
kubectl get replicaset hello-app-rs

kubectl describe replicaset hello-app-rs
```

Look for the **Events** section — you'll see entries like "Created pod: hello-app-rs-xxxxx".

### Step 5: Try Scaling

```bash
# Scale up to 5 replicas
kubectl scale replicaset hello-app-rs --replicas=5

# Watch them appear
kubectl get pods --watch
```

Press `Ctrl+C` once you see 5 running.

```bash
# Scale back down to 2
kubectl scale replicaset hello-app-rs --replicas=2

# Watch extras get terminated
kubectl get pods --watch
```

### Step 6: Clean Up

```bash
# Delete the ReplicaSet (this also deletes its Pods)
kubectl delete replicaset hello-app-rs

# Clean up the demo file
rm rs-demo.yaml
```

---

## Why You Almost Never Create ReplicaSets Directly

ReplicaSets work great, but they have a limitation: **they can't handle updates**. If you change the container image, the ReplicaSet won't update existing Pods — it only creates new Pods when the count is low.

This is where **Deployments** come in. A Deployment manages ReplicaSets for you and handles rolling updates, rollbacks, and more. In practice:

- ✅ Use **Deployments** (which create ReplicaSets automatically)
- ❌ Don't create ReplicaSets directly

Think of it this way:

```
You → Deployment → ReplicaSet → Pods
         ↑                         ↑
    You manage this          These are created
                              for you
```

---

## Summary

| Concept | What You Learned |
|---|---|
| **ReplicaSet** | Maintains a desired number of identical Pods |
| **Self-healing** | Replaces crashed or deleted Pods automatically |
| **Label selectors** | How ReplicaSets find and count their Pods |
| **Scaling** | `kubectl scale` to change replica count |
| **Limitation** | ReplicaSets can't handle image updates |

---

**Next up:** [Deployments →](./03-deployments.md)
