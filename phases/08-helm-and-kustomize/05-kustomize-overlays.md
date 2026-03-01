# Kustomize Overlays

The base gives you a standard configuration. **Overlays** let you customise it for different environments — dev, staging, production — without duplicating any YAML.

---

## Prerequisites

Make sure your cluster is running:

```bash
minikube status
```

If it's not running: `minikube start`

Make sure the image is built:

```bash
eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

---

## Step 1: Understand the Overlay Structure

The overlays have been set up for you in `app/kustomize/overlays/`:

```bash
ls app/kustomize/overlays/
```

```
dev/
staging/
prod/
```

Each overlay directory contains a `kustomization.yaml` that references the base and applies environment-specific patches.

---

## Step 2: Explore the Dev Overlay

```bash
cat app/kustomize/overlays/dev/kustomization.yaml
```

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

namePrefix: dev-

commonLabels:
  environment: dev

patches:
  - target:
      kind: Deployment
      name: hello-app
    patch: |
      - op: replace
        path: /spec/replicas
        value: 1
```

Let's break down what each section does:

| Section | Purpose |
|---|---|
| `resources: [../../base]` | Inherit everything from the base |
| `namePrefix: dev-` | Prefix all resource names with `dev-` |
| `commonLabels` | Add `environment: dev` label to all resources |
| `patches` | JSON Patch to set replicas to 1 |

> 💡 **Key insight:** The overlay doesn't redefine the entire Deployment. It only specifies **what's different** from the base. This is the power of Kustomize — DRY (Don't Repeat Yourself) configuration management.

---

## Step 3: Preview the Dev Overlay

See what the dev overlay produces:

```bash
kubectl kustomize app/kustomize/overlays/dev/
```

Notice the differences from the base:
- Resource names are prefixed with `dev-` (e.g., `dev-hello-app`)
- All resources have the `environment: dev` label
- The Deployment has `replicas: 1`
- The Service selector and Deployment labels match with the common labels

---

## Step 4: Compare All Overlays

Preview the staging overlay:

```bash
kubectl kustomize app/kustomize/overlays/staging/
```

Preview the production overlay:

```bash
kubectl kustomize app/kustomize/overlays/prod/
```

Compare the key differences:

| Setting | Dev | Staging | Prod |
|---|---|---|---|
| **Name prefix** | `dev-` | `staging-` | `prod-` |
| **Environment label** | `dev` | `staging` | `prod` |
| **Replicas** | 1 | 2 | 5 |

All three share the same base — the only differences are the overlays.

---

## Step 5: Deploy the Dev Overlay

Apply the dev overlay:

```bash
kubectl apply -k app/kustomize/overlays/dev/
```

Verify the resources:

```bash
# Deployment should be named dev-hello-app with 1 replica
kubectl get deployment dev-hello-app

# Service should be named dev-hello-app-clusterip
kubectl get svc dev-hello-app-clusterip

# Pod should have environment=dev label
kubectl get pods -l environment=dev --show-labels
```

Test the app:

```bash
kubectl port-forward svc/dev-hello-app-clusterip 8080:80
```

In another terminal:

```bash
curl http://localhost:8080/health
```

Press `Ctrl+C` to stop the port-forward.

---

## Step 6: Understanding Patches

Kustomize supports two patch strategies:

### JSON Patches (used in our overlays)

JSON Patches are explicit operations:

```yaml
patches:
  - target:
      kind: Deployment
      name: hello-app
    patch: |
      - op: replace        # Operation: replace, add, remove
        path: /spec/replicas
        value: 1
```

| Operation | Purpose |
|---|---|
| `replace` | Change an existing value |
| `add` | Add a new field |
| `remove` | Remove a field |

### Strategic Merge Patches

Strategic merge patches look like partial resource definitions:

```yaml
patches:
  - target:
      kind: Deployment
      name: hello-app
    patch: |
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: hello-app
      spec:
        replicas: 1
```

Both achieve the same result. JSON patches are more explicit; strategic merge patches are more readable for larger changes.

---

## Step 7: ConfigMap and Secret Generators

Kustomize can also **generate** ConfigMaps and Secrets from literal values or files. Here's how you'd add one to an overlay (reference only — you don't need to apply this):

```yaml
# In kustomization.yaml
configMapGenerator:
  - name: app-config
    literals:
      - LOG_LEVEL=debug
      - ENVIRONMENT=dev

secretGenerator:
  - name: app-secret
    literals:
      - API_KEY=my-secret-key
```

> 💡 Generators automatically append a hash to the name (e.g., `app-config-8h2k5m`). This forces a rolling restart when the config changes — a useful pattern for production.

---

## Step 8: Clean Up

Delete the dev overlay resources:

```bash
kubectl delete -k app/kustomize/overlays/dev/
```

Verify:

```bash
kubectl get deployment dev-hello-app
# Should show: "not found"
```

---

## Useful Kustomize Commands

| Command | Purpose |
|---|---|
| `kubectl kustomize <dir>` | Preview rendered output |
| `kubectl apply -k <dir>` | Apply Kustomize configuration |
| `kubectl delete -k <dir>` | Delete Kustomize-managed resources |
| `kubectl diff -k <dir>` | Show diff between cluster and Kustomize output |

---

## What You Learned

| Concept | What you did |
|---|---|
| **Overlays** | Created environment-specific customisations (dev, staging, prod) |
| **namePrefix** | Prefixed resource names per environment |
| **commonLabels** | Added environment labels to all resources |
| **JSON Patches** | Modified replica count per environment |
| **Preview** | Used `kubectl kustomize` to compare overlays |
| **Deploy** | Applied the dev overlay to the cluster |

---

**Next up:** [Hands-On Exercise →](./06-hands-on-exercise.md)
