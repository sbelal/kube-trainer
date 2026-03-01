# What is Kubernetes?

## From Docker to Kubernetes

You already know Docker — you can package an application into a container image and run it with `docker run`. That works great for a single container on a single machine. But what happens when you need to:

- Run **dozens or hundreds** of containers across multiple machines?
- **Automatically restart** a container that crashes?
- **Scale up** when traffic increases and **scale down** when it drops?
- **Roll out updates** without downtime?
- **Distribute traffic** evenly across container instances?

Solving these problems manually with Docker alone is painful. This is the **container orchestration problem**, and Kubernetes was built to solve it.

## What Kubernetes Actually Does

**Kubernetes** (often abbreviated **K8s**) is an open-source container orchestration platform originally developed by Google. It automates the deployment, scaling, and management of containerized applications.

Think of it this way:

| Concept | Docker Analogy | Kubernetes |
|---|---|---|
| Running an app | `docker run` | Pods, Deployments |
| Networking | `docker network`, port mapping | Services, Ingress |
| Multi-container apps | `docker-compose.yml` | K8s manifests (YAML files) |
| Scaling | Manual `docker run` × N | `kubectl scale` or autoscaling |
| Self-healing | Restart policies | Built-in health checks + auto-restart |
| Multi-machine | Docker Swarm (rarely used) | Core feature of K8s |

## Key Concepts

### 1. Declarative Configuration

Instead of telling Kubernetes *how* to do something step by step (imperative), you tell it *what you want* (declarative). You write a YAML file describing your desired state, and Kubernetes continuously works to make reality match that state.

```yaml
# Example: "I want 3 copies of my app running"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3        # ← Desired state: 3 instances
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:1.0
```

> 💡 **Don't worry about understanding every line yet.** The point is: you declare what you want, and Kubernetes makes it happen.

### 2. Desired State vs. Actual State

Kubernetes constantly compares the **desired state** (what you declared) with the **actual state** (what's running). If they differ, it takes action:

- A container crashed? → Kubernetes restarts it.
- You declared 3 replicas but only 2 are running? → Kubernetes starts another one.
- You updated the container image? → Kubernetes rolls out the new version gradually.

This is called a **reconciliation loop** — it's the core of how Kubernetes works.

### 3. Self-Healing

Because of the reconciliation loop, Kubernetes is **self-healing**:

- If a node (machine) goes down, Kubernetes reschedules its containers on other nodes.
- If a container exits unexpectedly, Kubernetes restarts it.
- If a container fails a health check, Kubernetes stops sending traffic to it.

You don't have to write monitoring scripts or manual recovery procedures — Kubernetes handles it.

## Why Not Docker Compose?

Docker Compose is great for local development, but it has limits:

| Feature | Docker Compose | Kubernetes |
|---|---|---|
| Multi-machine | ❌ Single host | ✅ Cluster of machines |
| Self-healing | ❌ Limited restart policies | ✅ Full reconciliation |
| Scaling | ❌ Manual | ✅ Auto-scaling |
| Rolling updates | ❌ No | ✅ Built-in |
| Service discovery | ❌ Basic DNS | ✅ Full DNS + load balancing |
| Production-ready | ❌ Not designed for it | ✅ Battle-tested at scale |

Kubernetes is what you use when your application outgrows a single machine or when you need production-grade reliability.

## Terminology Quick Reference

| Term | Meaning |
|---|---|
| **Cluster** | A set of machines (nodes) running Kubernetes |
| **Node** | A single machine in the cluster (can be physical or virtual) |
| **Pod** | The smallest deployable unit — one or more containers running together |
| **Deployment** | Manages a set of identical Pods (handles scaling + updates) |
| **Service** | A stable network endpoint that routes traffic to Pods |
| **Namespace** | A way to divide a cluster into virtual sub-clusters |
| **kubectl** | The CLI tool to interact with Kubernetes |
| **Manifest** | A YAML file describing a Kubernetes resource |

Don't memorize all of these now — you'll learn each one hands-on in the coming lessons.

---

**Next up:** [Architecture Overview →](./02-architecture-overview.md)
