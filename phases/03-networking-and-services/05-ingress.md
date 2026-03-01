# Ingress

An **Ingress** is a Kubernetes resource that manages external HTTP/HTTPS access to Services in your cluster. Think of it as a smart reverse proxy that sits in front of your Services and routes traffic based on hostnames and URL paths.

---

## Why Ingress?

With NodePort and LoadBalancer, each Service gets its own external entry point. This creates problems at scale:

| Problem | Without Ingress | With Ingress |
|---|---|---|
| 10 services | 10 LoadBalancers ($$$) | 1 Ingress controller |
| Path routing | Not possible | `api.example.com/users` → Service A |
| Host routing | Not possible | `app.example.com` → Service A, `api.example.com` → Service B |
| TLS/SSL | Configure per-service | Single TLS termination point |
| HTTP features | None | Redirects, rate limiting, auth |

> 💡 **Key insight:** Ingress gives you **one** entry point to your cluster that intelligently routes HTTP traffic to multiple Services based on rules you define.

---

## How Ingress Works

Ingress has two parts:

### 1. Ingress Resource (the rules)

A YAML file that defines routing rules — "send traffic for `hello-app.local` to the `hello-app-clusterip` Service."

### 2. Ingress Controller (the engine)

A Pod running inside your cluster that reads Ingress resources and configures a reverse proxy (typically NGINX) to implement the rules. **Without an Ingress Controller, Ingress resources do nothing.**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Browser: http://hello-app.local                           │
│       │                                                     │
│       ▼                                                     │
│   ┌──────────── Cluster ────────────────────────────────┐   │
│   │                                                     │   │
│   │   NGINX Ingress Controller (Pod)                    │   │
│   │       │                                             │   │
│   │       │  Rule: hello-app.local → hello-app-clusterip│   │
│   │       │                                             │   │
│   │       ▼                                             │   │
│   │   hello-app-clusterip:80  ──┬──► Pod 1              │   │
│   │                              └──► Pod 2             │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Enable the Ingress Controller

minikube includes an NGINX Ingress controller as an addon. Enable it:

```bash
minikube addons enable ingress
```

Wait for the controller Pod to be running:

```bash
# Watch until the controller Pod shows Running
kubectl get pods -n ingress-nginx --watch
```

You should eventually see:

```
NAME                                        READY   STATUS    RESTARTS   AGE
ingress-nginx-controller-xxxxxxxxxx-xxxxx   1/1     Running   0          30s
```

Press `Ctrl+C` to stop watching.

> 💡 **What just happened?** minikube deployed an NGINX-based Ingress controller into the `ingress-nginx` namespace. This Pod watches for Ingress resources and configures NGINX to route traffic accordingly.

---

## Step 2: Create the Ingress Resource

Make sure your ClusterIP Service is still running:

```bash
kubectl get service hello-app-clusterip
```

If not, re-apply it:

```bash
kubectl apply -f app/clusterip-service.yaml
```

Now look at `app/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hello-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: hello-app.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: hello-app-clusterip
            port:
              number: 80
```

Let's break this down:

| Field | Meaning |
|---|---|
| `ingressClassName: nginx` | Use the NGINX Ingress controller |
| `host: hello-app.local` | Route traffic for this hostname |
| `path: /` | Match all paths starting with `/` |
| `pathType: Prefix` | Match the path as a prefix |
| `backend.service.name` | Forward to this Service |
| `backend.service.port.number` | On this port |
| `rewrite-target: /` | Rewrite the URL path to `/` before forwarding |

Apply it:

```bash
kubectl apply -f app/ingress.yaml
```

---

## Step 3: Verify the Ingress

```bash
kubectl get ingress hello-app-ingress
```

Expected:

```
NAME                CLASS   HOSTS             ADDRESS        PORTS   AGE
hello-app-ingress   nginx   hello-app.local   192.168.49.2   80      10s
```

The **ADDRESS** column shows the IP where the Ingress controller is listening. It may take a minute to appear.

Get more details:

```bash
kubectl describe ingress hello-app-ingress
```

Look for the `Rules` section — it shows how traffic is being routed.

---

## Step 4: Test the Ingress

To test, you need to send HTTP requests with the `Host: hello-app.local` header. There are two ways:

### Option A: Use curl with --resolve (Recommended)

First, get the minikube IP:

```bash
minikube ip
```

Then use `curl` with the `--resolve` flag to map `hello-app.local` to the minikube IP:

```bash
# Replace <MINIKUBE_IP> with the output of 'minikube ip'
curl --resolve hello-app.local:80:<MINIKUBE_IP> http://hello-app.local
```

Or as a one-liner:

```bash
curl --resolve hello-app.local:80:$(minikube ip) http://hello-app.local
```

You should see the Hello World HTML page!

Test the health endpoint:

```bash
curl --resolve hello-app.local:80:$(minikube ip) http://hello-app.local/health
```

Expected:

```json
{"status":"ok"}
```

### Option B: Edit /etc/hosts

Alternatively, add an entry to your hosts file:

```bash
# Get the minikube IP
minikube ip

# Add it to /etc/hosts (requires sudo)
echo "$(minikube ip) hello-app.local" | sudo tee -a /etc/hosts
```

Then you can simply run:

```bash
curl http://hello-app.local
```

> ⚠️ **Remember to clean up** the `/etc/hosts` entry when you're done to avoid conflicts.

---

## Ingress vs. LoadBalancer: When to Use What

| Feature | LoadBalancer | Ingress |
|---|---|---|
| **Protocol** | Any (TCP/UDP) | HTTP/HTTPS only |
| **Routing** | 1 Service per LB | Multiple Services per Ingress |
| **Path-based routing** | ❌ | ✅ `/api` → Service A, `/web` → Service B |
| **Host-based routing** | ❌ | ✅ `api.example.com` → A, `web.example.com` → B |
| **TLS termination** | Per-LB | Centralized |
| **Cost (cloud)** | $$ per service | $ single LB for all services |
| **Best for** | Non-HTTP services (databases, gRPC) | HTTP/HTTPS web applications |

> 💡 **Rule of thumb:** For HTTP/HTTPS traffic, almost always use Ingress. For non-HTTP protocols (databases, message queues), use LoadBalancer or NodePort.

---

## Phase Summary: What You Learned

Across this entire phase, you've learned the complete Kubernetes networking stack:

1. ✅ **Kubernetes Networking Model** — Every Pod gets an IP, flat network
2. ✅ **ClusterIP** — Stable internal endpoint with DNS
3. ✅ **NodePort** — External access via node ports (dev/testing)
4. ✅ **LoadBalancer** — Cloud-provisioned external load balancer
5. ✅ **Ingress** — Smart HTTP routing with host and path rules

### The Big Picture

```
                    Internet
                       │
                       ▼
              ┌──── Ingress ────┐
              │  (HTTP routing)  │
              └──┬──────────┬───┘
                 │          │
                 ▼          ▼
           Service A   Service B
          (ClusterIP)  (ClusterIP)
              │            │
          ┌───┴───┐    ┌───┴───┐
          │Pod│Pod│    │Pod│Pod│
          └───┴───┘    └───┴───┘
```

---

## Verify Your Progress

Run the phase verification to check you've completed everything:

```bash
# From the repo root
node verify-phase.js 3
```

All 5 checks should pass ✅. Once they do, you're ready for **Phase 4: Storage & Configuration**!

---

**🎉 Congratulations!** You've completed Phase 3. You now understand how to expose your applications both inside and outside the cluster. In Phase 4, you'll learn about ConfigMaps, Secrets, Volumes, and how Kubernetes manages application configuration and persistent storage.
