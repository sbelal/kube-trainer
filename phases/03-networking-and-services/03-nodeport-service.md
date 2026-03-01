# NodePort Service

A **NodePort** Service extends ClusterIP by opening a port on **every node** in the cluster. This lets you access your app from outside the cluster — perfect for development and testing.

---

## What NodePort Does

When you create a NodePort Service, Kubernetes does three things:

1. Creates a ClusterIP (just like before — internal access still works)
2. Opens a specific port (the **NodePort**) on **every node** in the cluster
3. Routes traffic from `<NodeIP>:<NodePort>` → Service → Pods

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Your Browser                                              │
│       │                                                     │
│       ▼                                                     │
│   <NodeIP>:30080  ────────────────────────────┐             │
│                                               │             │
│   ┌──────────────── Cluster ────────────────┐ │             │
│   │                                         │ │             │
│   │   hello-app-nodeport:80  ──┬──► Pod 1   │ │             │
│   │      (ClusterIP + NodePort)├──► Pod 2   │ │             │
│   │                            └──────────────┘             │
│   └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> 💡 **When to use NodePort:** For development, demos, or when you need quick external access without a cloud load balancer. Not recommended for production — NodePorts are limited to the range 30000–32767.

---

## Understanding the Three Ports

NodePort introduces a third port concept. This trips up a lot of beginners:

| Port | What it is | In the YAML |
|---|---|---|
| **`port`** | The port the Service listens on *inside* the cluster | `port: 80` |
| **`targetPort`** | The port on the Pod (where your app listens) | `targetPort: 3000` |
| **`nodePort`** | The port opened on every node (external access) | `nodePort: 30080` |

Traffic flow:

```
Outside → NodeIP:30080 (nodePort)
                 ↓
         Service:80 (port)
                 ↓
          Pod:3000 (targetPort)
```

---

## Step 1: Create the NodePort Service

Look at `app/nodeport-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: hello-app-nodeport
  labels:
    app: hello-app
spec:
  type: NodePort
  selector:
    app: hello-app
  ports:
  - port: 80
    targetPort: 3000
    nodePort: 30080
    protocol: TCP
```

The key difference from ClusterIP:

- `type: NodePort` — opens a port on every node
- `nodePort: 30080` — the specific external port (must be 30000–32767)

Apply it:

```bash
kubectl apply -f app/nodeport-service.yaml
```

---

## Step 2: Verify the Service

```bash
kubectl get service hello-app-nodeport
```

Expected:

```
NAME                 TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
hello-app-nodeport   NodePort   10.96.x.x     <none>        80:30080/TCP   5s
```

Notice `80:30080/TCP` — this means port 80 internally, port 30080 externally.

---

## Step 3: Access from Outside the Cluster

With minikube using the Docker driver (the default on Linux), the node IP isn't directly accessible from your host. You need `minikube service` to create a tunnel — and it **must stay running** in the foreground.

### Open Two Terminals

**Terminal 1** — Start the tunnel (keep this running):

```bash
minikube service hello-app-nodeport
```

This will output something like:

```
|-----------|--------------------|-----------|-----------------------------|
| NAMESPACE |        NAME        | TARGET PORT |            URL            |
|-----------|--------------------|-----------|-----------------------------|
| default   | hello-app-nodeport |        80 | http://192.168.49.2:30080   |
|-----------|--------------------|-----------|-----------------------------|
🏃  Starting tunnel for service hello-app-nodeport.
|-----------|--------------------|-----------|-----------------------|
| NAMESPACE |        NAME        | TARGET PORT |          URL          |
|-----------|--------------------|-----------|-----------------------|
| default   | hello-app-nodeport |           | http://127.0.0.1:XXXXX|
|-----------|--------------------|-----------|-----------------------|
```

> ⚠️ **Keep this terminal open!** The tunnel only works while `minikube service` is running. If you close it, the URL stops working.

**Terminal 2** — Test the app using the `http://127.0.0.1:XXXXX` URL from the tunnel output:

```bash
# Replace XXXXX with the port from the tunnel output above
curl http://127.0.0.1:XXXXX
```

You should see the Hello World HTML page!

Test the health endpoint too:

```bash
curl http://127.0.0.1:XXXXX/health
```

Expected:

```json
{"status":"ok"}
```

When you're done testing, press `Ctrl+C` in Terminal 1 to stop the tunnel.

> 💡 **Why the tunnel?** minikube's Docker driver runs the cluster inside a container. The node IP (e.g., `192.168.49.2`) lives in Docker's internal network, which your host can't reach directly. `minikube service` creates a tunnel from `127.0.0.1` on your host to the NodePort inside the cluster.

---

## Step 4: Compare with ClusterIP

Let's see both Services side by side:

```bash
kubectl get services -l app=hello-app
```

```
NAME                  TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
hello-app-clusterip   ClusterIP   10.96.100.50    <none>        80/TCP         10m
hello-app-nodeport    NodePort    10.96.200.75    <none>        80:30080/TCP   2m
```

Both Services route to the **same Pods** (because they use the same selector `app: hello-app`). The difference is only in how they're accessed.

---

## NodePort Limitations

While NodePort is great for development, it has drawbacks in production:

| Limitation | Why it matters |
|---|---|
| Port range 30000–32767 | Can't use standard ports (80, 443) |
| No SSL termination | You'd need to handle TLS in the app |
| Security | Exposes ports on ALL nodes |
| No smart routing | No path-based or host-based routing |

This is why production Kubernetes deployments use **LoadBalancer** Services or **Ingress** — which we'll cover next.

---

## What You Learned

| Concept | What you did |
|---|---|
| **NodePort Service** | Exposed the app on port 30080 on every node |
| **Three port types** | `port` (Service), `targetPort` (Pod), `nodePort` (external) |
| **`minikube service`** | Accessed the NodePort from your host machine |
| **ClusterIP vs NodePort** | Same backend, different access patterns |

---

**Next up:** [LoadBalancer Service →](./04-loadbalancer-service.md)
