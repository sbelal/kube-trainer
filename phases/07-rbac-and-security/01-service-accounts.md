# Service Accounts

Every Pod in Kubernetes runs as a **ServiceAccount**. It's the identity your workload uses when talking to the Kubernetes API. Understanding ServiceAccounts is the foundation of RBAC security.

---

## How ServiceAccounts Work

When a Pod is created, Kubernetes automatically:

1. Assigns it a ServiceAccount (the `default` SA if you don't specify one)
2. Mounts a token as a volume inside the Pod
3. Uses that token to authenticate API requests from within the Pod

```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                    │
│                                                         │
│   ┌──────────┐                     ┌────────────────┐  │
│   │   Pod     │── API requests ──► │  API Server    │  │
│   │          │   (using SA token)  │                │  │
│   └──────────┘                     └────────┬───────┘  │
│        │                                     │          │
│   ServiceAccount                     Does this SA      │
│   token mounted                      have permission?  │
│   at /var/run/                              │          │
│   secrets/kubernetes.io/                    ▼          │
│   serviceaccount/                    RBAC check        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

> 💡 **Key insight:** The `default` ServiceAccount has very limited permissions. For any real API access from your Pods, you should create a dedicated ServiceAccount and grant it only the permissions it needs (principle of least privilege).

---

## Prerequisites

Make sure your cluster is running:

```bash
minikube status
```

If it's not running: `minikube start`

---

## Step 1: Explore the Default ServiceAccount

Every namespace has a `default` ServiceAccount created automatically:

```bash
kubectl get serviceaccounts
```

Output:

```
NAME      SECRETS   AGE
default   0         10d
```

Describe it to see details:

```bash
kubectl describe serviceaccount default
```

Check which ServiceAccount your Pods are using:

```bash
kubectl get pods -l app=hello-app -o jsonpath='{.items[0].spec.serviceAccountName}'
```

This should output `default` — because you haven't assigned a custom one yet.

---

## Step 2: Create a Custom ServiceAccount

Create a manifest for a dedicated ServiceAccount for our app.

Create the file `app/serviceaccount.yaml`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: hello-app-sa
  labels:
    app: hello-app
```

Apply it:

```bash
kubectl apply -f app/serviceaccount.yaml
```

Verify it exists:

```bash
kubectl get serviceaccounts
```

You should now see both `default` and `hello-app-sa`:

```
NAME           SECRETS   AGE
default        0         10d
hello-app-sa   0         5s
```

---

## Step 3: Assign the ServiceAccount to Your Deployment

To make your Pods run as `hello-app-sa`, you need to set `serviceAccountName` in the Pod spec.

Update your Deployment (or apply a new one with the SA assigned):

```bash
kubectl patch deployment hello-app --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/serviceAccountName", "value": "hello-app-sa"}]'
```

This triggers a rolling update. Wait for it to finish:

```bash
kubectl rollout status deployment/hello-app
```

Verify the Pods are using the new ServiceAccount:

```bash
kubectl get pods -l app=hello-app -o jsonpath='{.items[0].spec.serviceAccountName}'
```

This should now output `hello-app-sa`.

---

## Step 4: Inspect the Mounted Token

Shell into a Pod to see the mounted ServiceAccount token:

```bash
POD_NAME=$(kubectl get pods -l app=hello-app -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $POD_NAME -- sh
```

Once inside:

```bash
# View the mounted token directory
ls /var/run/secrets/kubernetes.io/serviceaccount/

# See the token (truncated)
cat /var/run/secrets/kubernetes.io/serviceaccount/token | head -c 50
echo "..."

# See which namespace the Pod is in
cat /var/run/secrets/kubernetes.io/serviceaccount/namespace

# Exit
exit
```

You'll see three files:
- `token` — the JWT token for API authentication
- `ca.crt` — the cluster CA certificate
- `namespace` — the namespace name

---

## Useful kubectl Commands for ServiceAccounts

| Command | Purpose |
|---|---|
| `kubectl get sa` | List all ServiceAccounts |
| `kubectl describe sa <name>` | Show details of a ServiceAccount |
| `kubectl create sa <name>` | Create a ServiceAccount imperatively |
| `kubectl get pods -o jsonpath='{.items[*].spec.serviceAccountName}'` | Check which SA Pods are using |

---

## What You Learned

| Concept | What you did |
|---|---|
| **Default ServiceAccount** | Every namespace has one; Pods use it automatically |
| **Custom ServiceAccount** | Created `hello-app-sa` for dedicated identity |
| **Assignment** | Patched the Deployment to use the custom SA |
| **Mounted token** | Inspected the auto-mounted credentials inside a Pod |
| **Least privilege** | The SA has no RBAC permissions yet — that's next |

---

**Next up:** [Roles & RoleBindings →](./02-roles-and-rolebindings.md)
