# Your First Kubernetes Cluster

Time to get hands-on! In this lesson you'll start a local Kubernetes cluster with minikube and explore it using kubectl.

---

## Starting Your First Cluster

Starting a cluster is a single command:

```bash
minikube start
```

This will take a minute or two the first time as it downloads the Kubernetes node image. You'll see output like:

```
😄  minikube v1.x.x on Ubuntu
✨  Using the docker driver based on user configuration
📦  Preparing Kubernetes v1.x.x on Docker ...
🔗  Configuring bridge networking ...
🏄  Done! kubectl is now configured to use "minikube" cluster
```

> 💡 **What just happened?** minikube created a Docker container that runs a full Kubernetes node — including the control plane (API Server, etcd, Scheduler, Controller Manager) and the worker node components (kubelet, kube-proxy). It also automatically configured kubectl to talk to this cluster.

---

## Verifying Cluster Connectivity

### Check Cluster Info

```bash
kubectl cluster-info
```

Expected output:

```
Kubernetes control plane is running at https://192.168.x.x:8443
CoreDNS is running at https://192.168.x.x:8443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
```

This tells you the API Server is running and kubectl can reach it. 

### Check Nodes

```bash
kubectl get nodes
```

Expected output:

```
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   1m    v1.x.x
```

You have one node called "minikube" and it's in **Ready** status. Since minikube is a single-node cluster, this one node acts as both the control plane and the worker node.

### Check minikube Status

```bash
minikube status
```

Expected output:

```
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

All four components should show as **Running** or **Configured**.

---

## Understanding kubeconfig

When minikube started, it configured kubectl to connect to the new cluster. This configuration is stored in a file called **kubeconfig**, located at `~/.kube/config`.

### View Your Context

```bash
kubectl config current-context
```

Output: `minikube`

A **context** tells kubectl which cluster to talk to and with what credentials. Right now you have one context called "minikube".

### View the Full Config

```bash
kubectl config view
```

This shows:

- **Clusters** — the Kubernetes API server endpoints you know about
- **Users** — credentials for authentication
- **Contexts** — a (cluster + user + namespace) combination

> 💡 **In production**, you might have multiple contexts (e.g., `dev-cluster`, `staging-cluster`, `prod-cluster`) and switch between them with `kubectl config use-context <name>`. For now, you only have "minikube".

---

## Exploring What's Already Running

Even on a fresh cluster, Kubernetes runs system components. Let's look:

```bash
kubectl get pods --all-namespaces
```

Output will look something like:

```
NAMESPACE     NAME                               READY   STATUS    RESTARTS   AGE
kube-system   coredns-xxxxxxx                    1/1     Running   0          5m
kube-system   etcd-minikube                      1/1     Running   0          5m
kube-system   kube-apiserver-minikube            1/1     Running   0          5m
kube-system   kube-controller-manager-minikube   1/1     Running   0          5m
kube-system   kube-proxy-xxxxx                   1/1     Running   0          5m
kube-system   kube-scheduler-minikube            1/1     Running   0          5m
kube-system   storage-provisioner                1/1     Running   0          5m
```

Recognize these names from the [Architecture Overview](./02-architecture-overview.md)? These are the control plane components running as Pods inside the `kube-system` namespace.

> 💡 **Namespaces** are like folders for organizing resources. The `kube-system` namespace holds Kubernetes' internal components. Your apps will go in the `default` namespace (or custom ones).

---

## Stopping and Restarting

When you're done working, you can stop the cluster to save resources:

```bash
# Pause the cluster (saves state)
minikube stop

# Resume later
minikube start

# Delete the cluster entirely (when you want a fresh start)
minikube delete
```

> ⚠️ **Don't delete your cluster yet!** You'll need it for the next lesson.

---

## Summary

| Command | What it does |
|---|---|
| `minikube start` | Create and start a local cluster |
| `minikube stop` | Stop the cluster (preserves state) |
| `minikube status` | Check if the cluster is running |
| `minikube delete` | Destroy the cluster completely |
| `kubectl cluster-info` | Show cluster endpoint info |
| `kubectl get nodes` | List all nodes in the cluster |
| `kubectl config current-context` | Show which cluster kubectl is talking to |
| `kubectl get pods --all-namespaces` | List all pods across all namespaces |

---

**Next up:** [kubectl Basics →](./05-kubectl-basics.md)
