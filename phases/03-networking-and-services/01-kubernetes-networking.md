# Kubernetes Networking Model

Before you can expose your app to the world, you need to understand how networking works inside a Kubernetes cluster. The good news: the model is elegant and consistent.

---

## The Flat Network

In Kubernetes, every Pod gets its own unique IP address. This is fundamentally different from Docker, where containers share the host's network by default and you use port mapping (`-p 8080:3000`) to avoid conflicts.

| Feature | Docker | Kubernetes |
|---|---|---|
| IP per container | ❌ Shared host IP | ✅ Unique IP per Pod |
| Port conflicts | Must map different host ports | No conflicts — each Pod has its own IP |
| Cross-container comms | Via Docker network + container names | Pod-to-Pod via IP directly |

> 💡 **Key insight:** In Kubernetes, any Pod can talk to any other Pod using its IP address — no NAT, no port mapping. This is called the **flat network model**.

### Try It Yourself

If you have a running Pod from Phase 1, you can see its IP:

```bash
kubectl get pod hello-app -o wide
```

The `IP` column shows the Pod's cluster-internal IP address. Other Pods can reach it at `<pod-ip>:3000`.

---

## The Problem: Pods Are Ephemeral

Here's the catch — Pod IPs change constantly:

- If a Pod crashes and restarts, it gets a **new IP**
- If you scale up, new Pods get **new IPs**
- If Kubernetes reschedules a Pod to another node, it gets a **new IP**

Hardcoding Pod IPs is a terrible idea. You'd have to update every client every time something changes.

> ❓ **So how do you give your app a stable address?**
>
> This is the exact problem **Services** solve.

---

## Services: Stable Networking for Pods

A **Service** is a Kubernetes resource that provides:

1. **A stable IP address** (doesn't change when Pods restart)
2. **A DNS name** (e.g., `hello-app-clusterip.default.svc.cluster.local`)
3. **Load balancing** across multiple Pods

A Service uses **label selectors** to find which Pods to route traffic to. Remember this from the Pod manifest?

```yaml
metadata:
  labels:
    app: hello-app   # ← This label is how Services find your Pods
```

---

## The Four Service Types

Kubernetes has four Service types, each building on the previous one:

| Type | Accessible From | Use Case |
|---|---|---|
| **ClusterIP** | Inside the cluster only | Internal service-to-service communication |
| **NodePort** | Outside the cluster via `<NodeIP>:<Port>` | Development, quick external access |
| **LoadBalancer** | Outside via a cloud load balancer | Production cloud deployments |
| **ExternalName** | DNS alias to an external service | Bridging to services outside K8s |

In this phase, you'll work hands-on with the first three and learn about Ingress — a more powerful alternative to LoadBalancer for HTTP traffic.

---

## Prerequisites for This Phase

Before starting the hands-on exercises, make sure you have:

1. ✅ A running minikube cluster (`minikube status`)
2. ✅ Docker pointed at minikube (`eval $(minikube docker-env)`)
3. ✅ The `kube-trainer-app:latest` image built (`docker images | grep kube-trainer-app`)

If your image isn't built yet, rebuild it:

```bash
eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

---

**Next up:** [ClusterIP Service →](./02-clusterip-service.md)
