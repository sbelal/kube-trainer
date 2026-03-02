# Hands-On Exercise: Scaling & Scheduling

Time to put everything together! In this exercise, you'll configure resource limits, set up autoscaling, and control Pod placement with affinity and taints.

---

## Objectives

By the end of this exercise, you should have:

- ✅ Deployed with resource requests and limits
- ✅ Created an HPA for automatic scaling
- ✅ Labeled a node and verified scheduling with affinity
- ✅ Applied and removed taints
- ✅ Verified all checks pass

---

## Setup

### 1. Ensure Your Cluster Is Running

```bash
minikube status
```

If it's not running: `minikube start`

### 2. Enable Metrics Server

```bash
minikube addons enable metrics-server
```

### 3. Build the Latest Image

```bash
eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

---

## Part 1: Resource Requests & Limits

Deploy the app with resource constraints:

```bash
kubectl apply -f app/deployment-with-resources.yaml
kubectl rollout status deployment/hello-app
```

Verify resources are set:

```bash
kubectl get pods -l app=hello-app -o jsonpath='{.items[0].spec.containers[0].resources.requests.cpu}'
# Should output: 50m
```

Check the QoS class:

```bash
kubectl get pods -l app=hello-app -o jsonpath='{.items[0].status.qosClass}'
# Should output: Burstable
```

---

## Part 2: Horizontal Pod Autoscaler

Apply the ClusterIP service (needed for load testing):

```bash
kubectl apply -f app/clusterip-service.yaml
```

Apply the HPA:

```bash
kubectl apply -f app/hpa.yaml
```

Verify HPA exists and targets the Deployment:

```bash
kubectl get hpa hello-app-hpa
```

Expected output:

```
NAME            REFERENCE              TARGETS         MINPODS   MAXPODS   REPLICAS   AGE
hello-app-hpa   Deployment/hello-app   <unknown>/50%   2         10        3          10s
```

> 💡 The `<unknown>` target will resolve to an actual percentage once the metrics-server starts reporting (1–2 minutes).

Describe the HPA to confirm it targets the right Deployment:

```bash
kubectl describe hpa hello-app-hpa | grep "reference"
```

---

## Part 3: Node Affinity

Label the minikube node:

```bash
kubectl label nodes minikube team=hello --overwrite
```

Verify the label:

```bash
kubectl get nodes minikube --show-labels | grep team=hello
```

Test scheduling with the label:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: affinity-check
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: team
            operator: In
            values:
            - hello
  containers:
  - name: hello
    image: kube-trainer-app:latest
    imagePullPolicy: Never
EOF
```

Wait for it to be scheduled:

```bash
kubectl wait --for=condition=Ready pod/affinity-check --timeout=30s
kubectl get pod affinity-check -o wide
```

Clean up:

```bash
kubectl delete pod affinity-check
```

---

## Part 4: Taints & Tolerations

Apply a taint and verify it:

```bash
kubectl taint nodes minikube exercise=true:NoSchedule
```

Try to create a Pod without a toleration:

```bash
kubectl run no-toleration --image=kube-trainer-app:latest --restart=Never --image-pull-policy=Never
```

Verify it's Pending:

```bash
kubectl get pod no-toleration
# Status should be Pending
```

Clean up and remove the taint:

```bash
kubectl delete pod no-toleration
kubectl taint nodes minikube exercise=true:NoSchedule-
```

Verify taint is removed:

```bash
kubectl describe node minikube | grep Taints
# Should show: Taints:  <none>
```

---

## Part 5: Inspect Everything

Review the full scaling and scheduling setup:

```bash
# Resource limits on the Deployment
kubectl describe deployment hello-app | grep -A 6 "Limits\|Requests"

# HPA status
kubectl describe hpa hello-app-hpa

# Node labels
kubectl get nodes --show-labels

# Node taints
kubectl describe node minikube | grep Taints
```

---

## Verification

Run the phase verification to check your progress:

```bash
node verify-phase.js 9
```

All checks should pass:

- ✅ Deployment has resource requests configured
- ✅ HPA hello-app-hpa exists
- ✅ HPA targets the hello-app Deployment
- ✅ Node has the team=hello label
- ✅ Node is untainted (clean state)

---

## What You Accomplished

| Task | Status |
|---|---|
| Deployed with resource requests & limits | ✅ |
| Created HPA for auto-scaling | ✅ |
| Labeled node for affinity scheduling | ✅ |
| Tested taints and tolerations | ✅ |
| Cleaned up taints | ✅ |
| All verification checks pass | ✅ |

---

## Summary

In this phase, you learned how Kubernetes manages scaling and scheduling:

| Mechanism | Purpose |
|---|---|
| **Resource Requests** | Minimum resources guaranteed — drives scheduling |
| **Resource Limits** | Maximum resources allowed — prevents runaway usage |
| **HPA** | Automatic scaling based on metrics (CPU, memory) |
| **Node Affinity** | Pull Pods toward specific nodes |
| **Taints** | Push Pods away from specific nodes |
| **Tolerations** | Override taints — allow Pods onto tainted nodes |

Together, these give you precise control over **how many** Pods run and **where** they run — essential for production Kubernetes.

---

🎉 **Phase 9 Complete!** You now understand Kubernetes scaling and scheduling fundamentals.

---

**Next up:** [Phase 10: Production & CI/CD →](../10-production-and-cicd/01-namespaces.md)
