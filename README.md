# 🧊 Kube-Trainer

**Master Kubernetes by doing.** A structured, step-by-step roadmap to Kubernetes mastery with built-in verification to ensure you've nailed each concept before moving on.

---

## Who Is This For?

Software engineers who:

- ✅ Know Docker (images, containers, Dockerfiles)
- ✅ Have a Windows 11 machine with WSL2 (Ubuntu)
- 🌱 Are new to Kubernetes

---

## Prerequisites

Before you begin, ensure you have:

| Tool | Purpose | Check |
|---|---|---|
| **Windows 11** | Host OS | You're here |
| **WSL2 (Ubuntu)** | Linux environment for all commands | `wsl --list --verbose` in PowerShell |
| **Docker** | Container runtime (inside WSL2) | `docker --version` in WSL2 terminal |
| **Node.js 18+** | Runs the verification engine | `node --version` in WSL2 terminal |
| **Git** | Clone this repo | `git --version` in WSL2 terminal |
| **VSCode** | Code editor | [Download](https://code.visualstudio.com/) |

> 💡 **Node.js & Docker should be installed inside WSL2**, not on Windows. If you need to install Node.js in WSL2, run:
> ```bash
> curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
> sudo apt-get install -y nodejs
> ```

---

## Getting Started

### 1. Clone the Repo in WSL2

Open your WSL2 Ubuntu terminal and clone the repo:

```bash
# Open WSL2 (from PowerShell or Start Menu, type "Ubuntu")
# Navigate to where you want to store the project
cd ~

# Clone the repo
git clone https://github.com/sbelal/kube-trainer.git
cd kube-trainer
```

### 2. Open in VSCode

Launch VSCode connected to WSL2:

```bash
code .
```

> 💡 **First time?** If `code .` doesn't work, open VSCode on Windows, press `Ctrl+Shift+P`, type **"Shell Command: Install 'code' command in PATH"**, and restart your WSL2 terminal.

### 3. Set Up VSCode for WSL2

When VSCode opens, it should automatically connect to WSL2 (you'll see **"WSL: Ubuntu"** in the bottom-left corner). If prompted, install the **WSL** extension.

#### Required Extension

| Extension | ID | Purpose |
|---|---|---|
| **WSL** | `ms-vscode-remote.remote-wsl` | Enables VSCode to work inside WSL2 |

#### Recommended Extensions

| Extension | ID | Purpose |
|---|---|---|
| **Kubernetes** | `ms-kubernetes-tools.vscode-kubernetes-tools` | Cluster explorer, manifest intellisense |
| **YAML** | `redhat.vscode-yaml` | YAML syntax highlighting + Kubernetes schema validation |
| **Markdown Preview Enhanced** | `shd101wyy.markdown-preview-enhanced` | Better markdown preview for reading phase lessons |

Install them via the Extensions sidebar (`Ctrl+Shift+X`) or from the terminal:

```bash
code --install-extension ms-vscode-remote.remote-wsl
code --install-extension ms-kubernetes-tools.vscode-kubernetes-tools
code --install-extension redhat.vscode-yaml
code --install-extension shd101wyy.markdown-preview-enhanced
```

### 4. Verify Setup

Open the VSCode **integrated terminal** (`Ctrl+`` `) — it should be a WSL2 bash shell. Confirm:

```bash
# Should show Ubuntu
uname -a

# Should work
docker --version
node --version
```

---

## Training Phases

Work through each phase in order. Each phase has a folder in `phases/` with markdown lessons and a hands-on exercise.

| Phase | Topic | Status |
|---|---|---|
| **[Phase 0: Docker Refresher](phases/00-docker-refresher/)** | Run the app locally, build & run a Docker container | ✅ Available |
| **[Phase 1: Foundations & Setup](phases/01-foundations-and-setup/)** | What is K8s, architecture, install tools, first cluster, deploy an app | ✅ Available |
| **[Phase 2: Core Workloads](phases/02-core-workloads/)** | Pods, Deployments, ReplicaSets, rolling updates | ✅ Available |
| **[Phase 3: Networking & Services](phases/03-networking-and-services/01-kubernetes-networking.md)** | ClusterIP, NodePort, LoadBalancer, Ingress | ✅ Available |
| **[Phase 4: Storage & Configuration](phases/04-storage-and-configuration/01-configmaps.md)** | ConfigMaps, Secrets, Volumes, PVs, PVCs | ✅ Available |
| **[Phase 5: Observability](phases/05-observability/01-container-logging.md)** | Logs, monitoring, probes, debugging | ✅ Available |
| **[Phase 6: Advanced Workloads](phases/06-advanced-workloads/01-jobs.md)** | Jobs, CronJobs, DaemonSets, StatefulSets | ✅ Available |
| **[Phase 7: RBAC & Security](phases/07-rbac-and-security/01-service-accounts.md)** | ServiceAccounts, Roles, NetworkPolicies | ✅ Available |
| **[Phase 8: Helm & Kustomize](phases/08-helm-and-kustomize/01-introduction-to-helm.md)** | Package management, environment overlays | ✅ Available |
| **[Phase 9: Scaling & Scheduling](phases/09-scaling-and-scheduling/01-resource-requests-and-limits.md)** | HPA, resource limits, affinity, taints | ✅ Available |
| Phase 10: Production & CI/CD | Namespaces, GitOps, cluster maintenance | 🔜 Coming Soon |

### Start Here: Phase 0

Open the Phase 0 lesson:

```
phases/00-docker-refresher/README.md
```

Once you complete and verify Phase 0, move on to Phase 1 and work through each numbered file in order.

---

## Verifying Your Progress

After completing a phase, run the verification command to check your work:

```bash
# Verify Phase 1
node verify-phase.js 1

# Or using npm
npm run verify -- 1
```

The verifier checks that you've completed all the hands-on objectives for the phase. You'll see:

- ✅ **Green checks** for completed objectives
- ❌ **Red crosses** for incomplete items, with a link to the relevant lesson

All checks must pass before moving to the next phase.

---

## Project Structure

```
kube-trainer/
├── app/                              # Hello World app (your workload)
│   ├── server.js                     # Node.js web server
│   ├── package.json
│   ├── Dockerfile
│   ├── pod.yaml                      # Kubernetes Pod manifest
│   ├── deployment.yaml               # Kubernetes Deployment manifest
│   ├── clusterip-service.yaml        # ClusterIP Service manifest
│   ├── nodeport-service.yaml         # NodePort Service manifest
│   ├── ingress.yaml                  # Ingress manifest
│   ├── configmap.yaml                # ConfigMap manifest
│   ├── secret.yaml                   # Secret manifest
│   ├── pv.yaml                       # PersistentVolume manifest
│   ├── pvc.yaml                      # PersistentVolumeClaim manifest
│   ├── deployment-with-config.yaml   # Deployment with config, secrets & PVC
│   ├── job.yaml                      # Job manifest
│   ├── cronjob.yaml                  # CronJob manifest
│   ├── daemonset.yaml                # DaemonSet manifest
│   ├── statefulset.yaml              # StatefulSet + headless Service manifest
│   ├── serviceaccount.yaml           # ServiceAccount manifest
│   ├── role.yaml                     # RBAC Role manifest
│   ├── rolebinding.yaml              # RBAC RoleBinding manifest
│   ├── networkpolicy.yaml            # NetworkPolicy manifest
│   ├── deployment-with-resources.yaml # Deployment with resource requests/limits
│   ├── hpa.yaml                      # HorizontalPodAutoscaler manifest
│   ├── hello-app-chart/              # Helm chart for hello-app
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   │       ├── _helpers.tpl
│   │       ├── deployment.yaml
│   │       └── service.yaml
│   └── kustomize/                    # Kustomize configuration
│       ├── base/
│       │   ├── kustomization.yaml
│       │   ├── deployment.yaml
│       │   └── service.yaml
│       └── overlays/
│           ├── dev/kustomization.yaml
│           ├── staging/kustomization.yaml
│           └── prod/kustomization.yaml
├── phases/                           # Training phases
│   ├── 00-docker-refresher/          # Phase 0
│   │   ├── README.md
│   │   └── checks.json
│   ├── 01-foundations-and-setup/     # Phase 1
│   │   ├── 01-what-is-kubernetes.md
│   │   ├── 02-architecture-overview.md
│   │   ├── 03-install-tools.md
│   │   ├── 04-first-cluster.md
│   │   ├── 05-kubectl-basics.md
│   │   └── checks.json
│   ├── 02-core-workloads/           # Phase 2
│   │   ├── 01-pods-deep-dive.md
│   │   ├── 02-replicasets.md
│   │   ├── 03-deployments.md
│   │   ├── 04-rolling-updates.md
│   │   ├── 05-hands-on-exercise.md
│   │   └── checks.json
│   ├── 03-networking-and-services/   # Phase 3
│   │   ├── 01-kubernetes-networking.md
│   │   ├── 02-clusterip-service.md
│   │   ├── 03-nodeport-service.md
│   │   ├── 04-loadbalancer-service.md
│   │   ├── 05-ingress.md
│   │   └── checks.json
│   ├── 04-storage-and-configuration/ # Phase 4
│   │   ├── 01-configmaps.md
│   │   ├── 02-secrets.md
│   │   ├── 03-volumes-and-mounts.md
│   │   ├── 04-persistent-volumes.md
│   │   ├── 05-hands-on-exercise.md
│   │   └── checks.json
│   ├── 05-observability/            # Phase 5
│   │   ├── 01-container-logging.md
│   │   ├── 02-health-probes.md
│   │   ├── 03-resource-monitoring.md
│   │   ├── 04-debugging-techniques.md
│   │   ├── 05-hands-on-exercise.md
│   │   └── checks.json
│   ├── 06-advanced-workloads/       # Phase 6
│   │   ├── 01-jobs.md
│   │   ├── 02-cronjobs.md
│   │   ├── 03-daemonsets.md
│   │   ├── 04-statefulsets.md
│   │   ├── 05-hands-on-exercise.md
│   │   └── checks.json
│   ├── 07-rbac-and-security/        # Phase 7
│   │   ├── 01-service-accounts.md
│   │   ├── 02-roles-and-rolebindings.md
│   │   ├── 03-network-policies.md
│   │   ├── 04-security-best-practices.md
│   │   ├── 05-hands-on-exercise.md
│   │   └── checks.json
│   ├── 08-helm-and-kustomize/       # Phase 8
│   │   ├── 01-introduction-to-helm.md
│   │   ├── 02-installing-and-using-helm.md
│   │   ├── 03-creating-a-helm-chart.md
│   │   ├── 04-introduction-to-kustomize.md
│   │   ├── 05-kustomize-overlays.md
│   │   ├── 06-hands-on-exercise.md
│   │   └── checks.json
│   └── 09-scaling-and-scheduling/   # Phase 9
│       ├── 01-resource-requests-and-limits.md
│       ├── 02-horizontal-pod-autoscaler.md
│       ├── 03-node-affinity.md
│       ├── 04-taints-and-tolerations.md
│       ├── 05-hands-on-exercise.md
│       └── checks.json
├── lib/
│   └── verify-engine.js             # Verification engine
├── verify-phase.js                   # CLI entry point
├── package.json
└── README.md                         # ← You are here
```

---

## License

MIT
