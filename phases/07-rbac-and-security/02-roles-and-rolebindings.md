# Roles & RoleBindings

Now that your Pods have a dedicated ServiceAccount, you need to grant it permissions. Kubernetes uses **Role-Based Access Control (RBAC)** to control what each identity can do.

---

## The RBAC Model

RBAC has four key resources that work together:

```
┌────────────────────────────────────────────────────────────────┐
│                        RBAC Model                              │
│                                                                │
│   WHO                  WHAT                 WHERE              │
│   ┌──────────┐         ┌──────────┐         ┌──────────────┐  │
│   │ Subject  │──bind──►│  Role    │──scope──►│  Namespace   │  │
│   │          │         │          │         │  or Cluster  │  │
│   └──────────┘         └──────────┘         └──────────────┘  │
│                                                                │
│   Subject: User, Group, or ServiceAccount                      │
│   Role:    A set of permissions (verbs on resources)           │
│   Binding: Connects a Subject to a Role                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

| Resource | Scope | Purpose |
|---|---|---|
| **Role** | Namespace | Permissions within a single namespace |
| **ClusterRole** | Cluster-wide | Permissions across all namespaces |
| **RoleBinding** | Namespace | Binds a Role/ClusterRole to subjects in a namespace |
| **ClusterRoleBinding** | Cluster-wide | Binds a ClusterRole to subjects cluster-wide |

> 💡 **Key insight:** Always prefer namespace-scoped Role + RoleBinding over ClusterRole + ClusterRoleBinding. Only use cluster-scope when you genuinely need cross-namespace access.

---

## RBAC Verbs

Permissions are defined as **verbs** on **resources**:

| Verb | HTTP Equivalent | What it allows |
|---|---|---|
| `get` | GET (single) | Read a specific resource |
| `list` | GET (collection) | List all resources of a type |
| `watch` | GET (streaming) | Watch for changes |
| `create` | POST | Create new resources |
| `update` | PUT | Update existing resources |
| `patch` | PATCH | Partially update resources |
| `delete` | DELETE | Delete resources |

---

## Prerequisites

Make sure the ServiceAccount from Lesson 1 exists:

```bash
kubectl get sa hello-app-sa
```

If not, apply it:

```bash
kubectl apply -f app/serviceaccount.yaml
```

---

## Step 1: Create a Role

A Role defines **what** actions are allowed on **which** resources within a namespace.

Create the file `app/role.yaml`:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: hello-app-role
  labels:
    app: hello-app
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["services"]
    verbs: ["get", "list"]
```

This Role allows:
- ✅ Reading and watching Pods
- ✅ Reading Services
- ❌ Creating, updating, or deleting anything
- ❌ Reading Secrets, ConfigMaps, or Deployments

Apply it:

```bash
kubectl apply -f app/role.yaml
```

Verify:

```bash
kubectl get role hello-app-role
```

Describe it to see the rules:

```bash
kubectl describe role hello-app-role
```

Output:

```
Name:         hello-app-role
Labels:       app=hello-app
PolicyRule:
  Resources  Non-Resource URLs  Resource Names  Verbs
  ---------  -----------------  --------------  -----
  pods       []                 []              [get list watch]
  services   []                 []              [get list]
```

---

## Step 2: Create a RoleBinding

A RoleBinding connects the Role to a Subject (our ServiceAccount).

Create the file `app/rolebinding.yaml`:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: hello-app-rolebinding
  labels:
    app: hello-app
subjects:
  - kind: ServiceAccount
    name: hello-app-sa
    namespace: default
roleRef:
  kind: Role
  name: hello-app-role
  apiGroup: rbac.authorization.k8s.io
```

Apply it:

```bash
kubectl apply -f app/rolebinding.yaml
```

Verify:

```bash
kubectl get rolebinding hello-app-rolebinding
```

Describe it to see the binding details:

```bash
kubectl describe rolebinding hello-app-rolebinding
```

---

## Step 3: Test Permissions with `kubectl auth can-i`

The `kubectl auth can-i` command lets you check whether a subject has a specific permission. Use `--as` to impersonate the ServiceAccount:

```bash
# Should be "yes" — we granted get pods
kubectl auth can-i get pods --as=system:serviceaccount:default:hello-app-sa

# Should be "yes" — we granted list pods
kubectl auth can-i list pods --as=system:serviceaccount:default:hello-app-sa

# Should be "yes" — we granted get services
kubectl auth can-i get services --as=system:serviceaccount:default:hello-app-sa

# Should be "no" — we did NOT grant create pods
kubectl auth can-i create pods --as=system:serviceaccount:default:hello-app-sa

# Should be "no" — we did NOT grant delete deployments
kubectl auth can-i delete deployments --as=system:serviceaccount:default:hello-app-sa

# Should be "no" — we did NOT grant get secrets
kubectl auth can-i get secrets --as=system:serviceaccount:default:hello-app-sa
```

> 💡 **The `--as` flag:** The ServiceAccount identity format is `system:serviceaccount:<namespace>:<sa-name>`. This is how Kubernetes identifies ServiceAccounts internally.

---

## Step 4: Understanding ClusterRole & ClusterRoleBinding

For completeness, here's how cluster-scoped RBAC works. **You don't need to create these**, but it's important to understand the difference:

```yaml
# ClusterRole — applies across ALL namespaces
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: pod-reader-global
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
---
# ClusterRoleBinding — binds cluster-wide
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: pod-reader-global-binding
subjects:
  - kind: ServiceAccount
    name: hello-app-sa
    namespace: default
roleRef:
  kind: ClusterRole
  name: pod-reader-global
  apiGroup: rbac.authorization.k8s.io
```

| Scenario | Use |
|---|---|
| App needs to read its own Pods | Role + RoleBinding ✅ |
| Monitoring tool needs to read Pods in all namespaces | ClusterRole + ClusterRoleBinding |
| Admin needs full cluster access | ClusterRole `cluster-admin` + ClusterRoleBinding |

---

## Useful kubectl Commands for RBAC

| Command | Purpose |
|---|---|
| `kubectl get roles` | List Roles in the current namespace |
| `kubectl get clusterroles` | List ClusterRoles |
| `kubectl get rolebindings` | List RoleBindings |
| `kubectl describe role <name>` | Show Role permissions |
| `kubectl auth can-i <verb> <resource>` | Check your own permissions |
| `kubectl auth can-i <verb> <resource> --as=<subject>` | Check another subject's permissions |
| `kubectl auth can-i --list --as=<subject>` | List all permissions for a subject |

---

## What You Learned

| Concept | What you did |
|---|---|
| **RBAC model** | Understood Subjects, Roles, and Bindings |
| **Role** | Created a Role with read-only Pod and Service access |
| **RoleBinding** | Bound the Role to `hello-app-sa` |
| **Permission testing** | Used `kubectl auth can-i --as` to verify permissions |
| **Scope** | Understood namespace vs cluster-wide scope |

---

**Next up:** [Network Policies →](./03-network-policies.md)
