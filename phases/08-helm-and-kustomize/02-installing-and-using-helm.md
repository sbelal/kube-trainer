# Installing & Using Helm

Now that you understand what Helm is and why it matters, let's get it installed and use it to deploy a real application from a public chart repository.

---

## Prerequisites

Make sure your cluster is running:

```bash
minikube status
```

If it's not running: `minikube start`

---

## Step 1: Install Helm

Install Helm using the official install script:

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

Verify it's installed:

```bash
helm version --short
```

You should see something like:

```
v3.x.x+g...
```

> 💡 **Alternative install methods:** You can also install via `sudo snap install helm --classic` or `sudo apt-get install helm` if you've added the Helm apt repo. The script method above works on any Linux system.

---

## Step 2: Add a Chart Repository

Helm doesn't come with any charts pre-loaded. You need to add a **repository** — a hosted collection of charts.

Add the **Bitnami** repository (one of the most popular):

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
```

Update your local repo index:

```bash
helm repo update
```

List your configured repos:

```bash
helm repo list
```

Output:

```
NAME    URL
bitnami https://charts.bitnami.com/bitnami
```

---

## Step 3: Search for Charts

Search for available charts in your repos:

```bash
# Search your local repos
helm search repo nginx

# Search with versions
helm search repo nginx --versions | head -10
```

You can also search **Artifact Hub** (the public chart registry):

```bash
helm search hub wordpress --max-col-width 60 | head -10
```

---

## Step 4: Inspect a Chart Before Installing

Before installing, you should understand what you're deploying. Inspect the chart's default values:

```bash
# Show the chart's description
helm show chart bitnami/nginx

# Show all configurable values (this is long!)
helm show values bitnami/nginx | head -50
```

> 💡 **Best practice:** Always inspect a chart's values before installing. This tells you what you can customise.

---

## Step 5: Install a Chart

Install the Bitnami NGINX chart:

```bash
helm install my-nginx bitnami/nginx --set service.type=ClusterIP
```

Let's break this down:

| Part | Meaning |
|---|---|
| `helm install` | Create a new release |
| `my-nginx` | Release name (you choose this) |
| `bitnami/nginx` | Chart to install (repo/chart) |
| `--set service.type=ClusterIP` | Override a value |

Wait for it to be ready:

```bash
kubectl rollout status deployment/my-nginx
```

Verify the release:

```bash
helm list
```

Output:

```
NAME     NAMESPACE  REVISION  STATUS    CHART          APP VERSION
my-nginx default    1         deployed  nginx-x.x.x   x.x.x
```

Check the resources it created:

```bash
kubectl get all -l app.kubernetes.io/instance=my-nginx
```

---

## Step 6: Manage Releases

### Upgrade a Release

Change the replica count:

```bash
helm upgrade my-nginx bitnami/nginx \
  --set service.type=ClusterIP \
  --set replicaCount=2
```

Check the revision:

```bash
helm list
```

The `REVISION` column should now show `2`.

### View Release History

```bash
helm history my-nginx
```

Output:

```
REVISION  STATUS      CHART          DESCRIPTION
1         superseded  nginx-x.x.x   Install complete
2         deployed    nginx-x.x.x   Upgrade complete
```

### Rollback a Release

Roll back to revision 1:

```bash
helm rollback my-nginx 1
```

Verify:

```bash
helm history my-nginx
```

You should see revision 3 (the rollback creates a new revision):

```
REVISION  STATUS      CHART          DESCRIPTION
1         superseded  nginx-x.x.x   Install complete
2         superseded  nginx-x.x.x   Upgrade complete
3         deployed    nginx-x.x.x   Rollback to 1
```

### Uninstall a Release

Clean up:

```bash
helm uninstall my-nginx
```

Verify it's gone:

```bash
helm list
kubectl get all -l app.kubernetes.io/instance=my-nginx
```

---

## Useful Helm Commands

| Command | Purpose |
|---|---|
| `helm repo add <name> <url>` | Add a chart repository |
| `helm repo update` | Refresh repo indexes |
| `helm search repo <keyword>` | Search local repos for charts |
| `helm show values <chart>` | Show a chart's configurable values |
| `helm install <release> <chart>` | Install a chart as a release |
| `helm upgrade <release> <chart>` | Upgrade a release |
| `helm rollback <release> <rev>` | Roll back to a previous revision |
| `helm list` | List all releases |
| `helm history <release>` | Show revision history |
| `helm uninstall <release>` | Delete a release |

---

## What You Learned

| Concept | What you did |
|---|---|
| **Install Helm** | Installed the Helm CLI |
| **Repositories** | Added Bitnami repo, searched for charts |
| **Install** | Deployed NGINX from a public chart |
| **Upgrade** | Changed replica count with `helm upgrade` |
| **Rollback** | Rolled back to a previous revision |
| **Uninstall** | Cleaned up the release |

---

**Next up:** [Creating a Helm Chart →](./03-creating-a-helm-chart.md)
