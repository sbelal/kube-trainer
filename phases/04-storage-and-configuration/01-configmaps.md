# ConfigMaps

In the real world, your application needs configuration — feature flags, API URLs, color themes, log levels. Hardcoding these into your container image means rebuilding the image every time a setting changes. **ConfigMaps** solve this by separating configuration from code.

---

## What Is a ConfigMap?

A ConfigMap is a Kubernetes resource that stores **non-sensitive** configuration data as key-value pairs. Your Pods can consume this data as:

1. **Environment variables** — injected into the container at startup
2. **Mounted files** — projected into the container's filesystem as files

| Feature | Hardcoded in Image | ConfigMap |
|---|---|---|
| Change a setting | Rebuild image, redeploy | Update ConfigMap, restart Pods |
| Environment-specific config | Separate Dockerfiles or args | One image, different ConfigMaps per env |
| Visibility | Buried in code | `kubectl describe configmap` |
| Max size | N/A | 1 MiB per ConfigMap |

> 💡 **Key insight:** ConfigMaps let you use the **same container image** across dev, staging, and production — only the configuration changes.

---

## Creating ConfigMaps

There are three ways to create a ConfigMap:

### Method 1: From Literal Values (CLI)

```bash
kubectl create configmap my-config \
  --from-literal=APP_COLOR=blue \
  --from-literal=LOG_LEVEL=info
```

### Method 2: From a File (CLI)

```bash
# Create a config file
echo "welcome_message=Hello from Kubernetes!" > /tmp/app.properties

# Create ConfigMap from the file
kubectl create configmap my-config --from-file=/tmp/app.properties
```

### Method 3: From a YAML Manifest (Declarative)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
data:
  APP_COLOR: blue
  LOG_LEVEL: info
  APP_MODE: production
```

> 💡 **Best practice:** Use YAML manifests (Method 3) in production. They're version-controlled, repeatable, and can be applied with `kubectl apply -f`.

---

## Consuming ConfigMaps as Environment Variables

### Option A: Individual Keys

Pick specific keys from the ConfigMap and map them to environment variables:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
  - name: my-app
    image: my-app:1.0
    env:
    - name: APP_COLOR          # Env var name in the container
      valueFrom:
        configMapKeyRef:
          name: my-config      # ConfigMap name
          key: APP_COLOR       # Key within the ConfigMap
```

### Option B: All Keys at Once

Inject **all** keys from a ConfigMap as environment variables:

```yaml
spec:
  containers:
  - name: my-app
    image: my-app:1.0
    envFrom:
    - configMapRef:
        name: my-config        # Every key becomes an env var
```

> 💡 **When to use which?** Use `envFrom` when you want all keys. Use individual `env` entries when you need to rename keys or only want a subset.

---

## Consuming ConfigMaps as Files

You can mount a ConfigMap as a volume — each key becomes a file, and the value becomes the file's content:

```yaml
spec:
  containers:
  - name: my-app
    image: my-app:1.0
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config     # Directory where files appear
      readOnly: true
  volumes:
  - name: config-volume
    configMap:
      name: my-config            # ConfigMap to mount
```

After mounting, the container sees:

```
/etc/config/
├── APP_COLOR      # Contains: blue
├── LOG_LEVEL      # Contains: info
└── APP_MODE       # Contains: production
```

> 💡 **When to mount as files?** Use volume mounts when your application reads config from files (e.g., `nginx.conf`, `application.properties`). Use env vars when your app reads `process.env`.

---

## Hands-On: Create a ConfigMap for hello-app

### Step 1: Create the ConfigMap

Look at `app/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hello-app-config
data:
  APP_TITLE: "Kube-Trainer (Configured!)"
  APP_BACKGROUND: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
```

This ConfigMap stores two settings for our hello-app: a custom title and a background gradient.

Apply it:

```bash
kubectl apply -f app/configmap.yaml
```

### Step 2: Verify the ConfigMap

```bash
# List all ConfigMaps
kubectl get configmaps

# Inspect the data
kubectl describe configmap hello-app-config
```

You should see both keys and their values under the `Data` section.

### Step 3: View the Raw YAML

```bash
kubectl get configmap hello-app-config -o yaml
```

Notice how Kubernetes stores the data exactly as you defined it — key-value pairs under `data:`.

---

## Updating ConfigMaps

ConfigMaps can be updated at any time:

```bash
# Edit interactively
kubectl edit configmap hello-app-config

# Or re-apply the modified YAML
kubectl apply -f app/configmap.yaml
```

> ⚠️ **Important:** Pods that use ConfigMaps as **environment variables** do NOT automatically pick up changes — you need to restart the Pods. ConfigMaps mounted as **volumes** do auto-update (after a short delay), but the application must re-read the files.

---

## Summary

| Concept | What You Learned |
|---|---|
| **ConfigMap** | Key-value store for non-sensitive configuration |
| **Three creation methods** | `--from-literal`, `--from-file`, YAML manifest |
| **Env vars** | `env.valueFrom.configMapKeyRef` or `envFrom` |
| **Volume mounts** | Keys become files in the container filesystem |
| **Updates** | Volume mounts auto-update; env vars require Pod restart |

---

**Next up:** [Secrets →](./02-secrets.md)
