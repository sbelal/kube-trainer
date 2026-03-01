# Persistent Volumes

`emptyDir` and `hostPath` volumes disappear when the Pod is deleted. For data that truly needs to outlive Pods — databases, file uploads, application state — you need **PersistentVolumes**.

---

## The PV/PVC Model

Kubernetes separates storage into two roles:

| Resource | Who Creates It | What It Represents |
|---|---|---|
| **PersistentVolume (PV)** | Cluster admin (or dynamic provisioner) | A piece of storage in the cluster |
| **PersistentVolumeClaim (PVC)** | Developer (you) | A request for storage from a Pod |

Think of it like renting an apartment:
- **PV** = An available apartment (the admin lists it)
- **PVC** = Your rental application ("I need a 1-bedroom, 100 sq ft")
- **Binding** = You get matched to an apartment that meets your needs

```
┌──── Cluster Admin ─────┐     ┌──── Developer ──────────┐
│                         │     │                          │
│  PersistentVolume (PV)  │────►│  PersistentVolumeClaim   │
│  "100Mi, ReadWriteOnce" │     │  "100Mi, ReadWriteOnce"  │
│  Status: Available      │     │  Status: Bound           │
│                         │     │                          │
└─────────────────────────┘     │  Pod mounts the PVC      │
                                └──────────────────────────┘
```

> 💡 **Key insight:** PVCs decouple the developer from the storage details. You don't need to know *where* the storage lives — you just ask for what you need and Kubernetes finds a matching PV.

---

## Access Modes

Access modes define how the storage can be accessed:

| Mode | Abbreviation | Meaning |
|---|---|---|
| `ReadWriteOnce` | **RWO** | One node can mount read-write |
| `ReadOnlyMany` | **ROX** | Many nodes can mount read-only |
| `ReadWriteMany` | **RWX** | Many nodes can mount read-write |

> 💡 **In minikube** (single node), `ReadWriteOnce` is all you need. `ReadWriteMany` is typically used with NFS or cloud file systems (EFS, Azure Files).

---

## Reclaim Policies

What happens to the PV when the PVC is deleted?

| Policy | Behavior |
|---|---|
| `Retain` | PV is kept (data preserved) — admin must manually clean up |
| `Delete` | PV and underlying storage are deleted automatically |
| `Recycle` | ⚠️ Deprecated — data is wiped (`rm -rf /volume/*`) |

> 💡 **In production**, `Retain` is the safest for important data. `Delete` is common with dynamically provisioned cloud storage.

---

## Hands-On: Create a PV and PVC

### Step 1: Create the PersistentVolume

Look at `app/pv.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: hello-app-pv
  labels:
    type: local
spec:
  storageClassName: manual
  capacity:
    storage: 100Mi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /tmp/hello-app-data
```

Let's break this down:

| Field | Meaning |
|---|---|
| `storageClassName: manual` | Helps match PVs to PVCs (like a label) |
| `capacity.storage: 100Mi` | How much storage this PV provides |
| `accessModes: ReadWriteOnce` | One node can mount read-write |
| `hostPath.path` | Where on the node the data is stored |

Apply it:

```bash
kubectl apply -f app/pv.yaml
```

### Step 2: Check the PV Status

```bash
kubectl get pv hello-app-pv
```

Expected:

```
NAME           CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   AGE
hello-app-pv   100Mi      RWO            Retain           Available           manual          5s
```

Status is **Available** — no PVC has claimed it yet.

### Step 3: Create the PersistentVolumeClaim

Look at `app/pvc.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: hello-app-pvc
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Mi
```

The PVC says: "I need 100Mi of `ReadWriteOnce` storage with `storageClassName: manual`." Kubernetes finds the matching PV and binds them.

Apply it:

```bash
kubectl apply -f app/pvc.yaml
```

### Step 4: Verify the Binding

```bash
kubectl get pv hello-app-pv
kubectl get pvc hello-app-pvc
```

Expected PV output:

```
NAME           CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                   STORAGECLASS   AGE
hello-app-pv   100Mi      RWO            Retain           Bound    default/hello-app-pvc   manual         60s
```

Expected PVC output:

```
NAME            STATUS   VOLUME         CAPACITY   ACCESS MODES   STORAGECLASS   AGE
hello-app-pvc   Bound    hello-app-pv   100Mi      RWO            manual         10s
```

Both show **Bound** — the PVC found a matching PV and claimed it!

---

## StorageClasses and Dynamic Provisioning

In production, admins don't manually create PVs for every request. Instead, they configure **StorageClasses** that automatically provision PVs when a PVC is created.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast
provisioner: k8s.io/minikube-hostpath    # Depends on your cluster
reclaimPolicy: Delete
volumeBindingMode: Immediate
```

With dynamic provisioning, the flow is:

1. Developer creates a PVC with `storageClassName: fast`
2. Kubernetes sees no matching PV
3. The `fast` StorageClass provisioner automatically creates a PV
4. PVC binds to the newly-created PV

> 💡 **minikube default:** minikube comes with a `standard` StorageClass that auto-provisions hostPath PVs. We're using `manual` in this exercise so you can see the explicit PV/PVC binding process.

### Check Your Cluster's StorageClasses

```bash
kubectl get storageclass
```

---

## Using a PVC in a Pod

Once a PVC is bound, you mount it in a Pod just like any other volume:

```yaml
spec:
  containers:
  - name: my-app
    image: my-app:1.0
    volumeMounts:
    - name: data-volume
      mountPath: /app/data       # Where the storage appears in the container
  volumes:
  - name: data-volume
    persistentVolumeClaim:
      claimName: hello-app-pvc   # Reference the PVC by name
```

> 💡 **The Pod doesn't know about the PV.** It only references the PVC. This abstraction means you can swap the underlying storage (local → cloud) without changing any Pod specs.

---

## PV/PVC Lifecycle

```
1. Admin creates PV        → Status: Available
2. Dev creates PVC         → PVC binds to PV → Status: Bound
3. Pod mounts PVC          → Pod uses the storage
4. Pod is deleted           → PVC and PV remain (data safe!)
5. Dev deletes PVC         → Reclaim policy kicks in
    └─ Retain: PV stays (admin cleanup)
    └─ Delete: PV is deleted
```

---

## Summary

| Concept | What You Learned |
|---|---|
| **PersistentVolume (PV)** | Cluster-level storage resource created by admin |
| **PersistentVolumeClaim (PVC)** | Developer's request for storage |
| **Binding** | Kubernetes matches PVCs to PVs by capacity, access mode, and class |
| **Access modes** | RWO (one node), ROX (many read-only), RWX (many read-write) |
| **Reclaim policies** | Retain (keep data), Delete (clean up) |
| **StorageClasses** | Enable dynamic PV provisioning |

---

**Next up:** [Hands-On Exercise →](./05-hands-on-exercise.md)
