# Deployments

A **Deployment** is the standard way to run and manage applications on Kubernetes. It wraps a ReplicaSet and adds superpowers: rolling updates, rollbacks, and declarative versioning.

---

## Why Deployments?

In the previous lesson you saw that ReplicaSets maintain a set number of Pods but can't update them. Deployments solve this:

| Feature | ReplicaSet | Deployment |
|---|---|---|
| Maintain replica count | ✅ | ✅ |
| Self-healing | ✅ | ✅ |
| Rolling updates | ❌ | ✅ |
| Rollback to previous version | ❌ | ✅ |
| Update history | ❌ | ✅ |
| Pause/resume rollouts | ❌ | ✅ |

### The Hierarchy

```
Deployment
  └── ReplicaSet (created and managed by the Deployment)
        └── Pod
        └── Pod
        └── Pod
```

You tell the Deployment what you want. The Deployment creates a ReplicaSet. The ReplicaSet creates the Pods. You never touch the ReplicaSet directly.

---

## Deployment Manifest

This repo includes a Deployment manifest at `app/deployment.yaml`:

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
```

> 💡 **Look familiar?** The spec is almost identical to a ReplicaSet — the only difference is `kind: Deployment`. That's because a Deployment's `spec.template` is passed through to the ReplicaSet it creates.

### Key Fields

| Field | Purpose |
|---|---|
| `apiVersion: apps/v1` | All Deployments use the `apps/v1` API group |
| `kind: Deployment` | The resource type |
| `metadata.name` | The name of the Deployment — also becomes the prefix for ReplicaSets and Pods |
| `spec.replicas` | Desired number of Pods |
| `spec.selector` | How to find managed Pods (must match template labels) |
| `spec.template` | Pod template — defines the containers to run |

---

## Hands-On: Create a Deployment

### Step 1: Clean Up Phase 1 Pod

If the standalone `hello-app` Pod from Phase 1 is still running, delete it:

```bash
kubectl delete pod hello-app --ignore-not-found
```

> 💡 `--ignore-not-found` suppresses the error if the Pod doesn't exist.

### Step 2: Make Sure Your Image Is Available

Ensure your Docker CLI is pointed at minikube and the image is built:

```bash
# Point Docker at minikube
eval $(minikube docker-env)

# Build the image (if not already built)
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

### Step 3: Deploy

```bash
kubectl apply -f app/deployment.yaml
```

Output:

```
deployment.apps/hello-app created
```

### Step 4: Watch the Pods Come Up

```bash
kubectl get pods --watch
```

You should see 3 Pods created:

```
NAME                         READY   STATUS    RESTARTS   AGE
hello-app-6d4f5b7c8f-abc12   1/1     Running   0          10s
hello-app-6d4f5b7c8f-def34   1/1     Running   0          10s
hello-app-6d4f5b7c8f-ghi56   1/1     Running   0          10s
```

Notice the naming pattern: `<deployment>-<replicaset-hash>-<pod-hash>`.

Press `Ctrl+C` to stop watching.

### Step 5: Inspect the Deployment

```bash
# View deployment status
kubectl get deployment hello-app

# Detailed info
kubectl describe deployment hello-app
```

The `get` output shows:

```
NAME        READY   UP-TO-DATE   AVAILABLE   AGE
hello-app   3/3     3            3           30s
```

| Column | Meaning |
|---|---|
| `READY` | How many replicas are ready out of desired |
| `UP-TO-DATE` | How many replicas have the latest Pod template |
| `AVAILABLE` | How many replicas are available to serve traffic |

### Step 6: See the ReplicaSet

```bash
kubectl get replicasets
```

```
NAME                   DESIRED   CURRENT   READY   AGE
hello-app-6d4f5b7c8f   3         3         3       1m
```

The Deployment automatically created a ReplicaSet. You didn't have to create one manually.

### Step 7: Verify the Chain

```bash
# The Deployment
kubectl get deployment hello-app

# The ReplicaSet it created
kubectl get replicasets -l app=hello-app

# The Pods the ReplicaSet created
kubectl get pods -l app=hello-app
```

This shows the full hierarchy: Deployment → ReplicaSet → Pods.

---

## Scaling a Deployment

### Imperative Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment hello-app --replicas=5

# Watch them come up
kubectl get pods --watch
```

Press `Ctrl+C` once you see 5 running.

### Declarative Scaling

The better approach is to edit the manifest and re-apply:

```bash
# Edit app/deployment.yaml and change replicas to 3
# Then apply:
kubectl apply -f app/deployment.yaml
```

> 💡 **Declarative is preferred** because your YAML files become the source of truth. `kubectl scale` is handy for quick testing but doesn't update your manifest.

Scale back to 3 replicas before continuing:

```bash
kubectl scale deployment hello-app --replicas=3
```

---

## Self-Healing with Deployments

Deployments inherit ReplicaSet's self-healing:

```bash
# Delete a Pod
kubectl delete pod $(kubectl get pods -l app=hello-app -o jsonpath='{.items[0].metadata.name}')

# Watch the replacement appear
kubectl get pods --watch
```

The Deployment's ReplicaSet immediately creates a new Pod to maintain 3 replicas.

---

## Summary

| Concept | What You Learned |
|---|---|
| **Deployment** | The recommended way to manage Pods (wraps ReplicaSet) |
| **Hierarchy** | Deployment → ReplicaSet → Pods |
| **Manifest** | Nearly identical to ReplicaSet, with `kind: Deployment` |
| **Scaling** | `kubectl scale` or edit `replicas` in the manifest |
| **Self-healing** | Deployments inherit ReplicaSet's automatic recovery |

---

**Next up:** [Rolling Updates & Rollbacks →](./04-rolling-updates.md)
