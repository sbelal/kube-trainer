# Cluster Maintenance

Running a Kubernetes cluster in production means you'll eventually need to perform maintenance — upgrading node software, replacing hardware, or patching security vulnerabilities. Kubernetes provides tools to do this **gracefully** without downtime.

---

## Key Maintenance Operations

| Operation | Command | Purpose |
|---|---|---|
| **Cordon** | `kubectl cordon <node>` | Mark node as unschedulable (no new Pods) |
| **Drain** | `kubectl drain <node>` | Evict all Pods and cordon the node |
| **Uncordon** | `kubectl uncordon <node>` | Mark node as schedulable again |

```
Normal:                  Cordoned:                Drained:
┌────────────┐          ┌────────────┐          ┌────────────┐
│   Node     │          │   Node 🚫  │          │   Node 🚫  │
│ Pod A      │          │ Pod A      │          │ (empty)    │
│ Pod B      │          │ Pod B      │          │            │
│ Pod C      │          │ Pod C      │          │ Ready for  │
│ ✅ Accepts │          │ ❌ No new  │          │ maintenance│
│  new Pods  │          │   Pods     │          │            │
└────────────┘          └────────────┘          └────────────┘
```

---

## Prerequisites

Make sure your cluster is running:

```bash
minikube status
```

If it's not running: `minikube start`

Ensure hello-app is deployed in the default namespace:

```bash
kubectl apply -f app/deployment.yaml
kubectl rollout status deployment/hello-app
```

---

## Step 1: Cordon a Node

Cordoning prevents new Pods from being scheduled on the node, but existing Pods continue running:

```bash
kubectl cordon minikube
```

Verify the node status:

```bash
kubectl get nodes
```

Expected output:

```
NAME       STATUS                     ROLES           AGE   VERSION
minikube   Ready,SchedulingDisabled   control-plane   10d   v1.28.0
```

Notice `SchedulingDisabled` — no new Pods will land here.

> 💡 **Key point:** Cordon does NOT affect running Pods. They continue serving traffic normally. It only prevents new Pod scheduling.

---

## Step 2: Drain a Node

Draining evicts all Pods from the node (except DaemonSet Pods and mirror Pods):

```bash
kubectl drain minikube --ignore-daemonsets --delete-emptydir-data
```

The flags:
- `--ignore-daemonsets` — DaemonSet Pods can't be evicted (they must run on every node)
- `--delete-emptydir-data` — Allow eviction of Pods using `emptyDir` volumes (data will be lost)

> ⚠️ **Minikube note:** Since minikube is a single-node cluster, drained Pods will become Pending (there's nowhere else to schedule them). In a multi-node cluster, they'd be rescheduled to other nodes.

Verify Pods are evicted:

```bash
kubectl get pods
```

You'll see Pods in `Pending` state because there's no schedulable node.

---

## Step 3: Uncordon the Node

After maintenance, make the node schedulable again:

```bash
kubectl uncordon minikube
```

Verify:

```bash
kubectl get nodes
```

The node should show `Ready` without `SchedulingDisabled`.

Wait for Pods to reschedule:

```bash
kubectl rollout status deployment/hello-app
kubectl get pods
```

All Pods should return to `Running` status.

---

## Step 4: Verify Clean State

Confirm the node is fully operational:

```bash
# Node should show Ready (not SchedulingDisabled)
kubectl get nodes

# Pods should be Running
kubectl get pods -l app=hello-app

# Describe node — Taints should show <none>
kubectl describe node minikube | grep -A 1 'Unschedulable'
```

---

## etcd Backup Concepts

etcd is the key-value store that holds **all** Kubernetes cluster state. Backing it up is critical for disaster recovery.

| Component | Role |
|---|---|
| **etcd** | Stores all cluster data (Pods, Services, ConfigMaps, Secrets, etc.) |
| **etcdctl** | CLI tool for interacting with etcd |

### Backup Strategy

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  etcd data   │────►│  Snapshot    │────►│  Safe storage│
│  (live)      │     │  (.db file)  │     │  (S3, GCS)   │
└──────────────┘     └──────────────┘     └──────────────┘
```

In a kubeadm-managed cluster, you'd run:

```bash
# Example (not runnable in minikube):
# ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snapshot.db \
#   --endpoints=https://127.0.0.1:2379 \
#   --cacert=/etc/kubernetes/pki/etcd/ca.crt \
#   --cert=/etc/kubernetes/pki/etcd/server.crt \
#   --key=/etc/kubernetes/pki/etcd/server.key
```

> 📖 **Note:** etcd backup is conceptual here — minikube manages its own etcd. In production (kubeadm, EKS, GKE), you'll configure automated backups.

---

## Upgrade Strategy Overview

Kubernetes follows a **version skew policy** — components can be at most one minor version apart:

| Component | Allowed Skew |
|---|---|
| kubelet | At most 1 minor version behind the API server |
| kubectl | ±1 minor version from the API server |

### Upgrade Order

```
1. Control plane (API server, scheduler, controller manager)
   ↓
2. etcd (if not managed)
   ↓
3. Worker nodes (one at a time: cordon → drain → upgrade → uncordon)
```

### Rolling Node Upgrade

```bash
# For each worker node:
# 1. Cordon the node
kubectl cordon <node-name>

# 2. Drain the node
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# 3. Upgrade kubelet and kubectl on the node (SSH in, apt upgrade, etc.)

# 4. Uncordon the node
kubectl uncordon <node-name>

# 5. Verify
kubectl get nodes
```

---

## Useful Commands

| Command | Purpose |
|---|---|
| `kubectl cordon <node>` | Prevent new Pods from scheduling |
| `kubectl drain <node>` | Evict Pods and cordon the node |
| `kubectl uncordon <node>` | Re-enable scheduling on a node |
| `kubectl get nodes` | Check node status (Ready, SchedulingDisabled) |
| `kubectl describe node <node>` | Detailed node info (conditions, capacity) |

---

## What You Learned

| Concept | What you did |
|---|---|
| **Cordon** | Marked a node as unschedulable |
| **Drain** | Evicted all Pods from a node for maintenance |
| **Uncordon** | Restored the node to schedulable |
| **etcd backup** | Understood snapshot-based backup strategy |
| **Upgrade strategy** | Learned the rolling upgrade process |

---

**Next up:** [Hands-On Exercise →](./05-hands-on-exercise.md)
