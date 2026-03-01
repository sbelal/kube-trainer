# ClusterIP Service

A **ClusterIP** Service gives your Pods a stable internal IP and DNS name. It's the default Service type and the foundation for all Kubernetes networking.

---

## What ClusterIP Does

When you create a ClusterIP Service:

1. Kubernetes assigns it a **stable virtual IP** (the "Cluster IP")
2. It creates a **DNS entry** so other Pods can find it by name
3. It **load-balances** traffic across all matching Pods

```
┌───────────────────────────────────────────────────┐
│                  Kubernetes Cluster               │
│                                                   │
│   Pod A ──► hello-app-clusterip:80 ──┬──► Pod 1   │
│                (ClusterIP)           ├──► Pod 2   │
│   Pod B ──► 10.96.x.x:80 ────────────┘            │
│                                                   │
│   ❌ Not accessible from outside the cluster     │
└───────────────────────────────────────────────────┘
```

> 💡 **When to use ClusterIP:** For internal services that only need to be reached by other Pods. Examples: a database, a cache, an internal API.

---

## Step 1: Deploy the App with a Deployment

Before creating a Service, we need Pods to route traffic to. Instead of using a bare Pod (like in Phase 1), we'll use a **Deployment** — it manages replicas and keeps them running.

Look at `app/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-app
  labels:
    app: hello-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hello-app
  template:
    metadata:
      labels:
        app: hello-app
    spec:
      containers:
      - name: hello-app
        image: kube-trainer-app:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
```

| Field | Meaning |
|---|---|
| `replicas: 2` | Run 2 identical Pods |
| `selector.matchLabels` | How the Deployment finds its Pods |
| `template.metadata.labels` | Labels applied to each Pod — **must match** the selector |
| `imagePullPolicy: Never` | Use the local image built inside minikube |

First, delete the bare Pod from Phase 1 (if it's still running) to avoid conflicts:

```bash
kubectl delete pod hello-app --ignore-not-found
```

Now apply the Deployment:

```bash
kubectl apply -f app/deployment.yaml
```

Verify both replicas are running:

```bash
kubectl get pods -l app=hello-app
```

You should see 2 Pods with STATUS **Running**:

```
NAME                         READY   STATUS    RESTARTS   AGE
hello-app-xxxxxxxxxx-xxxxx   1/1     Running   0          10s
hello-app-xxxxxxxxxx-xxxxx   1/1     Running   0          10s
```

---

## Step 2: Create the ClusterIP Service

Look at `app/clusterip-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: hello-app-clusterip
  labels:
    app: hello-app
spec:
  type: ClusterIP
  selector:
    app: hello-app
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
```

Let's break this down:

| Field | Meaning |
|---|---|
| `type: ClusterIP` | The default — creates an internal-only virtual IP |
| `selector: app: hello-app` | Route traffic to Pods with this label |
| `port: 80` | The port the Service listens on |
| `targetPort: 3000` | The port on the Pod to forward to |

> 💡 **Port mapping:** Clients connect to the Service on port **80**, and the Service forwards traffic to the Pods on port **3000**. This is similar to Docker's `-p 80:3000`.

Apply it:

```bash
kubectl apply -f app/clusterip-service.yaml
```

---

## Step 3: Verify the Service

Check the Service was created:

```bash
kubectl get service hello-app-clusterip
```

Expected output:

```
NAME                  TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
hello-app-clusterip   ClusterIP   10.96.x.x     <none>        80/TCP    5s
```

Notice:
- **CLUSTER-IP**: A stable virtual IP assigned by Kubernetes
- **EXTERNAL-IP**: `<none>` — ClusterIP is internal only
- **PORT(S)**: `80/TCP` — the Service port

---

## Step 4: Test from Inside the Cluster

Since ClusterIP is internal-only, you can't access it from your browser. But you can test it from inside the cluster using a temporary debug Pod:

```bash
# Run a temporary Pod with curl installed
kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s http://hello-app-clusterip/health
```

You should see:

```json
{"status":"ok"}
```

> 💡 **How does DNS work?** Kubernetes automatically creates a DNS entry for every Service. Inside the cluster, `hello-app-clusterip` resolves to the Service's Cluster IP. The full DNS name is `hello-app-clusterip.default.svc.cluster.local`, but within the same namespace you can use just the short name.

### Kubernetes DNS Names

| Format | Example |
|---|---|
| Short name (same namespace) | `hello-app-clusterip` |
| With namespace | `hello-app-clusterip.default` |
| Fully qualified (FQDN) | `hello-app-clusterip.default.svc.cluster.local` |

---

## Step 5: See the Endpoints

A Service doesn't directly know about Pods — it maintains an **Endpoints** list of Pod IPs that match its selector:

```bash
kubectl get endpoints hello-app-clusterip
```

You should see the IPs of both Pods:

```
NAME                  ENDPOINTS                       AGE
hello-app-clusterip   172.17.0.3:3000,172.17.0.4:3000   1m
```

These IPs match the Pod IPs you saw with `kubectl get pods -o wide`.

---

## What You Learned

| Concept | What you did |
|---|---|
| **Deployment** | Created 2 replicas of the hello-app |
| **ClusterIP Service** | Gave the Pods a stable internal IP and DNS name |
| **Label selectors** | Service finds Pods via `app: hello-app` label |
| **Port mapping** | Service port 80 → Pod port 3000 |
| **Kubernetes DNS** | Accessed the Service by name from inside the cluster |
| **Endpoints** | Verified the Service discovered both Pod IPs |

---

**Next up:** [NodePort Service →](./03-nodeport-service.md)
