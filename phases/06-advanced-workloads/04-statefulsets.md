# StatefulSets

A **StatefulSet** manages Pods that need **stable identities** and **persistent storage**. Unlike Deployments (where Pods are interchangeable), StatefulSet Pods have predictable names, ordered startup/teardown, and dedicated storage volumes.

---

## StatefulSet vs Deployment

```
┌────────────────────────────────────────────────────────────┐
│                    Deployment                               │
│                                                             │
│   hello-app-7c9d5b8f4-x2k9m  ←── random name              │
│   hello-app-7c9d5b8f4-a8b3n  ←── random name              │
│   hello-app-7c9d5b8f4-q1w2e  ←── random name              │
│                                                             │
│   Pods are interchangeable. Any can be killed/replaced.     │
│                                                             │
├────────────────────────────────────────────────────────────┤
│                    StatefulSet                               │
│                                                             │
│   hello-app-stateful-0  ←── stable, predictable             │
│   hello-app-stateful-1  ←── stable, predictable             │
│   hello-app-stateful-2  ←── stable, predictable             │
│                                                             │
│   Pods have identity. Each has its own storage.              │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

| Feature | Deployment | StatefulSet |
|---|---|---|
| **Pod names** | Random hash suffix | Ordered index (0, 1, 2…) |
| **Startup order** | All at once | Sequential (0 → 1 → 2) |
| **Shutdown order** | Any order | Reverse (2 → 1 → 0) |
| **Storage** | Shared or ephemeral | Dedicated PVC per Pod |
| **Network identity** | Via Service only | Stable DNS per Pod |
| **Use cases** | Stateless apps | Databases, message queues |

### Common Use Cases

- 🗄️ **Databases** (MySQL, PostgreSQL, MongoDB)
- 📨 **Message queues** (Kafka, RabbitMQ)
- 🔍 **Search engines** (Elasticsearch)
- 📁 **Distributed storage** (Cassandra, Zookeeper)

---

## Prerequisites

Make sure your cluster is running and the app image is built:

```bash
minikube status

eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

---

## Step 1: The Headless Service Requirement

StatefulSets **require** a **Headless Service** — a Service with `clusterIP: None`. This gives each Pod its own DNS entry instead of load-balancing across them.

```
Regular Service (clusterIP):
  hello-app-clusterip → load-balances to any Pod

Headless Service (clusterIP: None):
  hello-app-stateful-0.hello-app-headless → always reaches Pod 0
  hello-app-stateful-1.hello-app-headless → always reaches Pod 1
```

The headless Service is included in the StatefulSet manifest. Create `app/statefulset.yaml`:

```yaml
# Headless Service — required for StatefulSet DNS
apiVersion: v1
kind: Service
metadata:
  name: hello-app-headless
  labels:
    app: hello-app-stateful
spec:
  clusterIP: None
  selector:
    app: hello-app-stateful
  ports:
  - port: 3000
    targetPort: 3000
    name: http
---
# StatefulSet
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: hello-app-stateful
spec:
  serviceName: hello-app-headless
  replicas: 2
  selector:
    matchLabels:
      app: hello-app-stateful
  template:
    metadata:
      labels:
        app: hello-app-stateful
    spec:
      containers:
      - name: hello-app
        image: kube-trainer-app:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
        volumeMounts:
        - name: data
          mountPath: /app/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 50Mi
```

Key fields:

| Field | Purpose |
|---|---|
| `serviceName` | Links to the headless Service for DNS |
| `replicas: 2` | Creates Pods `hello-app-stateful-0` and `hello-app-stateful-1` |
| `volumeClaimTemplates` | Each Pod gets its **own** PVC (not shared) |

---

## Step 2: Deploy the StatefulSet

```bash
kubectl apply -f app/statefulset.yaml
```

Watch the Pods start **in order**:

```bash
kubectl get pods -l app=hello-app-stateful -w
```

You'll see Pod `0` become `Ready` before Pod `1` starts:

```
NAME                     READY   STATUS    RESTARTS   AGE
hello-app-stateful-0     0/1     Pending   0          2s
hello-app-stateful-0     1/1     Running   0          5s
hello-app-stateful-1     0/1     Pending   0          1s
hello-app-stateful-1     1/1     Running   0          4s
```

