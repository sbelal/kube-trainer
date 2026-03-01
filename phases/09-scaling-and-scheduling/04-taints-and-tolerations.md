# Taints & Tolerations

While **node affinity** pulls Pods toward certain nodes, **taints** push Pods away. A taint on a node says "don't schedule here unless you explicitly tolerate me." Together, taints and tolerations give you fine-grained control over which Pods can run where.

---

## How Taints & Tolerations Work

```
Affinity = "I WANT to go to this node"     (Pod pulls toward a node)
Taints   = "STAY AWAY from this node"       (Node pushes Pods away)
Toleration = "I can handle that taint"      (Pod overrides the push)

  ┌──────────┐                  ┌──────────────────────────┐
  │  Pod     │                  │  Node                    │
  │          │── schedule? ──►  │  Taint: env=prod:NoSchedule │
  │  No      │     ❌ BLOCKED   │                          │
  │  toleration│                │                          │
  └──────────┘                  └──────────────────────────┘

  ┌──────────┐                  ┌──────────────────────────┐
  │  Pod     │                  │  Node                    │
  │          │── schedule? ──►  │  Taint: env=prod:NoSchedule │
  │  Has     │     ✅ ALLOWED   │                          │
  │  toleration│                │                          │
  └──────────┘                  └──────────────────────────┘
```

---

## Taint Effects

| Effect | Behavior |
|---|---|
| `NoSchedule` | New Pods without a matching toleration **won't be scheduled**. Existing Pods stay. |
| `PreferNoSchedule` | Scheduler **avoids** the node but will use it if necessary. Soft version of NoSchedule. |
| `NoExecute` | New Pods are blocked **AND** existing Pods without a toleration are **evicted**. |

> ⚠️ **NoExecute is aggressive.** It will evict already-running Pods that don't tolerate the taint. Use it carefully.

---

## Taint Format

A taint has three parts: **key**, **value**, and **effect**:

```
key=value:effect

Examples:
  env=prod:NoSchedule
  dedicated=gpu:NoExecute
  maintenance=true:NoSchedule
```

---

## Prerequisites

Make sure your cluster is running:

```bash
minikube status
```

If it's not running: `minikube start`

Ensure the hello-app Deployment is running:

```bash
kubectl apply -f app/deployment-with-resources.yaml
kubectl rollout status deployment/hello-app
```

---

## Step 1: View Existing Taints

Check if any taints are currently on your node:

```bash
kubectl describe node minikube | grep -A 5 Taints
```

On a fresh minikube cluster, you should see:

```
Taints:             <none>
```

---

## Step 2: Add a Taint

Taint the minikube node:

```bash
kubectl taint nodes minikube env=staging:NoSchedule
```

Verify:

```bash
kubectl describe node minikube | grep -A 5 Taints
```

Output:

```
Taints:             env=staging:NoSchedule
```

---

## Step 3: See the Effect

Try to create a new Pod **without** a toleration:

```bash
kubectl run taint-test --image=kube-trainer-app:latest --restart=Never --image-pull-policy=Never
```

Check its status:

```bash
kubectl get pod taint-test
```

The Pod should be stuck in `Pending`:

```
NAME         READY   STATUS    RESTARTS   AGE
taint-test   0/1     Pending   0          10s
```

Check why:

```bash
kubectl describe pod taint-test | grep -A 3 "Events"
```

You'll see:
```
Warning  FailedScheduling  ... 1 node(s) had untolerated taint {env: staging}
```

> 💡 **Notice:** The already-running hello-app Pods are NOT affected because NoSchedule only prevents **new** scheduling. Existing Pods stay.

---

## Step 4: Add a Toleration

Delete the failed Pod and create one with a toleration:

```bash
kubectl delete pod taint-test

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: taint-tolerant
spec:
  tolerations:
  - key: "env"
    operator: "Equal"
    value: "staging"
    effect: "NoSchedule"
  containers:
  - name: hello
    image: kube-trainer-app:latest
    imagePullPolicy: Never
EOF
```

Check it:

```bash
kubectl get pod taint-tolerant
```

This Pod should be `Running` — it tolerates the taint.

---

## Step 5: Try NoExecute (Observe Eviction)

Remove the previous taint first:

```bash
kubectl taint nodes minikube env=staging:NoSchedule-
```

(The trailing `-` removes the taint.)

Now apply a `NoExecute` taint:

```bash
kubectl taint nodes minikube maintenance=true:NoExecute
```

Watch what happens to your Pods:

```bash
kubectl get pods -w
```

Pods without a toleration for this taint will be **evicted** and rescheduled. Since minikube is a single-node cluster, the Pods will go to `Pending` (nowhere to go).

> ⚠️ **Don't leave this taint on!** Remove it immediately:

```bash
kubectl taint nodes minikube maintenance=true:NoExecute-
```

Wait for Pods to recover:

```bash
kubectl get pods -w
```

Press `Ctrl+C` once they're all Running again.

---

## Step 6: Clean Up Test Pods

```bash
kubectl delete pod taint-tolerant --ignore-not-found
```

Verify no taints remain:

```bash
kubectl describe node minikube | grep -A 5 Taints
```

Should show `<none>`.

---

## Toleration Operators

| Operator | Behavior |
|---|---|
| `Equal` | Key, value, and effect must all match the taint |
| `Exists` | Key and effect must match; value is ignored (matches any value) |

A toleration with an empty key and `Exists` operator matches **all taints**:

```yaml
tolerations:
- operator: "Exists"    # Tolerates everything
```

---

## Real-World Use Cases

| Scenario | Taint | Which Pods Tolerate |
|---|---|---|
| Dedicated GPU nodes | `gpu=true:NoSchedule` | Only ML training Pods |
| Maintenance mode | `maintenance=true:NoExecute` | No Pods (drain the node) |
| Spot/preemptible nodes | `cloud.google.com/gke-spot=true:NoSchedule` | Cost-tolerant batch jobs |
| Master/control-plane nodes | `node-role.kubernetes.io/control-plane:NoSchedule` | Only system Pods |

---

## What You Learned

| Concept | What you did |
|---|---|
| **Taints** | Applied `NoSchedule` and `NoExecute` taints to a node |
| **Tolerations** | Created a Pod that tolerates a taint |
| **NoSchedule** | Blocks new Pods but doesn't evict existing ones |
| **NoExecute** | Blocks new Pods AND evicts existing ones |
| **Removing taints** | Used the `-` suffix to remove taints |
| **FailedScheduling** | Saw Pods stuck in Pending due to untolerated taints |

---

**Next up:** [Hands-On Exercise →](./05-hands-on-exercise.md)
