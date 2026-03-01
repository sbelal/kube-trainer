# Hands-On Exercise: Helm & Kustomize

Time to put everything together! In this exercise, you'll deploy the hello-app using both Helm and Kustomize, proving you can manage applications with both tools.

---

## Objectives

By the end of this exercise, you should have:

- ✅ Helm installed and working
- ✅ A Helm chart for hello-app in `app/hello-app-chart/`
- ✅ The hello-app deployed via Helm as `hello-app-release`
- ✅ Kustomize base set up in `app/kustomize/base/`
- ✅ The dev overlay deployed via Kustomize

---

## Setup

### 1. Ensure Your Cluster Is Running

```bash
minikube status
```

If it's not running: `minikube start`

### 2. Build the Latest Image

```bash
eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

### 3. Clean Up Previous Deployments

To avoid conflicts, clean up any existing hello-app resources:

```bash
# Remove any existing Helm releases
helm uninstall hello-app-release 2>/dev/null || true

# Remove any existing Kustomize deployments
kubectl delete -k app/kustomize/overlays/dev/ 2>/dev/null || true

# Remove any direct deployments
kubectl delete deployment hello-app 2>/dev/null || true
kubectl delete svc hello-app-clusterip 2>/dev/null || true
```

---

## Part 1: Deploy with Helm

### Install the Helm Chart

```bash
helm install hello-app-release ./app/hello-app-chart
```

### Verify the Release

```bash
# Check Helm release exists
helm list

# Check resources were created
kubectl get deployment -l app.kubernetes.io/instance=hello-app-release
kubectl get svc -l app.kubernetes.io/instance=hello-app-release
kubectl get pods -l app.kubernetes.io/instance=hello-app-release
```

Wait for Pods to be ready:

```bash
kubectl rollout status deployment/hello-app-release
```

### Test the Helm Deployment

```bash
kubectl port-forward svc/hello-app-release 8080:80 &
sleep 2
curl http://localhost:8080/health
kill %1 2>/dev/null
```

You should see `{"status":"ok","hostname":"hello-app-release-..."}`.

---

## Part 2: Upgrade the Helm Release

Upgrade to 3 replicas:

```bash
helm upgrade hello-app-release ./app/hello-app-chart --set replicaCount=3
```

Verify:

```bash
kubectl get pods -l app.kubernetes.io/instance=hello-app-release
# Should show 3 Pods
```

Check the release history:

```bash
helm history hello-app-release
```

---

## Part 3: Deploy with Kustomize

Now deploy a **separate** instance using Kustomize's dev overlay:

```bash
kubectl apply -k app/kustomize/overlays/dev/
```

### Verify the Kustomize Deployment

```bash
# Dev deployment should exist with 1 replica
kubectl get deployment dev-hello-app

# Dev service should exist
kubectl get svc dev-hello-app-clusterip

# Pod should have environment=dev label
kubectl get pods -l environment=dev
```

Wait for the Pod to be ready:

```bash
kubectl rollout status deployment/dev-hello-app
```

### Test the Kustomize Deployment

```bash
kubectl port-forward svc/dev-hello-app-clusterip 8081:80 &
sleep 2
curl http://localhost:8081/health
kill %1 2>/dev/null
```

You should see `{"status":"ok","hostname":"dev-hello-app-..."}`.

---

## Part 4: Compare Both Deployments

Both the Helm release and Kustomize deployment should be running side by side:

```bash
# Helm-managed deployment
kubectl get deployment hello-app-release -o wide

# Kustomize-managed deployment
kubectl get deployment dev-hello-app -o wide
```

Notice the differences:

| Aspect | Helm Release | Kustomize Dev |
|---|---|---|
| **Name** | `hello-app-release` | `dev-hello-app` |
| **Replicas** | 3 (after upgrade) | 1 (dev overlay) |
| **Labels** | `app.kubernetes.io/instance` | `environment: dev` |
| **Management** | `helm list` | `kubectl get -k` |

---

## Part 5: Inspect Everything

Review what both tools created:

```bash
# Helm release details
helm get manifest hello-app-release | head -40
helm get values hello-app-release

# Kustomize rendered output
kubectl kustomize app/kustomize/overlays/dev/
```

---

## Verification

Run the phase verification to check your progress:

```bash
node verify-phase.js 8
```

All checks should pass:

- ✅ Helm CLI is installed
- ✅ Helm chart directory exists
- ✅ hello-app Helm release exists
- ✅ Helm release Pods are running
- ✅ Kustomize base directory exists
- ✅ Dev overlay deployed successfully

---

## What You Accomplished

| Task | Status |
|---|---|
| Installed Helm CLI | ✅ |
| Created a Helm chart for hello-app | ✅ |
| Deployed hello-app via Helm | ✅ |
| Upgraded the Helm release | ✅ |
| Set up Kustomize base + overlays | ✅ |
| Deployed dev overlay via Kustomize | ✅ |
| Ran both deployments side by side | ✅ |

---

## Summary

In this phase, you learned two essential Kubernetes packaging tools:

| Tool | Best For | Approach |
|---|---|---|
| **Helm** | Packaging, sharing, complex apps | Templating with `values.yaml` |
| **Kustomize** | Per-environment customisation | Patching with overlays |

Both tools solve the **"too much YAML"** problem, but in different ways:

- **Helm** = Templates → renders YAML from variables
- **Kustomize** = Patches → modifies existing YAML with overlays

Many production teams use both: Helm charts for external dependencies (databases, monitoring) and Kustomize overlays for environment-specific tweaks.

---

🎉 **Phase 8 Complete!** You now know how to manage Kubernetes applications with Helm and Kustomize.

---

**Next up:** [Phase 9: Scaling & Scheduling (Coming Soon) →](../../README.md)
