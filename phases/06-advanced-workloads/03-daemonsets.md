# DaemonSets

A **DaemonSet** ensures that **every node** (or a selected subset) runs a copy of a Pod. When a new node joins the cluster, the DaemonSet automatically schedules a Pod on it. When a node is removed, the Pod is garbage collected.

---

## DaemonSet vs Deployment

```
┌─────────────────────────────────────────────────────────┐
│                    Deployment (replicas: 3)              │
│                                                          │
│   Node A: [Pod] [Pod]     Node B: [Pod]                  │
│   (scheduler decides placement)                          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                    DaemonSet                              │
│                                                          │
│   Node A: [Pod]           Node B: [Pod]                  │
│   (exactly one per node, always)                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

| Feature | Deployment | DaemonSet |
|---|---|---|
| **Pod count** | You set `replicas` | Automatic: 1 per node |
| **Scheduling** | Scheduler places Pods optimally | One Pod on every qualifying node |
| **Scaling** | Change `replicas` | Add/remove nodes |
| **Use case** | Stateless services | Node-level agents |

### Common Use Cases

- 📊 **Log collectors** (Fluentd, Filebeat) — collect logs from every node
- 📈 **Monitoring agents** (Prometheus node exporter) — gather node metrics
- 🌐 **Network plugins** (Calico, Cilium) — configure networking on each node
- 💾 **Storage daemons** (Ceph, GlusterFS) — manage node storage

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

## Step 1: Understand the DaemonSet Manifest

Create the file `app/daemonset.yaml`:

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: hello-app-daemon
  labels:
    app: hello-app-daemon
spec:
  selector:
    matchLabels:
      app: hello-app-daemon
  template:
    metadata:
      labels:
        app: hello-app-daemon
    spec:
      containers:
      - name: hello-app
        image: kube-trainer-app:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
        resources:
          requests:
            cpu: 25m
            memory: 32Mi
          limits:
            cpu: 100m
            memory: 64Mi
```

> 💡 **Notice:** There's no `replicas` field! The DaemonSet controller automatically determines how many Pods to run — one per node.

---

## Step 2: Deploy the DaemonSet

```bash
kubectl apply -f app/daemonset.yaml
```

Check the DaemonSet:

```bash
kubectl get daemonsets
```

Output:

```
NAME               DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
hello-app-daemon   1         1         1       1            1           <none>           10s
```

Since minikube has **one node**, you'll see `DESIRED: 1`.

Verify the Pod is running:

```bash
kubectl get pods -l app=hello-app-daemon -o wide
```

The `-o wide` flag shows which **node** the Pod is running on.

---

## Step 3: Verify One Pod Per Node

Check that the number of DaemonSet Pods matches the number of nodes:

```bash
# Count nodes
kubectl get nodes --no-headers | wc -l

# Count DaemonSet Pods
kubectl get pods -l app=hello-app-daemon --no-headers | wc -l
```

These numbers should match!

> 💡 **Multi-node clusters:** If you're using `minikube` with multiple nodes (e.g., `minikube start --nodes=3`), the DaemonSet will automatically schedule a Pod on each node.

---

## Step 4: Understand Update Strategies

DaemonSets support two update strategies:

| Strategy | Behavior |
|---|---|
| `RollingUpdate` (default) | Old Pods are killed and new ones are created automatically, one node at a time |
| `OnDelete` | New Pods are only created when you manually delete old ones |

Check the current strategy:

```bash
kubectl get daemonset hello-app-daemon -o jsonpath='{.spec.updateStrategy.type}'
```

This defaults to `RollingUpdate`.

---

## Step 5: Node Selectors (Optional)

You can restrict a DaemonSet to specific nodes using `nodeSelector`:

```yaml
spec:
  template:
    spec:
      nodeSelector:
        disk: ssd
```

This would only schedule Pods on nodes with the label `disk=ssd`.

Label a node:

```bash
kubectl label node minikube disk=ssd
```

Remove a label:

```bash
kubectl label node minikube disk-
```

> 💡 **In production:** Use `nodeSelector` or `nodeAffinity` to restrict DaemonSets to specific node pools (e.g., only GPU nodes, only Linux nodes).

---

## Useful kubectl Commands for DaemonSets

| Command | Purpose |
|---|---|
| `kubectl get daemonsets` or `kubectl get ds` | List all DaemonSets |
| `kubectl describe daemonset <name>` | Detailed DaemonSet info |
| `kubectl get pods -l <label> -o wide` | See DaemonSet Pods and their nodes |
| `kubectl rollout status daemonset <name>` | Watch a DaemonSet rollout |
| `kubectl delete daemonset <name>` | Delete a DaemonSet |

---

## What You Learned

| Concept | What you did |
|---|---|
| **DaemonSets** | Ensure one Pod per node automatically |
| **No replicas field** | Pod count is determined by node count |
| **Use cases** | Logging, monitoring, networking agents |
| **Update strategies** | `RollingUpdate` vs `OnDelete` |
| **Node selectors** | Restrict which nodes get the DaemonSet Pod |

---

**Next up:** [StatefulSets →](./04-statefulsets.md)
