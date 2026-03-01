# Introduction to Helm

So far, you've been managing Kubernetes resources with raw YAML files. This works fine for a single app in one environment — but imagine managing **dozens of microservices** across **dev, staging, and production**. You'd be drowning in nearly-identical YAML files.

**Helm** solves this problem. It's the **package manager for Kubernetes** — think of it as `apt` or `npm` for your cluster.

---

## The Problem with Raw YAML

Consider what you've built so far. To deploy hello-app, you need:

- `deployment.yaml`
- `clusterip-service.yaml`
- `configmap.yaml`
- `secret.yaml`
- `serviceaccount.yaml`
- `role.yaml`
- `rolebinding.yaml`

That's **7 files** for one app. Now imagine:

- You need a staging environment with 2 replicas instead of 3
- You need a production environment with different resource limits
- You want to deploy 10 microservices, each with similar manifests

You'd be copy-pasting YAML, hoping you didn't miss a value. **Helm eliminates this duplication.**

---

## What Is Helm?

Helm is a tool that:

1. **Templates** your YAML manifests (replace hardcoded values with variables)
2. **Packages** related manifests into a single unit called a **Chart**
3. **Manages releases** — install, upgrade, rollback, uninstall with one command

```
┌─────────────────────────────────────────────────────────────────┐
│                        Helm Workflow                            │
│                                                                 │
│   values.yaml          templates/             Kubernetes        │
│   ┌───────────┐        ┌──────────────┐       ┌─────────────┐  │
│   │ replicas: 3│──────►│ deployment.. │──────►│ Deployment  │  │
│   │ image: ... │       │ service....  │       │ Service     │  │
│   │ port: 3000 │       │ configmap..  │       │ ConfigMap   │  │
│   └───────────┘        └──────────────┘       └─────────────┘  │
│                                                                 │
│   "What I want"    +   "How to build it"   =  "Running app"    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### 1. Chart

A **Chart** is a package of Kubernetes manifests. It's a directory containing:

| File | Purpose |
|---|---|
| `Chart.yaml` | Chart metadata (name, version, description) |
| `values.yaml` | Default configuration values |
| `templates/` | Templated Kubernetes manifests |

Think of a Chart as a **blueprint** — it describes *what* to deploy, with configurable parameters.

### 2. Release

A **Release** is a running instance of a Chart. When you install a Chart, Helm creates a Release:

```bash
helm install my-release ./my-chart
#           ^^^^^^^^^^  ^^^^^^^^^^
#           Release name  Chart source
```

You can have **multiple releases** of the same Chart — e.g., one for dev and one for staging.

### 3. Repository

A **Repository** is a collection of Charts hosted online. Popular repos include:

| Repository | URL | Description |
|---|---|---|
| **Bitnami** | `https://charts.bitnami.com/bitnami` | Curated open-source charts |
| **Artifact Hub** | `https://artifacthub.io` | Central search for Helm charts |

### 4. Values

**Values** are the configuration parameters you pass to a Chart. They let you customise a deployment without editing templates:

```bash
# Use default values
helm install my-app ./my-chart

# Override specific values
helm install my-app ./my-chart --set replicas=5

# Use a custom values file
helm install my-app ./my-chart -f production-values.yaml
```

---

## Helm vs Raw YAML — Comparison

| Aspect | Raw YAML | Helm |
|---|---|---|
| **Configuration** | Hardcoded | Templated with `values.yaml` |
| **Multi-environment** | Copy-paste files | Override values per environment |
| **Install** | `kubectl apply -f` (multiple files) | `helm install` (one command) |
| **Upgrade** | Manual edit + re-apply | `helm upgrade` with new values |
| **Rollback** | Manual — hope you saved the old version | `helm rollback` (release history) |
| **Sharing** | Share raw files | Publish Charts to a repository |

---

## How Helm Works Under the Hood

When you run `helm install`:

1. Helm reads the Chart's `templates/` directory
2. It renders the templates using values from `values.yaml` (+ any overrides)
3. It sends the rendered YAML to Kubernetes via the API server
4. It stores the **release record** as a Secret in the cluster

```
┌──────────────────────────────────────────────────────┐
│                  helm install                         │
│                                                      │
│   1. Read templates/  ──► Go template engine          │
│   2. Merge values     ──► Render final YAML           │
│   3. Apply to cluster ──► kubectl apply (internally)  │
│   4. Store release    ──► Secret in cluster            │
│                                                      │
│   Result: A tracked, versioned deployment             │
└──────────────────────────────────────────────────────┘
```

> 💡 **Key insight:** Helm uses Go's `text/template` package. If you've used Jinja2 (Python) or Handlebars (JavaScript), the syntax will feel familiar: `{{ .Values.replicas }}`.

---

## What You Learned

| Concept | Summary |
|---|---|
| **Helm** | Package manager for Kubernetes — templates, packages, manages releases |
| **Chart** | A directory of templated manifests + values |
| **Release** | A running instance of a Chart on your cluster |
| **Repository** | A hosted collection of Charts |
| **Values** | Configurable parameters for customising deployments |

---

**Next up:** [Installing \& Using Helm →](./02-installing-and-using-helm.md)
