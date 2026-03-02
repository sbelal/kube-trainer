# GitOps Overview

GitOps is a set of practices for managing Kubernetes infrastructure and applications using **Git as the single source of truth**. Instead of running `kubectl apply` manually, a GitOps controller watches your Git repo and automatically applies changes to the cluster.

> 📖 **Note:** This is a conceptual lesson. There are no cluster changes to make — just read and understand the principles.

---

## The Problem GitOps Solves

In a traditional workflow, deploying to Kubernetes looks like this:

```
Traditional Workflow:

  Developer ─── kubectl apply ───► Cluster
                    │
                    └── Who ran this?
                        When was it applied?
                        What was the previous state?
                        💥 No audit trail
```

With GitOps:

```
GitOps Workflow:

  Developer ─── git push ───► Git Repo ◄── GitOps Controller ───► Cluster
                                  │              │
                                  │              └── Automatically syncs
                                  │                  desired state to cluster
                                  └── Full audit trail
                                      PR reviews
                                      Easy rollback (git revert)
```

---

## Core Principles

| Principle | Description |
|---|---|
| **Declarative** | The entire system is described declaratively (YAML manifests in Git) |
| **Versioned** | Git provides full version history — every change is a commit |
| **Automated** | Changes are automatically applied by a controller — no manual `kubectl apply` |
| **Self-healing** | If someone changes the cluster directly, the controller reverts it to match Git |

> 💡 **Key insight:** With GitOps, `kubectl apply` is replaced by `git push`. The cluster continuously reconciles itself to match what's in Git.

---

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                    Git Repository                    │
│                                                     │
│   manifests/                                        │
│   ├── deployment.yaml    (desired state)            │
│   ├── service.yaml                                  │
│   └── ingress.yaml                                  │
└────────────────────────┬────────────────────────────┘
                         │
                    ① Watch for changes
                         │
              ┌──────────▼──────────┐
              │   GitOps Controller  │
              │   (Flux or Argo CD) │
              │                     │
              │  ② Compare desired  │
              │     vs actual state │
              │                     │
              │  ③ Apply diffs to   │
              │     the cluster     │
              └──────────┬──────────┘
                         │
                    ④ Reconcile
                         │
              ┌──────────▼──────────┐
              │  Kubernetes Cluster  │
              │                     │
              │  Actual state now   │
              │  matches Git ✅     │
              └─────────────────────┘
```

---

## Popular GitOps Tools

### Flux

[Flux](https://fluxcd.io/) is a CNCF graduated project that runs inside your cluster:

| Feature | Description |
|---|---|
| **Source controller** | Watches Git repos, Helm repos, S3 buckets |
| **Kustomize controller** | Applies Kustomize overlays |
| **Helm controller** | Manages Helm releases |
| **Notification controller** | Sends alerts on sync status |

Flux is lightweight, modular, and follows the Kubernetes controller pattern.

### Argo CD

[Argo CD](https://argo-cd.readthedocs.io/) is a CNCF graduated project with a rich UI:

| Feature | Description |
|---|---|
| **Web UI** | Visual dashboard showing app sync status |
| **App-of-apps** | Manage multiple applications declaratively |
| **SSO integration** | OIDC, LDAP, SAML for team access |
| **Rollback** | One-click rollback in the UI |

Argo CD is popular for teams that want a visual interface.

---

## GitOps vs Traditional CI/CD

| Aspect | Traditional CI/CD | GitOps |
|---|---|---|
| **Deployment trigger** | CI pipeline pushes to cluster | Controller pulls from Git |
| **Source of truth** | CI pipeline / scripts | Git repository |
| **Drift detection** | None (manual check) | Automatic — controller detects drift |
| **Rollback** | Re-run old pipeline or manual fix | `git revert` + controller auto-applies |
| **Audit trail** | Check CI logs | Git commit history |
| **Access** | CI needs cluster credentials | Only the controller needs cluster access |

> 💡 **Security benefit:** With GitOps, developers never need direct `kubectl` access to production. They push to Git, and the controller applies the changes. This reduces the attack surface.

---

## What a GitOps Setup Looks Like

A typical GitOps repository structure:

```
my-k8s-apps/
├── apps/
│   ├── hello-app/
│   │   ├── base/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── kustomization.yaml
│   │   └── overlays/
│   │       ├── dev/
│   │       ├── staging/
│   │       └── prod/
│   └── another-app/
│       └── ...
├── infrastructure/
│   ├── namespaces.yaml
│   ├── resource-quotas.yaml
│   └── network-policies.yaml
└── clusters/
    ├── dev/
    │   └── kustomization.yaml
    └── prod/
        └── kustomization.yaml
```

> 💡 **Connection to what you've learned:** The Kustomize base/overlay pattern from Phase 8 is exactly how GitOps repositories are typically structured. You already know the building blocks!

---

## When to Use GitOps

| Situation | Recommendation |
|---|---|
| Learning / local development | Standard `kubectl apply` is fine |
| Small team, single cluster | GitOps is nice-to-have |
| Multiple environments (dev/staging/prod) | GitOps highly recommended |
| Multiple teams sharing a cluster | GitOps essential for governance |
| Regulated industry (audit requirements) | GitOps provides audit trail |

---

## What You Learned

| Concept | Takeaway |
|---|---|
| **GitOps principles** | Declarative, versioned, automated, self-healing |
| **Push vs Pull** | Traditional CI pushes; GitOps controllers pull from Git |
| **Flux** | Lightweight, modular, CNCF graduated |
| **Argo CD** | Rich UI, visual dashboard, CNCF graduated |
| **Repository structure** | Uses Kustomize overlays (you already know this!) |

---

**Next up:** [Cluster Maintenance →](./04-cluster-maintenance.md)
