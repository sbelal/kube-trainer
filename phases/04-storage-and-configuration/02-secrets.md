# Secrets

ConfigMaps are great for general configuration, but what about passwords, API keys, and tokens? You don't want those sitting in plain text. That's where **Secrets** come in — Kubernetes' built-in mechanism for handling sensitive data.

---

## Secrets vs ConfigMaps

| Feature | ConfigMap | Secret |
|---|---|---|
| **Purpose** | Non-sensitive config | Sensitive data (passwords, tokens, keys) |
| **Stored as** | Plain text | Base64-encoded |
| **Visible in `kubectl describe`** | Yes (values shown) | No (values hidden) |
| **In etcd** | Plain text | Base64-encoded (encrypted if configured) |
| **Size limit** | 1 MiB | 1 MiB |
| **Usage** | Identical to ConfigMaps (env vars, volumes) | Identical to ConfigMaps (env vars, volumes) |

> ⚠️ **Important reality check:** Kubernetes Secrets are **base64-encoded, NOT encrypted** by default. Anyone with access to the API server can decode them. In production, you should enable [encryption at rest](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/) and use tools like HashiCorp Vault or Sealed Secrets.

---

## Secret Types

Kubernetes has several built-in Secret types:

| Type | Purpose |
|---|---|
| `Opaque` (default) | Arbitrary user-defined data |
| `kubernetes.io/dockerconfigjson` | Docker registry credentials |
| `kubernetes.io/tls` | TLS certificate and key |
| `kubernetes.io/basic-auth` | Basic authentication credentials |
| `kubernetes.io/service-account-token` | Auto-generated for ServiceAccounts |

For this phase, we'll focus on `Opaque` — the most common type for application secrets.

---

## Creating Secrets

### Method 1: Imperatively (CLI)

```bash
kubectl create secret generic my-secret \
  --from-literal=DB_PASSWORD=supersecret \
  --from-literal=API_KEY=abc123xyz
```

Note: `generic` means `Opaque` type.

### Method 2: Declaratively (YAML Manifest)

Values must be **base64-encoded** in the YAML:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
data:
  DB_PASSWORD: c3VwZXJzZWNyZXQ=    # base64 of "supersecret"
  API_KEY: YWJjMTIzeHl6            # base64 of "abc123xyz"
```

### Base64 Encoding/Decoding

```bash
# Encode a value
echo -n "supersecret" | base64
# Output: c3VwZXJzZWNyZXQ=

# Decode a value
echo "c3VwZXJzZWNyZXQ=" | base64 --decode
# Output: supersecret
```

> ⚠️ **Always use `echo -n`** (no trailing newline) when encoding! Without `-n`, a newline character gets included in the encoded value, which can break passwords and keys.

### Method 3: Using `stringData` (Convenience)

You can use `stringData` to avoid manual base64 encoding — Kubernetes encodes it for you:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
stringData:
  DB_PASSWORD: supersecret         # Plain text — K8s encodes it
  API_KEY: abc123xyz
```

> 💡 **`stringData` vs `data`:** Use `stringData` for convenience during development. Use `data` (base64) when you're generating manifests programmatically. They can be mixed in the same Secret.

---

## Consuming Secrets

Secrets are consumed exactly like ConfigMaps.

### As Environment Variables

```yaml
spec:
  containers:
  - name: my-app
    image: my-app:1.0
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:              # secretKeyRef instead of configMapKeyRef
          name: my-secret
          key: DB_PASSWORD
```

Or inject all keys at once:

```yaml
    envFrom:
    - secretRef:
        name: my-secret            # secretRef instead of configMapRef
```

### As Mounted Files

```yaml
spec:
  containers:
  - name: my-app
    image: my-app:1.0
    volumeMounts:
    - name: secret-volume
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secret-volume
    secret:
      secretName: my-secret        # 'secret' instead of 'configMap'
```

Each key becomes a file:

```
/etc/secrets/
├── DB_PASSWORD     # Contains: supersecret
└── API_KEY         # Contains: abc123xyz
```

> 💡 **File permissions:** Secret files are mounted with `0644` permissions by default. You can change this with `defaultMode` in the volume spec.

---

## Hands-On: Create a Secret for hello-app

### Step 1: Create the Secret

Look at `app/secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: hello-app-secret
type: Opaque
stringData:
  SECRET_MESSAGE: "This is a secret from Kubernetes!"
```

Apply it:

```bash
kubectl apply -f app/secret.yaml
```

### Step 2: Verify the Secret

```bash
# List Secrets
kubectl get secrets

# Describe — notice the values are hidden
kubectl describe secret hello-app-secret
```

The `describe` output shows the key names and byte sizes, but **not the values**.

### Step 3: View the Actual Value

```bash
# Get the base64-encoded value
kubectl get secret hello-app-secret -o jsonpath='{.data.SECRET_MESSAGE}'

# Decode it
kubectl get secret hello-app-secret -o jsonpath='{.data.SECRET_MESSAGE}' | base64 --decode
```

You should see: `This is a secret from Kubernetes!`

---

## Security Best Practices

| Practice | Why |
|---|---|
| **Don't commit Secrets to Git** | Anyone with repo access can decode base64 |
| **Use RBAC** | Restrict who can `kubectl get secrets` |
| **Enable encryption at rest** | Encrypts Secret data in etcd |
| **Consider external secret managers** | HashiCorp Vault, AWS Secrets Manager, Sealed Secrets |
| **Use `stringData` carefully** | Plain-text values in manifests are still visible |
| **Mount as files, not env vars** | Env vars can leak in logs, crash dumps, and child processes |

---

## Summary

| Concept | What You Learned |
|---|---|
| **Secrets** | Base64-encoded storage for sensitive data |
| **Types** | Opaque (generic), dockerconfigjson, tls, basic-auth |
| **`data` vs `stringData`** | `data` requires base64; `stringData` auto-encodes |
| **Consuming** | Same as ConfigMaps — env vars or volume mounts |
| **Security** | Base64 ≠ encryption; enable encryption at rest in production |

---

**Next up:** [Volumes and Mounts →](./03-volumes-and-mounts.md)
