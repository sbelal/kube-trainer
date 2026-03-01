# Introduction to Kustomize

Helm is great for sharing and templating complex applications. But sometimes you don't need a full templating engine — you just want to **patch** existing YAML for different environments. That's where **Kustomize** comes in.

---

## What Is Kustomize?

Kustomize is a tool that lets you **customise Kubernetes manifests without templates**. Instead of replacing values with `{{ }}` syntax, you:

1. Define a **base** set of manifests (your standard deployment)
2. Create **overlays** that patch the base for each environment

```
┌──────────────────────────────────────────────────────────────┐
│                   Kustomize Model                            │
│                                                              │
│   base/                    overlays/                         │
│   ┌──────────────┐         ┌──────────────────┐              │
│   │ deployment.. │───────►│ dev/              │              │
│   │ service....  │    │    │   replicas: 1     │              │
│   │ kustomizat.. │    │    │   prefix: dev-    │              │
│   └──────────────┘    │    └──────────────────┘              │
│                       │    ┌──────────────────┐              │
│                       ├───►│ staging/          │              │
│                       │    │   replicas: 2     │              │
│                       │    │   prefix: staging-│              │
│                       │    └──────────────────┘              │
│                       │    ┌──────────────────┐              │
│                       └───►│ prod/             │              │
│                            │   replicas: 5     │              │
│                            │   prefix: prod-   │              │
│                            └──────────────────┘              │
│                                                              │
│   "Standard config"   +   "Per-env patches"   = "Final YAML" │
└──────────────────────────────────────────────────────────────┘
```

> 💡 **Key insight:** Kustomize is **built into kubectl** since v1.14. You don't need to install anything extra — just use `kubectl apply -k`.

---

## Helm vs Kustomize — When to Use Which

| Criteria | Helm | Kustomize |
|---|---|---|
| **Best for** | Sharing charts, complex apps | Per-environment customisation |
| **Approach** | Templating (`{{ .Values }}`) | Patching (overlay + merge) |
| **Install** | Separate CLI (`helm`) | Built into `kubectl` |
| **Learning curve** | Medium (Go templates) | Low (just YAML) |
| **Sharing** | Chart repositories | Git repos |
| **Dependency management** | Yes (sub-charts) | No |

> 💡 Many teams use **both**: Helm for packaging and distributing charts, Kustomize for per-environment patches on top.

---

## Prerequisites

Make sure your cluster is running:

```bash
minikube status
```

If it's not running: `minikube start`

Verify Kustomize is available (it's built into kubectl):

```bash
kubectl kustomize --help
```

---

## Step 1: Understand the Base

The Kustomize base has been set up for you in `app/kustomize/base/`. Let's examine it:

```bash
ls app/kustomize/base/
```

You should see:

```
deployment.yaml
service.yaml
kustomization.yaml
```

### kustomization.yaml

This is the **entry point** for Kustomize. It lists the resources to include:

```bash
cat app/kustomize/base/kustomization.yaml
```

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
```

That's it! The `kustomization.yaml` simply lists the resources. The base manifests are standard Kubernetes YAML — no special syntax needed.

### Base Deployment

```bash
cat app/kustomize/base/deployment.yaml
```

This is a standard Deployment manifest — identical to what you've been using:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-app
  labels:
    app: hello-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hello-app
  template:
    metadata:
      labels:
        app: hello-app
    spec:
      containers:
      - name: hello-app
        image: kube-trainer-app:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
```

> 💡 **No templates!** Unlike Helm, this is just plain YAML. Kustomize patches it from the outside.

---

## Step 2: Preview What Kustomize Produces

You can preview the output without applying:

```bash
kubectl kustomize app/kustomize/base/
```

This prints the rendered base manifests. Since there are no overlays applied, it's identical to the base files.

---

## Step 3: Apply the Base

Deploy the base configuration:

```bash
kubectl apply -k app/kustomize/base/
```

The `-k` flag tells kubectl to use Kustomize.

Verify:

```bash
kubectl get deployment hello-app
kubectl get svc hello-app-clusterip
```

---

## Step 4: Clean Up

Delete the base resources before we explore overlays:

```bash
kubectl delete -k app/kustomize/base/
```

Verify:

```bash
kubectl get deployment hello-app
# Should show: "not found"
```

---

## How Kustomize Works

When you run `kubectl apply -k <dir>`:

1. kubectl reads the `kustomization.yaml` in the specified directory
2. It loads all referenced resources
3. It applies any transformations (patches, labels, prefixes, etc.)
4. It merges everything into final YAML
5. It applies the result to the cluster

```
┌──────────────────────────────────────────────────┐
│              kubectl apply -k                     │
│                                                   │
│   1. Read kustomization.yaml                      │
│   2. Load resources                               │
│   3. Apply patches + transformations              │
│   4. Render final YAML                            │
│   5. Apply to cluster                             │
│                                                   │
│   Result: Customised resources without templates  │
└──────────────────────────────────────────────────┘
```

---

## What You Learned

| Concept | Summary |
|---|---|
| **Kustomize** | Customise YAML without templates — patch the base |
| **Base** | Standard manifests + `kustomization.yaml` |
| **kustomization.yaml** | Lists resources and transformations to apply |
| **No install needed** | Built into kubectl via `-k` flag |
| **Preview** | Use `kubectl kustomize <dir>` to see rendered output |

---

**Next up:** [Kustomize Overlays →](./05-kustomize-overlays.md)