Press `Ctrl+C` to stop watching.

---

## Step 3: Verify Stable Pod Names

```bash
kubectl get pods -l app=hello-app-stateful
```

Notice the predictable names — `hello-app-stateful-0` and `hello-app-stateful-1`, not random hashes.

Delete a Pod and watch it come back with the **same name**:

```bash
# Delete Pod 0
kubectl delete pod hello-app-stateful-0

# Watch it recreate
kubectl get pods -l app=hello-app-stateful -w
```

The replacement Pod will be named `hello-app-stateful-0` again — not a random name.

---

## Step 4: Verify Dedicated Storage

Each Pod gets its own PVC:

```bash
kubectl get pvc -l app=hello-app-stateful
```

Output:

```
NAME                          STATUS   VOLUME     CAPACITY   ACCESS MODES   AGE
data-hello-app-stateful-0     Bound    pv-xxx     50Mi       RWO            2m
data-hello-app-stateful-1     Bound    pv-yyy     50Mi       RWO            1m
```

Write data to Pod 0's volume:

```bash
kubectl exec hello-app-stateful-0 -- sh -c 'echo "pod-0-data" > /app/data/test.txt'
```

Verify it's only on Pod 0:

```bash
# Pod 0 has the data
kubectl exec hello-app-stateful-0 -- cat /app/data/test.txt

# Pod 1 does NOT have it (separate volume)
kubectl exec hello-app-stateful-1 -- cat /app/data/test.txt 2>&1 || echo "(file not found — correct!)"
```

> 💡 **Key insight:** Each StatefulSet Pod has its own PVC. Data is NOT shared between Pods. This is exactly what databases need — each replica has its own data directory.

---

## Step 5: Verify DNS Identity

From inside the cluster, each Pod has a stable DNS name:

```bash
kubectl run dns-test --image=busybox:1.36 --rm -it --restart=Never -- \
  nslookup hello-app-headless
```

You'll see individual Pod IPs listed. Each Pod is reachable at:

```
<pod-name>.<service-name>.<namespace>.svc.cluster.local
```

For example: `hello-app-stateful-0.hello-app-headless.default.svc.cluster.local`

---

## Step 6: Scaling StatefulSets

Scale up:

```bash
kubectl scale statefulset hello-app-stateful --replicas=3
```

Watch Pod `2` get created (after `0` and `1` are ready):

```bash
kubectl get pods -l app=hello-app-stateful
```

Scale down:

```bash
kubectl scale statefulset hello-app-stateful --replicas=2
```

Pod `2` is removed first (highest ordinal removed first). Scale back for the exercise:

```bash
kubectl scale statefulset hello-app-stateful --replicas=2
```

> 💡 **Ordering guarantee:** Scale-up adds Pods in ascending order (0, 1, 2…). Scale-down removes in descending order (2, 1, 0…). This ensures leader/primary (usually `0`) is last to go.

---

## Useful kubectl Commands for StatefulSets

| Command | Purpose |
|---|---|
| `kubectl get statefulsets` or `kubectl get sts` | List all StatefulSets |
| `kubectl describe statefulset <name>` | Detailed StatefulSet info |
| `kubectl get pvc -l <label>` | See PVCs created by volumeClaimTemplates |
| `kubectl rollout status statefulset <name>` | Watch a StatefulSet rollout |
| `kubectl scale statefulset <name> --replicas=N` | Scale a StatefulSet |

---

## What You Learned

| Concept | What you did |
|---|---|
| **StatefulSets** | Manage Pods with stable identities and persistent storage |
| **Headless Service** | Required for per-Pod DNS names |
| **Ordered startup** | Pods start sequentially (0 → 1 → 2) |
| **Stable names** | Pod names persist across restarts |
| **volumeClaimTemplates** | Each Pod gets its own dedicated PVC |
| **Scaling** | Scale up/down respects ordering guarantees |

---

**Next up:** [Hands-On Exercise →](./05-hands-on-exercise.md)
