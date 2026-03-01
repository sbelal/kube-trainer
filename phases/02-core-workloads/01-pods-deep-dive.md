# Pods Deep Dive

In Phase 1 you deployed a Pod — the smallest deployable unit in Kubernetes. Now let's understand Pods in depth: their lifecycle, how to group containers, and how labels connect everything together.

---

## Pod Lifecycle

Every Pod moves through a series of **phases**:

| Phase | Meaning |
|---|---|
| **Pending** | Accepted by the cluster, but containers haven't started yet (pulling images, scheduling) |
| **Running** | At least one container is running |
| **Succeeded** | All containers exited successfully (exit code 0) — common for Jobs |
| **Failed** | At least one container exited with an error |
| **Unknown** | Pod state can't be determined (usually a node communication issue) |

### Viewing Pod Phase

```bash
# See the phase of your Pod
kubectl get pod hello-app -o jsonpath='{.status.phase}'

# See all pods with their status
kubectl get pods
```

### Restart Policies

Pods have a `restartPolicy` that controls what happens when a container exits:

| Policy | Behavior |
|---|---|
| `Always` (default) | Restart the container regardless of exit code |
| `OnFailure` | Restart only if the container exits with a non-zero code |
| `Never` | Never restart the container |

```yaml
spec:
  restartPolicy: Always  # This is the default
  containers:
  - name: my-app
    image: my-app:1.0
```

> 💡 **Why does this matter?** In production, `Always` ensures your app recovers from crashes automatically. You'll see `OnFailure` used with Jobs (Phase 6) and `Never` for one-off debugging containers.

---

## Labels and Selectors

Labels are **key-value pairs** attached to Kubernetes resources. They're how Kubernetes components find and group related resources.

### Why Labels Matter

Labels are the glue that holds Kubernetes together:

- **ReplicaSets** use labels to know which Pods they own
- **Deployments** use labels to manage ReplicaSets
- **Services** use labels to route traffic to the right Pods
- **You** use labels to filter and organize resources

### Adding Labels

Labels go in the `metadata.labels` section:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hello-app
  labels:
    app: hello-app       # Which application this belongs to
    tier: frontend       # What tier (frontend, backend, database)
    version: v1          # Which version
```

### Querying by Label

```bash
# Get pods with a specific label
kubectl get pods -l app=hello-app

# Get pods with multiple labels (AND logic)
kubectl get pods -l app=hello-app,tier=frontend

# Get pods where a label exists
kubectl get pods -l app

# Get pods where a label does NOT exist
kubectl get pods -l '!app'
```

> 💡 **Label naming conventions:** Common labels include `app` (application name), `tier` (frontend/backend), `env` (dev/staging/prod), and `version`. Kubernetes also recommends standard labels like `app.kubernetes.io/name`.

---

## Multi-Container Pods

A Pod can run **multiple containers** that share the same network and storage. This is used when containers need to work tightly together.

### The Sidecar Pattern

The most common multi-container pattern is the **sidecar** — a helper container that runs alongside your main container:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
spec:
  containers:
  - name: main-app
    image: my-app:1.0
    ports:
    - containerPort: 3000
  - name: log-agent
    image: log-collector:1.0
```

Common sidecar use cases:

| Sidecar Type | What It Does | Example |
|---|---|---|
| **Log collector** | Ships logs to a central system | Fluentd, Filebeat |
| **Proxy** | Handles network traffic | Envoy, Istio sidecar |
| **Syncer** | Keeps files in sync from an external source | Git sync |

### Key Rules for Multi-Container Pods

1. All containers in a Pod share the **same IP address** and **localhost**
2. They can communicate via `localhost:<port>`
3. They share the same **volumes** (storage)
4. They are **scheduled together** on the same node
5. If any container fails, the Pod's restart policy applies

> ⚠️ **When NOT to use multi-container Pods:** Don't put your web app and database in the same Pod. Multi-container Pods are for tightly coupled helper processes. Independent services should be separate Pods.

---

## Resource Requests and Limits (Preview)

Every container can declare how much CPU and memory it needs. This is a brief preview — you'll work with these more in later phases.

```yaml
spec:
  containers:
  - name: hello-app
    image: kube-trainer-app:latest
    resources:
      requests:          # Minimum guaranteed resources
        memory: "64Mi"
        cpu: "100m"      # 100 millicores = 0.1 CPU
      limits:            # Maximum allowed resources
        memory: "128Mi"
        cpu: "250m"
```

| Field | Meaning |
|---|---|
| `requests` | How much the container needs at minimum (used for scheduling) |
| `limits` | The max a container can use (enforced — container gets killed if it exceeds memory) |

> 💡 **Why care now?** Understanding resources helps you understand scheduling decisions. If a Pod is stuck in `Pending`, it's often because the cluster doesn't have enough resources to satisfy the request.

---

## Hands-On: Explore Your Pod

Let's practice what you've learned using the `hello-app` Pod from Phase 1.

### Step 1: Check Pod Details

```bash
# Make sure your Pod is running
kubectl get pods

# Get detailed info
kubectl describe pod hello-app
```

Look for:
- **Labels** — should show `app: hello-app`
- **Status** — should be `Running`
- **Events** — the history of what happened to this Pod

### Step 2: Check the Pod Phase

```bash
kubectl get pod hello-app -o jsonpath='{.status.phase}'
```

Expected output: `Running`

### Step 3: Inspect Labels

```bash
# View all labels on the Pod
kubectl get pod hello-app --show-labels

# Filter by label
kubectl get pods -l app=hello-app
```

### Step 4: View Pod YAML

```bash
# See the full spec Kubernetes is working with
kubectl get pod hello-app -o yaml
```

Scroll through and find:
- `spec.containers` — the container definition
- `status.phase` — the current phase
- `status.conditions` — detailed status conditions

> 💡 **Pro tip:** `kubectl get <resource> -o yaml` is one of the most useful debugging commands. It shows you exactly what Kubernetes knows about a resource, including fields you didn't set (they have defaults).

---

## Summary

| Concept | What You Learned |
|---|---|
| **Pod lifecycle** | Pending → Running → Succeeded/Failed |
| **Restart policies** | Always, OnFailure, Never |
| **Labels** | Key-value metadata used to select and group resources |
| **Selectors** | `-l app=hello-app` to filter resources by label |
| **Multi-container Pods** | Sidecar pattern for tightly coupled helper containers |
| **Resource requests/limits** | CPU and memory scheduling and enforcement |

---

**Next up:** [ReplicaSets →](./02-replicasets.md)
