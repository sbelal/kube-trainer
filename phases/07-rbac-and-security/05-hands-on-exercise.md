# Hands-On Exercise: RBAC & Security

Time to put everything together! In this exercise, you'll set up a complete RBAC configuration for the hello-app and enforce network-level access control.

---

## Objectives

By the end of this exercise, you should have:

- ✅ Created a dedicated ServiceAccount for the app
- ✅ Created a Role with read-only Pod/Service access
- ✅ Bound the Role to the ServiceAccount
- ✅ Verified RBAC permissions with `kubectl auth can-i`
- ✅ Created and tested a NetworkPolicy

---

## Setup

### 1. Ensure Your Cluster Is Running

```bash
minikube status
```

If it's not running: `minikube start`

> ⚠️ **NetworkPolicy support:** For the NetworkPolicy to be enforced, you need a CNI that supports it. If you haven't already, restart minikube with Calico:
> ```bash
> minikube stop
> minikube start --cni=calico
> ```

### 2. Build the Latest Image

```bash
eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

### 3. Deploy the App

```bash
kubectl apply -f app/deployment.yaml
kubectl apply -f app/clusterip-service.yaml
kubectl rollout status deployment/hello-app
```

---

## Part 1: ServiceAccount

Create and assign a dedicated ServiceAccount:

```bash
# Apply the ServiceAccount
kubectl apply -f app/serviceaccount.yaml

# Verify it exists
kubectl get sa hello-app-sa
```

Assign it to the Deployment:

```bash
kubectl patch deployment hello-app --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/serviceAccountName", "value": "hello-app-sa"}]'

# Wait for rollout
kubectl rollout status deployment/hello-app
```

Verify it's assigned:

```bash
kubectl get pods -l app=hello-app -o jsonpath='{.items[0].spec.serviceAccountName}'
# Should output: hello-app-sa
```

---

## Part 2: RBAC — Role & RoleBinding

Apply the Role and RoleBinding:

```bash
# Apply the Role
kubectl apply -f app/role.yaml

# Apply the RoleBinding
kubectl apply -f app/rolebinding.yaml
```

Verify they exist:

```bash
kubectl get role hello-app-role
kubectl get rolebinding hello-app-rolebinding
```

---

## Part 3: Test RBAC Permissions

Use `kubectl auth can-i` to verify permissions:

```bash
# These should all return "yes"
kubectl auth can-i get pods --as=system:serviceaccount:default:hello-app-sa
kubectl auth can-i list pods --as=system:serviceaccount:default:hello-app-sa
kubectl auth can-i get services --as=system:serviceaccount:default:hello-app-sa

# These should all return "no"
kubectl auth can-i create pods --as=system:serviceaccount:default:hello-app-sa
kubectl auth can-i delete deployments --as=system:serviceaccount:default:hello-app-sa
kubectl auth can-i get secrets --as=system:serviceaccount:default:hello-app-sa
```

List all permissions for the ServiceAccount:

```bash
kubectl auth can-i --list --as=system:serviceaccount:default:hello-app-sa
```

---

## Part 4: NetworkPolicy

Apply the NetworkPolicy:

```bash
kubectl apply -f app/networkpolicy.yaml
```

Verify it exists:

```bash
kubectl get networkpolicy hello-app-netpol
```

Test blocked traffic (no access label):

```bash
kubectl run test-blocked --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s --max-time 5 http://hello-app-clusterip:3000/health
```

This should **time out** — the Pod doesn't have the required label.

Test allowed traffic (with access label):

```bash
kubectl run test-allowed --image=curlimages/curl --rm -it --restart=Never \
  --labels="access=hello-app" -- \
  curl -s --max-time 5 http://hello-app-clusterip:3000/health
```

This should **succeed** — the Pod has the `access: hello-app` label.

---

## Part 5: Inspect Everything

Review the full security setup:

```bash
# ServiceAccount
kubectl describe sa hello-app-sa

# Role permissions
kubectl describe role hello-app-role

# RoleBinding
kubectl describe rolebinding hello-app-rolebinding

# NetworkPolicy rules
kubectl describe networkpolicy hello-app-netpol
```

---

## Verification

Run the phase verification to check your progress:

```bash
node verify-phase.js 7
```

All checks should pass:

- ✅ ServiceAccount hello-app-sa exists
- ✅ Role hello-app-role exists
- ✅ RoleBinding hello-app-rolebinding exists
- ✅ ServiceAccount can get pods (RBAC is working)
- ✅ NetworkPolicy hello-app-netpol exists

---

## What You Accomplished

| Task | Status |
|---|---|
| Created a dedicated ServiceAccount | ✅ |
| Assigned ServiceAccount to Deployment | ✅ |
| Created a Role with read-only access | ✅ |
| Bound the Role to the ServiceAccount | ✅ |
| Verified RBAC permissions | ✅ |
| Created a NetworkPolicy | ✅ |
| Tested blocked and allowed traffic | ✅ |

---

## Summary

In this phase, you learned the core Kubernetes security mechanisms:

| Mechanism | Purpose |
|---|---|
| **ServiceAccounts** | Identity for your Pods — who they are |
| **Roles** | Permissions — what they can do |
| **RoleBindings** | Links — connecting identity to permissions |
| **NetworkPolicies** | Network firewall — who they can talk to |
| **SecurityContext** | Container hardening — how they run |

Together, these implement the **principle of least privilege**: give each workload only the access it actually needs, nothing more.

---

🎉 **Phase 7 Complete!** You now understand Kubernetes RBAC and security fundamentals. Next up is Phase 8: Helm & Kustomize.
