# Hands-On Exercise: Production & CI/CD

Time to put everything together! In this exercise, you'll create a production namespace, enforce resource constraints, deploy the app, and practice cluster maintenance operations.

---

## Objectives

By the end of this exercise, you should have:

- ✅ Created the `hello-prod` namespace
- ✅ Applied a ResourceQuota to `hello-prod`
- ✅ Applied a LimitRange to `hello-prod`
- ✅ Deployed hello-app into `hello-prod`
- ✅ Practiced cordon/drain/uncordon (node is uncordoned)
- ✅ Verified all checks pass

---

## Setup

### 1. Ensure Your Cluster Is Running

```bash
minikube status
```

If it's not running: `minikube start`

### 2. Build the Latest Image

```bash
eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

---

## Part 1: Create the Production Namespace

Apply the namespace manifest:

```bash
kubectl apply -f app/namespace.yaml
```

Verify:

```bash
kubectl get namespace hello-prod
```

Expected output:

```
NAME         STATUS   AGE
hello-prod   Active   5s
```

Check the labels:

```bash
kubectl get namespace hello-prod --show-labels
```

---

## Part 2: Apply Resource Constraints

Apply the ResourceQuota:

```bash
kubectl apply -f app/resourcequota.yaml
```

Apply the LimitRange:

```bash
kubectl apply -f app/limitrange.yaml
```

Verify both:

```bash
kubectl describe resourcequota hello-prod-quota -n hello-prod
kubectl describe limitrange hello-prod-limits -n hello-prod
```

---

## Part 3: Deploy into the Namespace

Deploy hello-app into the `hello-prod` namespace:

```bash
kubectl apply -f app/deployment.yaml -n hello-prod
kubectl apply -f app/clusterip-service.yaml -n hello-prod
kubectl rollout status deployment/hello-app -n hello-prod
```

Verify Pods are running:

```bash
kubectl get pods -n hello-prod
```

Check that the LimitRange injected default resources:

```bash
kubectl get pods -n hello-prod -l app=hello-app -o jsonpath='{.items[0].spec.containers[0].resources}' | python3 -m json.tool
```

Check quota usage:

```bash
kubectl describe resourcequota hello-prod-quota -n hello-prod
```

The "Used" column should now reflect the resources consumed by hello-app Pods.

---

## Part 4: Cluster Maintenance — Cordon, Drain, Uncordon

Practice the full maintenance workflow:

### Cordon the Node

```bash
kubectl cordon minikube
kubectl get nodes
# Should show: Ready,SchedulingDisabled
```

### Drain the Node

```bash
kubectl drain minikube --ignore-daemonsets --delete-emptydir-data
```

### Verify Pods Are Evicted

```bash
kubectl get pods -n hello-prod
# Pods should be Pending (no schedulable node)
```

### Uncordon the Node

```bash
kubectl uncordon minikube
kubectl get nodes
# Should show: Ready (no SchedulingDisabled)
```

### Wait for Pods to Recover

```bash
kubectl rollout status deployment/hello-app -n hello-prod
kubectl get pods -n hello-prod
# All Pods should be Running
```

---

## Part 5: Inspect Everything

Review the full production setup:

```bash
# Namespace
kubectl get namespace hello-prod --show-labels

# ResourceQuota usage
kubectl describe resourcequota hello-prod-quota -n hello-prod

# LimitRange settings
kubectl describe limitrange hello-prod-limits -n hello-prod

# Deployment in hello-prod
kubectl get deployment -n hello-prod

# Pods in hello-prod
kubectl get pods -n hello-prod -o wide

# Node status (should be Ready)
kubectl get nodes
```

---

## Verification

Run the phase verification to check your progress:

```bash
node verify-phase.js 10
```

All checks should pass:

- ✅ Namespace hello-prod exists
- ✅ ResourceQuota hello-prod-quota exists in hello-prod
- ✅ LimitRange hello-prod-limits exists in hello-prod
- ✅ hello-app Deployment exists in hello-prod
- ✅ Node is schedulable (uncordoned)

---

## What You Accomplished

| Task | Status |
|---|---|
| Created the hello-prod namespace | ✅ |
| Applied ResourceQuota | ✅ |
| Applied LimitRange | ✅ |
| Deployed hello-app into hello-prod | ✅ |
| Practiced cordon/drain/uncordon | ✅ |
| Node is schedulable (clean state) | ✅ |
| All verification checks pass | ✅ |

---

## Summary

In this phase, you learned the final pieces of production Kubernetes:

| Mechanism | Purpose |
|---|---|
| **Namespaces** | Isolate workloads by team or environment |
| **ResourceQuotas** | Cap total resource usage per namespace |
| **LimitRanges** | Set default and min/max per-container limits |
| **GitOps** | Declarative, Git-driven deployments |
| **Cordon/Drain** | Graceful node maintenance without downtime |
| **etcd Backup** | Disaster recovery for cluster state |

Together with all previous phases, you now have a comprehensive understanding of Kubernetes from foundations to production operations.

---

🎉 **Phase 10 Complete!** Congratulations — you've completed all phases of Kube-Trainer! You now have a solid foundation in Kubernetes from Docker basics all the way to production operations.

---

**Back to:** [README →](../../README.md)
