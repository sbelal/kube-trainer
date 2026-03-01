# Volumes and Mounts

Containers are **ephemeral** — when a container restarts, its filesystem is wiped clean. Any files written during the container's lifetime are lost. This is fine for stateless apps, but what about logs, uploads, or cached data? That's where **Volumes** come in.

---

## The Problem: Ephemeral Container Storage

```
Container starts → Writes data to /app/data → Container crashes → Restarts → /app/data is EMPTY
```

By default, each container gets its own isolated filesystem from the container image. Nothing persists across restarts.

| Scenario | Without Volumes | With Volumes |
|---|---|---|
| Container restarts | Data is lost | Data survives |
| Multiple containers in a Pod | Can't share files | Can share via volume |
| Pod is deleted | Data is lost | Data can survive (with PVs) |

---

## What Is a Volume?

A **Volume** is a directory that is accessible to containers in a Pod. Unlike the container's root filesystem, a Volume's lifecycle is tied to the **Pod** (not the container). This means:

1. Data **survives container restarts** within the same Pod
2. Multiple containers in a Pod can **share data** through the same volume
3. Data is **lost when the Pod is deleted** (unless using PersistentVolumes — covered next lesson)

### Two Parts to Using a Volume

1. **Define the volume** in `spec.volumes` — says "this volume exists"
2. **Mount it** in `spec.containers[*].volumeMounts` — says "put it here in the container"

---

## Volume Type: emptyDir

An `emptyDir` volume starts as an empty directory when the Pod is created. It's stored on the node's disk (or in memory).

### Use Cases

- **Scratch space** — temporary processing, sorting, caching
- **Sharing data** between containers in a Pod
- **Checkpointing** a computation for crash recovery

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: scratch-pod
spec:
  containers:
  - name: writer
    image: busybox
    command: ["sh", "-c", "echo 'Hello from writer!' > /data/message.txt && sleep 3600"]
    volumeMounts:
    - name: shared-data
      mountPath: /data
  - name: reader
    image: busybox
    command: ["sh", "-c", "sleep 5 && cat /data/message.txt && sleep 3600"]
    volumeMounts:
    - name: shared-data
      mountPath: /data
  volumes:
  - name: shared-data
    emptyDir: {}               # Empty directory, node's disk
```

In this example:
- The `writer` container writes a file to `/data/message.txt`
- The `reader` container reads that same file from `/data/message.txt`
- Both containers mount the **same** `shared-data` volume

> 💡 **emptyDir lifecycle:** Created when the Pod starts, deleted when the Pod is deleted. If a **container** restarts (but the Pod stays), the data persists.

### emptyDir in Memory

For ultra-fast temporary storage, you can back `emptyDir` with RAM:

```yaml
volumes:
- name: cache
  emptyDir:
    medium: Memory           # Backed by RAM (tmpfs)
    sizeLimit: 64Mi          # Limit to prevent OOM
```

---

## Volume Type: hostPath

A `hostPath` volume mounts a file or directory from the **host node's** filesystem into the Pod.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hostpath-pod
spec:
  containers:
  - name: my-app
    image: busybox
    command: ["sh", "-c", "ls /host-data && sleep 3600"]
    volumeMounts:
    - name: host-volume
      mountPath: /host-data
  volumes:
  - name: host-volume
    hostPath:
      path: /tmp/k8s-data    # Path on the host node
      type: DirectoryOrCreate # Create directory if it doesn't exist
```

### hostPath Types

| Type | Behavior |
|---|---|
| `""` (empty) | No checks — mount whatever is there |
| `DirectoryOrCreate` | Create directory if missing |
| `Directory` | Must already exist |
| `FileOrCreate` | Create file if missing |
| `File` | Must already exist |

> ⚠️ **Warning:** `hostPath` should be avoided in production. It ties your Pod to a specific node and creates security risks. It's useful for local development and minikube, but use PersistentVolumes in production.

---

## Hands-On: Sharing Data Between Containers

### Step 1: Create a Multi-Container Pod with emptyDir

Create a file called `/tmp/shared-volume-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: shared-volume-demo
  labels:
    app: volume-demo
spec:
  containers:
  - name: producer
    image: busybox
    command: ["sh", "-c", "while true; do date >> /shared/log.txt; sleep 5; done"]
    volumeMounts:
    - name: shared-data
      mountPath: /shared
  - name: consumer
    image: busybox
    command: ["sh", "-c", "tail -f /shared/log.txt"]
    volumeMounts:
    - name: shared-data
      mountPath: /shared
  volumes:
  - name: shared-data
    emptyDir: {}
```

Apply it:

```bash
kubectl apply -f /tmp/shared-volume-pod.yaml
```

### Step 2: Watch the Consumer Logs

```bash
# The consumer follows the log file written by the producer
kubectl logs shared-volume-demo -c consumer -f
```

You should see timestamps appearing every 5 seconds — written by the `producer` container, read by the `consumer`.

Press `Ctrl+C` to stop.

### Step 3: Verify the Shared Volume

```bash
# Exec into the producer and check the file
kubectl exec shared-volume-demo -c producer -- cat /shared/log.txt

# Exec into the consumer and check the same file
kubectl exec shared-volume-demo -c consumer -- cat /shared/log.txt
```

Both containers see the same file content — that's the shared volume at work!

### Step 4: Clean Up

```bash
kubectl delete pod shared-volume-demo
```

---

## Volume Types at a Glance

| Volume Type | Lifecycle | Persist After Pod Delete? | Use Case |
|---|---|---|---|
| `emptyDir` | Pod lifecycle | ❌ No | Scratch space, sharing between containers |
| `hostPath` | Node filesystem | ⚠️ Node-level only | Local dev, node-level access |
| `configMap` | ConfigMap lifecycle | N/A (read-only) | Mount config as files |
| `secret` | Secret lifecycle | N/A (read-only) | Mount secrets as files |
| `persistentVolumeClaim` | PV lifecycle | ✅ Yes | Databases, stateful apps |

> 💡 **You've already used two volume types!** In the previous lessons, when you mounted ConfigMaps and Secrets as files, those were `configMap` and `secret` volume types under the hood.

---

## Summary

| Concept | What You Learned |
|---|---|
| **Ephemeral storage** | Container filesystems are wiped on restart |
| **Volumes** | Directories shared across containers, tied to Pod lifecycle |
| **emptyDir** | Temporary Pod-scoped storage (disk or memory) |
| **hostPath** | Node filesystem access (dev only) |
| **volumeMounts** | Where in the container to mount the volume |
| **Multi-container sharing** | Containers in a Pod share volumes for data exchange |

---

**Next up:** [Persistent Volumes →](./04-persistent-volumes.md)
