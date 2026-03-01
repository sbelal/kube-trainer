# Creating a Helm Chart

You've installed charts from public repos. Now it's time to **create your own chart** for the hello-app. This is where Helm really shines — turning your hardcoded YAML into a reusable, configurable package.

---

## Prerequisites

Make sure your cluster is running and Helm is installed:

```bash
minikube status
helm version --short
```

Build the latest image:

```bash
eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

---

## Step 1: Understand Chart Structure

A Helm chart is just a directory with a specific layout:

```
hello-app-chart/
├── Chart.yaml           # Chart metadata
├── values.yaml          # Default configuration values
└── templates/           # Templated Kubernetes manifests
    ├── _helpers.tpl     # Reusable template snippets
    ├── deployment.yaml  # Deployment template
    └── service.yaml     # Service template
```

| File | Purpose |
|---|---|
| `Chart.yaml` | Name, version, description of the chart |
| `values.yaml` | Default values users can override |
| `templates/` | YAML files with Go template syntax |
| `_helpers.tpl` | Shared template functions (DRY principle) |

---

## Step 2: Explore the Chart

The chart has already been scaffolded for you in `app/hello-app-chart/`. Let's examine each file.

### Chart.yaml

```bash
cat app/hello-app-chart/Chart.yaml
```

```yaml
apiVersion: v2
name: hello-app
description: A Helm chart for the Kube-Trainer hello-app
type: application
version: 0.1.0
appVersion: "1.0.0"
```

| Field | Purpose |
|---|---|
| `apiVersion: v2` | Helm 3 chart format |
| `name` | Chart name |
| `version` | Chart version (semver) — bump on chart changes |
| `appVersion` | The version of the app being deployed |

### values.yaml

```bash
cat app/hello-app-chart/values.yaml
```

```yaml
replicaCount: 2

image:
  repository: kube-trainer-app
  tag: latest
  pullPolicy: Never

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

containerPort: 3000
```

These are the **defaults**. Users can override any of these at install time.

### templates/deployment.yaml

```bash
cat app/hello-app-chart/templates/deployment.yaml
```

Notice how the template uses `{{ .Values.* }}` to reference values:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "hello-app.fullname" . }}
  labels:
    {{- include "hello-app.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "hello-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "hello-app.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: hello-app
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - containerPort: {{ .Values.containerPort }}
```

> 💡 **Key insight:** Compare this with `app/deployment.yaml`. Instead of hardcoding `replicas: 3` and `image: kube-trainer-app:latest`, the template uses `{{ .Values.replicaCount }}` and `{{ .Values.image.repository }}:{{ .Values.image.tag }}`. Same result, but now configurable!

---

## Step 3: Preview the Rendered Templates

Before installing, you can preview what Helm will actually send to Kubernetes:

```bash
helm template my-release ./app/hello-app-chart
```

This renders the templates with the default values and prints the resulting YAML — without applying anything to the cluster. This is great for debugging.

Try overriding a value:

```bash
helm template my-release ./app/hello-app-chart --set replicaCount=5
```

Notice how `replicas: 5` appears in the rendered output.

---

## Step 4: Lint the Chart

Validate the chart for errors:

```bash
helm lint ./app/hello-app-chart
```

You should see:

```
==> Linting ./app/hello-app-chart
[INFO] Chart.yaml: icon is recommended

1 chart(s) linted, 0 chart(s) failed
```

> 💡 The icon warning is informational — not required for local charts.

---

## Step 5: Install Your Chart

Deploy the hello-app using your Helm chart:

```bash
helm install hello-app-release ./app/hello-app-chart
```

Check the release:

```bash
helm list
```

Output:

```
NAME               NAMESPACE  REVISION  STATUS    CHART            APP VERSION
hello-app-release  default    1         deployed  hello-app-0.1.0  1.0.0
```

Verify the resources:

```bash
kubectl get all -l app.kubernetes.io/instance=hello-app-release
```

You should see:
- A Deployment with 2 replicas (from `values.yaml`)
- 2 Pods running
- A ClusterIP Service

---

## Step 6: Upgrade with Different Values

Change the replica count:

```bash
helm upgrade hello-app-release ./app/hello-app-chart --set replicaCount=4
```

Verify:

```bash
kubectl get pods -l app.kubernetes.io/instance=hello-app-release
```

You should now see 4 Pods.

Check the revision:

```bash
helm history hello-app-release
```

---

## Step 7: Test the App

Port-forward to test your Helm-deployed app:

```bash
kubectl port-forward svc/hello-app-release 8080:80
```

In another terminal:

```bash
curl http://localhost:8080/health
```

You should see `{"status":"ok","hostname":"hello-app-release-..."}`.

Press `Ctrl+C` to stop the port-forward.

---

## Understanding the Helpers

Open `app/hello-app-chart/templates/_helpers.tpl` to see the helper templates:

```bash
cat app/hello-app-chart/templates/_helpers.tpl
```

The key helpers are:

| Helper | Output | Purpose |
|---|---|---|
| `hello-app.fullname` | `<release>-hello-app` or truncated | Unique resource names |
| `hello-app.labels` | Full label set | Applied to all resources |
| `hello-app.selectorLabels` | Subset of labels | Used for Pod selection |

These helpers ensure consistent naming and labelling across all templates.

---

## Useful Helm Commands for Charts

| Command | Purpose |
|---|---|
| `helm create <name>` | Scaffold a new chart |
| `helm template <release> <chart>` | Render templates locally (dry run) |
| `helm lint <chart>` | Validate chart for errors |
| `helm install <release> <chart>` | Deploy a chart |
| `helm install <release> <chart> --dry-run` | Simulate install without deploying |

---

## What You Learned

| Concept | What you did |
|---|---|
| **Chart structure** | Explored Chart.yaml, values.yaml, templates/ |
| **Templating** | Saw how `{{ .Values.* }}` replaces hardcoded values |
| **Helpers** | Understood `_helpers.tpl` for consistent naming |
| **Preview** | Used `helm template` to render without deploying |
| **Install** | Deployed hello-app from your custom chart |
| **Upgrade** | Changed replicas with `helm upgrade --set` |

---

**Next up:** [Introduction to Kustomize →](./04-introduction-to-kustomize.md)
