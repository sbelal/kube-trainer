# Hands-On Exercise: Fully Configured Deployment

Time to bring everything together! In this exercise, you'll deploy the hello-app with:

- ✅ A **ConfigMap** for application settings
- ✅ A **Secret** for sensitive data
- ✅ A **PersistentVolumeClaim** for persistent storage

All wired into a single Deployment manifest.

---

## Prerequisites

Make sure you have the following from the previous lessons:

```bash
# ConfigMap should exist
kubectl get configmap hello-app-config

# Secret should exist
kubectl get secret hello-app-secret

# PV and PVC should be Bound
kubectl get pv hello-app-pv
kubectl get pvc hello-app-pvc
```

If any are missing, re-apply them:

```bash
kubectl apply -f app/configmap.yaml
kubectl apply -f app/secret.yaml
kubectl apply -f app/pv.yaml
kubectl apply -f app/pvc.yaml
```

---

## Step 1: Review the Configured Deployment

Look at `app/deployment-with-config.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-app-configured
  labels:
    app: hello-app-configured
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hello-app-configured
  template:
    metadata:
      labels:
        app: hello-app-configured
    spec:
      containers:
      - name: hello-app
        image: kube-trainer-app:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: hello-app-config        # All ConfigMap keys → env vars
        - secretRef:
            name: hello-app-secret        # All Secret keys → env vars
        volumeMounts:
        - name: app-data
          mountPath: /app/data            # PVC mounted here
      volumes:
      - name: app-data
        persistentVolumeClaim:
          claimName: hello-app-pvc        # Reference the PVC
```

Let's break down what's new compared to the basic `deployment.yaml`:

| Section | What It Does |
|---|---|
| `envFrom.configMapRef` | Injects all ConfigMap keys as environment variables |
| `envFrom.secretRef` | Injects all Secret keys as environment variables |
| `volumeMounts` | Mounts the PVC inside the container at `/app/data` |
| `volumes.persistentVolumeClaim` | Connects the volume to the PVC |

---

## Step 2: Deploy

```bash
kubectl apply -f app/deployment-with-config.yaml
```

Wait for the Pods to be ready:

```bash
kubectl get pods -l app=hello-app-configured --watch
```

You should see 2 Pods in `Running` state. Press `Ctrl+C` to stop watching.

---

## Step 3: Verify the Configuration

### Check Environment Variables

Exec into one of the Pods and inspect the environment:

```bash
# Get a Pod name
POD_NAME=$(kubectl get pods -l app=hello-app-configured -o jsonpath='{.items[0].metadata.name}')

# Check ConfigMap values
kubectl exec $POD_NAME -- printenv APP_TITLE
kubectl exec $POD_NAME -- printenv APP_BACKGROUND

# Check Secret values
kubectl exec $POD_NAME -- printenv SECRET_MESSAGE
```

Expected output:

```
Kube-Trainer (Configured!)
linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
This is a secret from Kubernetes!
```

### Check the Volume Mount

```bash
# Verify the mount point exists
kubectl exec $POD_NAME -- ls -la /app/data

# Write a file to the persistent storage
kubectl exec $POD_NAME -- sh -c 'echo "Persistent data!" > /app/data/test.txt'

# Read it back
kubectl exec $POD_NAME -- cat /app/data/test.txt
```

---

## Step 4: Prove Persistence

The real power of PersistentVolumes — data survives Pod deletion.

```bash
# Delete the Pod (Deployment will recreate it)
kubectl delete pod $POD_NAME

# Wait for the new Pod
kubectl get pods -l app=hello-app-configured --watch
# Press Ctrl+C once you see a new Running pod

# Get the new Pod name
NEW_POD=$(kubectl get pods -l app=hello-app-configured -o jsonpath='{.items[0].metadata.name}')

# Check if the data survived
kubectl exec $NEW_POD -- cat /app/data/test.txt
```

You should still see `Persistent data!` — the file survived the Pod being deleted and recreated! 🎉

---

## Phase Summary: What You Learned

Across this entire phase, you've learned how Kubernetes manages configuration and storage:

1. ✅ **ConfigMaps** — Externalized, non-sensitive configuration as key-value pairs
2. ✅ **Secrets** — Base64-encoded storage for sensitive data
3. ✅ **Volumes** — Pod-scoped storage with `emptyDir` and `hostPath`
4. ✅ **PersistentVolumes** — Cluster-level storage that outlives Pods
5. ✅ **PersistentVolumeClaims** — Developer-friendly requests for persistent storage

### The Big Picture

```
┌──── Your Deployment ──────────────────────────────────────┐
│                                                            │
│   ┌──── Pod ──────────────────────────────────────────┐   │
│   │                                                    │   │
│   │   Container: hello-app                             │   │
│   │   ├── ENV: APP_TITLE ← ConfigMap                   │   │
│   │   ├── ENV: APP_BACKGROUND ← ConfigMap              │   │
│   │   ├── ENV: SECRET_MESSAGE ← Secret                 │   │
│   │   └── /app/data/ ← PersistentVolumeClaim           │   │
│   │                        │                           │   │
│   └────────────────────────│───────────────────────────┘   │
│                            │                               │
│                            ▼                               │
│              PersistentVolume (hostPath)                    │
│              /tmp/hello-app-data on node                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Verify Your Progress

Run the phase verification to check you've completed everything:

```bash
# From the repo root
node verify-phase.js 4
```

All 5 checks should pass ✅. Once they do, you're ready for **Phase 5: Observability**!

---

**🎉 Congratulations!** You've completed Phase 4. You now know how to externalize configuration, manage secrets, and provide persistent storage for your applications. In Phase 5, you'll learn about logs, monitoring, health probes, and debugging Kubernetes workloads.
