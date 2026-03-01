# LoadBalancer Service

A **LoadBalancer** Service is the standard way to expose an application to the internet in cloud Kubernetes environments. It automatically provisions an external load balancer (like an AWS ELB, GCP Load Balancer, or Azure LB) that routes traffic to your Pods.

---

## What LoadBalancer Does

When you create a LoadBalancer Service in a cloud environment, Kubernetes:

1. Creates a ClusterIP (internal access)
2. Opens a NodePort on every node
3. Provisions a **cloud load balancer** that routes traffic to the NodePort

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│   The Internet                                           │
│       │                                                  │
│       ▼                                                  │
│   Cloud Load Balancer  (e.g., AWS ELB)                   │
│   52.x.x.x:80                                           │
│       │                                                  │
│       ▼                                                  │
│   ┌──────────── Cluster ────────────┐                    │
│   │   NodePort (auto-assigned)       │                    │
│   │       │                          │                    │
│   │       ▼                          │                    │
│   │   Service:80  ──┬──► Pod 1      │                    │
│   │                  ├──► Pod 2      │                    │
│   │                  └──► Pod 3      │                    │
│   └──────────────────────────────────┘                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

> 💡 **Key insight:** LoadBalancer builds on top of NodePort, which builds on top of ClusterIP. Each type adds a new layer of accessibility.

---

## The Service Type Hierarchy

This is worth seeing visually — each Service type includes everything from the type below it:

```
LoadBalancer
  └── includes NodePort
        └── includes ClusterIP
```

| Type | ClusterIP (internal) | NodePort (node access) | External LB |
|---|---|---|---|
| **ClusterIP** | ✅ | ❌ | ❌ |
| **NodePort** | ✅ | ✅ | ❌ |
| **LoadBalancer** | ✅ | ✅ | ✅ |

---

## LoadBalancer in minikube

minikube doesn't have a cloud provider, so LoadBalancer Services stay in **Pending** state by default:

```bash
# DON'T DO THIS YET — just see what would happen
# kubectl apply -f loadbalancer-service.yaml
# kubectl get service → EXTERNAL-IP shows <pending>
```

However, minikube provides a workaround with `minikube tunnel`:

```bash
# In a separate terminal, run:
minikube tunnel
```

This creates a network route so that LoadBalancer Services get an external IP. But since we're learning in a local environment, **we won't create a LoadBalancer Service as a hands-on exercise** — it adds complexity without teaching a new concept beyond what you already know from NodePort.

> 💡 **In production:** You'd just change `type: ClusterIP` to `type: LoadBalancer` in your Service YAML, and your cloud provider automatically provisions a load balancer. That's it — no infrastructure setup needed!

---

## When to Use Each Service Type

Here's the decision framework:

```
                  ┌─────────────────┐
                  │  Do other Pods   │
                  │  need to reach   │
                  │  this service?   │
                  └────┬────────┬───┘
                       │        │
                      Yes       No
                       │        │
                       ▼        ▼
                  ClusterIP   (Maybe you
                              don't need
                              a Service)

                  ┌───────────────────┐
                  │ Do EXTERNAL users  │
                  │ need to reach it?  │
                  └───┬────────────┬──┘
                      │            │
                     Yes           No
                      │            │
                      ▼            ▼
              ┌───────────┐   ClusterIP
              │ Production │   is enough
              │ or Dev?    │
              └──┬─────┬──┘
                 │     │
               Prod   Dev
                 │     │
                 ▼     ▼
          LoadBalancer  NodePort
           or Ingress
```

### Summary Table

| Scenario | Recommended Type |
|---|---|
| Database, cache, internal API | **ClusterIP** |
| Quick dev/testing access | **NodePort** |
| Single service in production (cloud) | **LoadBalancer** |
| Multiple HTTP services, path routing, TLS | **Ingress** (next lesson!) |

---

## What You Learned

| Concept | Key Takeaway |
|---|---|
| **LoadBalancer Service** | Provisions a cloud load balancer automatically |
| **Service hierarchy** | LoadBalancer ⊃ NodePort ⊃ ClusterIP |
| **minikube tunnel** | Simulates LoadBalancer behavior locally |
| **Decision framework** | Choose the right Service type for your use case |

---

**Next up:** [Ingress →](./05-ingress.md)
