# Kubernetes Architecture Overview

Understanding the architecture of Kubernetes helps you reason about what happens when you deploy an app, why certain things fail, and how to debug issues.

## The Big Picture

A Kubernetes **cluster** has two main parts:

```
┌─────────────────────────────────────────────────────────────┐
│                     CONTROL PLANE                           │
│                                                             │
│  ┌──────────────┐  ┌───────────┐  ┌────────────────────┐   │
│  │  API Server   │  │   etcd    │  │  Controller Manager │   │
│  │  (kube-api)   │  │ (storage) │  │                    │   │
│  └──────┬───────┘  └───────────┘  └────────────────────┘   │
│         │                                                   │
│  ┌──────┴───────┐                                           │
│  │  Scheduler    │                                           │
│  └──────────────┘                                           │
└─────────────────────────┬───────────────────────────────────┘
                          │ communicates via API
┌─────────────────────────┴───────────────────────────────────┐
│                      WORKER NODES                           │
│                                                             │
│  ┌─── Node 1 ────────────┐  ┌─── Node 2 ────────────┐     │
│  │                        │  │                        │     │
│  │  ┌────────┐ ┌────────┐ │  │  ┌────────┐ ┌────────┐ │     │
│  │  │  Pod   │ │  Pod   │ │  │  │  Pod   │ │  Pod   │ │     │
│  │  └────────┘ └────────┘ │  │  └────────┘ └────────┘ │     │
│  │                        │  │                        │     │
│  │  kubelet + kube-proxy  │  │  kubelet + kube-proxy  │     │
│  │  + container runtime   │  │  + container runtime   │     │
│  └────────────────────────┘  └────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Control Plane Components

The **Control Plane** is the "brain" of the cluster. It makes decisions about what runs where and ensures the cluster matches your desired state.

### API Server (`kube-apiserver`)

The **front door** to Kubernetes. Every interaction with the cluster goes through the API Server:

- When you run `kubectl get pods`, your request goes to the API Server.
- When a node reports its status, it talks to the API Server.
- Other control plane components communicate with each other through the API Server.

It validates and processes REST requests, then stores the results in etcd.

### etcd

A distributed **key-value store** that acts as the cluster's **database**. It stores:

- The desired state of all resources (Deployments, Services, Pods, etc.)
- Cluster configuration
- Secrets and ConfigMaps

> 💡 **Think of etcd as the "source of truth"** — if it says there should be 3 Pods running, Kubernetes will make sure there are 3 Pods running.

### Scheduler (`kube-scheduler`)

When a new Pod needs to run but hasn't been assigned to a node yet, the Scheduler decides **which node** to place it on. It considers:

- Resource requirements (CPU, memory)
- Hardware constraints
- Affinity/anti-affinity rules (e.g., "don't put two copies on the same node")
- Available capacity on each node

### Controller Manager (`kube-controller-manager`)

Runs a collection of **controllers** — loops that watch the cluster state and make changes to move the actual state toward the desired state. Examples:

| Controller | What it does |
|---|---|
| Deployment Controller | Ensures the right number of Pods are running for each Deployment |
| Node Controller | Monitors node health, marks nodes as unavailable |
| Job Controller | Creates Pods for Jobs and tracks completion |
| ReplicaSet Controller | Ensures the correct number of Pod replicas |

## Worker Node Components

**Worker Nodes** are the machines where your actual application containers run. Each node has three key components:

### kubelet

The **agent** running on every node. It:

- Receives Pod specifications from the API Server
- Ensures containers described in the Pod spec are running and healthy
- Reports node and Pod status back to the API Server

### kube-proxy

Handles **networking rules** on each node:

- Maintains network rules that allow Pods to communicate with each other
- Implements Kubernetes Service abstraction (load balancing traffic to Pods)

### Container Runtime

The software that actually **runs containers**. Kubernetes supports multiple runtimes:

- **containerd** (most common, default for minikube)
- **CRI-O**
- Docker Engine (via containerd underneath)

> 💡 **You already know the container runtime!** When you run `docker run`, Docker uses containerd under the hood. Kubernetes talks directly to containerd, cutting out the Docker daemon middleman.

## How It All Works Together

Here's what happens when you deploy an app:

```
1. You run: kubectl apply -f deployment.yaml
   │
2. ▼ kubectl sends the request to the API Server
   │
3. ▼ API Server validates the request and stores it in etcd
   │
4. ▼ Controller Manager notices a new Deployment was created
   │   → Creates a ReplicaSet → Creates Pod specifications
   │
5. ▼ Scheduler notices unassigned Pods
   │   → Picks the best node for each Pod
   │
6. ▼ kubelet on the chosen node receives the Pod spec
   │   → Tells the container runtime to pull the image and start the container
   │
7. ▼ Pod is running! kubelet reports status back to the API Server
```

## Where Does minikube Fit In?

In production, you'd have multiple physical or virtual machines forming a cluster. For learning, **minikube** simulates a whole cluster on your local machine:

- Creates a **single node** that acts as both Control Plane and Worker Node
- Runs inside a virtual machine or container (in WSL2, it uses Docker as the driver)
- Provides the full Kubernetes API — everything you learn with minikube works the same way in production clusters

```
┌── Your Machine (WSL2) ──────────────────┐
│                                          │
│  ┌── minikube (single-node cluster) ──┐  │
│  │                                    │  │
│  │  Control Plane + Worker Node       │  │
│  │  ┌────────┐  ┌────────┐           │  │
│  │  │  Pod   │  │  Pod   │           │  │
│  │  └────────┘  └────────┘           │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

**Next up:** [Install Tools →](./03-install-tools.md)
