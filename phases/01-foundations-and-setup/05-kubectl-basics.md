# kubectl Basics & Your First Deployment

In this lesson you'll learn the essential kubectl commands and deploy the **Hello World** app from this repo into your Kubernetes cluster.

---

## Essential kubectl Commands

Here's the daily toolkit you'll use constantly:

### Viewing Resources

```bash
# List resources of a type
kubectl get pods                  # List pods in default namespace
kubectl get pods -o wide          # List with extra info (IP, node)
kubectl get deployments           # List deployments
kubectl get all                   # List pods, services, deployments, etc.

# Get detailed info about a specific resource
kubectl describe pod <pod-name>

# Output in YAML or JSON (useful for debugging)
kubectl get pod <pod-name> -o yaml
```

### Creating and Applying Resources

```bash
# Create from a YAML file (declarative — preferred)
kubectl apply -f my-resource.yaml

# Create directly from the command line (imperative — for quick tests)
kubectl run my-pod --image=nginx
```

### Deleting Resources

```bash
# Delete a specific resource
kubectl delete pod <pod-name>

# Delete everything defined in a YAML file
kubectl delete -f my-resource.yaml
```

### Debugging

```bash
# View container logs
kubectl logs <pod-name>

# Stream logs in real-time
kubectl logs -f <pod-name>

# Open a shell inside a running container
kubectl exec -it <pod-name> -- /bin/sh

# Watch resources update in real-time
kubectl get pods --watch
```

> 💡 **Pro tip:** The `--watch` flag is incredibly useful. It shows live updates as Pods are created, become ready, or fail.

---

## Hands-On: Deploy the Hello World App

Let's deploy the Hello World app included in this repo. You'll need to build a container image and create a Kubernetes Pod.

### Step 1: Build the Docker Image Inside minikube

minikube runs its own Docker daemon. To use images you build locally, you need to point your shell's Docker client at minikube's Docker daemon:

```bash
# Point your Docker CLI at minikube's Docker daemon
eval $(minikube docker-env)
```

> 💡 **What does this do?** It sets environment variables (`DOCKER_HOST`, `DOCKER_TLS_VERIFY`, etc.) so that `docker build` talks to minikube's Docker instead of your local Docker. This means images you build are immediately available to Kubernetes without pushing to a registry.

> ⚠️ **This is temporary!** The `eval $(minikube docker-env)` command only affects your **current terminal session**. If you open a new terminal or restart your shell, you'll need to run it again. If you build an image without running this command first, the image will be stored in your local Docker — not minikube's — and Kubernetes won't be able to find it.

Now build the image:

```bash
# Navigate to the app directory
cd app/

# Build the image (the tag "kube-trainer-app:latest" is what we'll reference in K8s)
docker build -t kube-trainer-app:latest .

# Verify the image was built
docker images | grep kube-trainer-app

# Go back to the repo root
cd ..
```

### Step 2: Create a Pod Manifest

Create a file called `app/pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hello-app
  labels:
    app: hello-app
spec:
  containers:
  - name: hello-app
    image: kube-trainer-app:latest
    imagePullPolicy: Never        # Use the local image, don't try to pull from a registry
    ports:
    - containerPort: 3000
```

Let's break this down:

| Field | Meaning |
|---|---|
| `apiVersion: v1` | The API version for this resource type (Pods use `v1`) |
| `kind: Pod` | The type of resource we're creating |
| `metadata.name` | The name of this Pod — must be unique in the namespace |
| `metadata.labels` | Key-value pairs used to identify and select resources |
| `spec.containers` | List of containers to run in this Pod |
| `image` | The container image to use |
| `imagePullPolicy: Never` | Don't pull from a registry — use the local image |
| `containerPort` | The port the container listens on (informational) |

### Step 3: Deploy the Pod

```bash
kubectl apply -f app/pod.yaml
```

Output:

```
pod/hello-app created
```

### Step 4: Verify It's Running

```bash
# Watch the Pod start up
kubectl get pods --watch
```

Wait until the STATUS shows **Running**:

```
NAME        READY   STATUS    RESTARTS   AGE
hello-app   1/1     Running   0          10s
```

Press `Ctrl+C` to stop watching.

### Step 5: Inspect the Pod

```bash
# Get detailed info
kubectl describe pod hello-app
```

This shows a wealth of information including:

- Which node it's on
- The container image being used
- Events (pulling image, creating container, starting container)
- IP address assigned to the Pod

### Step 6: View the Logs

```bash
kubectl logs hello-app
```

You should see:

```
🧊 Kube-Trainer app listening on http://localhost:3000
```

### Step 7: Test the App

You can't access the Pod directly from your browser yet (we'll learn about Services in Phase 3). But you can use `kubectl port-forward` to tunnel traffic:

```bash
# Forward your local port 3000 to the Pod's port 3000
kubectl port-forward pod/hello-app 3000:3000
```

Now open **another terminal** and test:

```bash
# Test the main page
curl http://localhost:3000
# Returns HTML with "Hello World"

# Test the health check
curl http://localhost:3000/health
# Returns: {"status":"ok"}
```

Press `Ctrl+C` in the port-forward terminal when done.

### Step 8: Clean Up (Optional)

```bash
# If you want to remove the Pod
kubectl delete -f app/pod.yaml
```

> ⚠️ **Keep the Pod running** if you want to pass the phase verification! The verify command checks for a running `hello-app` Pod.

---

## What You Learned

In this phase, you:

1. ✅ Understood what Kubernetes is and why it exists
2. ✅ Learned the architecture (Control Plane vs Worker Nodes)
3. ✅ Installed kubectl and minikube in WSL2
4. ✅ Started your first cluster and explored it
5. ✅ Deployed a real app to Kubernetes and accessed it

---

## Verify Your Progress

Run the phase verification to check you've completed everything:

```bash
# From the repo root
node verify-phase.js 1
```

All 5 checks should pass ✅. Once they do, you're ready for **Phase 2: Core Workloads**!

---

**🎉 Congratulations!** You've completed Phase 1. You now have a working Kubernetes environment and have deployed your first application. In Phase 2, you'll learn about Deployments, ReplicaSets, and how Kubernetes manages your workloads at scale.
