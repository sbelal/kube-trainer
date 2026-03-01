# Node Affinity

Node affinity lets you control **which nodes** your Pods are scheduled on. It's like telling the scheduler "put this Pod on a node with these properties" — useful for hardware requirements, data locality, or organizational policies.

---

## nodeSelector vs nodeAffinity

Kubernetes offers two ways to influence node selection:

| Mechanism | Power | Syntax |
|---|---|---|
| `nodeSelector` | Simple — hard requirement only | Key-value label match |
| `nodeAffinity` | Advanced — required or preferred, with operators | Expressive rules with `In`, `NotIn`, `Exists`, etc. |

```
nodeSelector (simple):                nodeAffinity (advanced):

  "Put me on a node                     "I REQUIRE a node with
   with label team=hello"                label team=hello, and
                                         I PREFER a node with
                                         label disk=ssd"

  ┌────────┐                            ┌────────┐
  │  Pod   │──► Only nodes with         │  Pod   │──► Must have team=hello
  │        │    team=hello              │        │──► Prefer disk=ssd
  └────────┘                            └────────┘
```

---

## Affinity Types

| Type | Behavior |
|---|---|
| `requiredDuringSchedulingIgnoredDuringExecution` | **Hard requirement** — Pod won't be scheduled if no matching node exists. Stays if label is removed after scheduling. |
| `preferredDuringSchedulingIgnoredDuringExecution` | **Soft preference** — scheduler tries to match but will schedule elsewhere if no match. Weight (1–100) sets priority. |

> 💡 **"IgnoredDuringExecution"** means: if a node's labels change after a Pod is already running on it, the Pod **stays** — it won't be evicted. A future `RequiredDuringExecution` mode would evict Pods, but it doesn't exist yet.

---

## Prerequisites

Make sure your cluster is running:

```bash
minikube status
```

If it's not running: `minikube start`

---

## Step 1: View Current Node Labels

Every node already has built-in labels:

```bash
kubectl get nodes --show-labels
```

Some common default labels:

| Label | Example Value |
|---|---|
| `kubernetes.io/hostname` | `minikube` |
| `kubernetes.io/os` | `linux` |
| `kubernetes.io/arch` | `amd64` |
| `node.kubernetes.io/instance-type` | (cloud provider sets this) |

---

## Step 2: Add a Custom Label

Label your minikube node with a custom label:

```bash
kubectl label nodes minikube team=hello
```

Verify the label:

```bash
kubectl get nodes --show-labels | grep team
```

You should see `team=hello` in the label list.

---

## Step 3: Use nodeSelector (Simple)

The simplest way to constrain scheduling. Create a test Pod with `nodeSelector`:

```bash
kubectl run affinity-test --image=kube-trainer-app:latest \
  --overrides='{
    "spec": {
      "nodeSelector": {"team": "hello"},
      "containers": [{"name": "affinity-test", "image": "kube-trainer-app:latest", "imagePullPolicy": "Never"}]
    }
  }' --restart=Never
```

Check that it was scheduled:

```bash
kubectl get pod affinity-test -o wide
```

The NODE column should show `minikube`. Clean up:

```bash
kubectl delete pod affinity-test
```

---

## Step 4: Use nodeAffinity (Required)

For more expressive rules, use `nodeAffinity`. Create a test Pod with a **required** affinity rule:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: affinity-required
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

Verify it's running on the correct node:

```bash
kubectl get pod affinity-required -o wide
```

---

## Step 5: Use nodeAffinity (Preferred)

Create a Pod with a **preferred** rule — it will try to match but won't fail if it can't:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: affinity-preferred
spec:
  affinity:
    nodeAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 80
        preference:
          matchExpressions:
          - key: disk
            operator: In
            values:
            - ssd
  containers:
  - name: hello
    image: kube-trainer-app:latest
    imagePullPolicy: Never
EOF
```

Since no node has `disk=ssd`, the Pod will still be scheduled (it's just a preference):

```bash
kubectl get pod affinity-preferred -o wide
```

---

## Step 6: See a Failed Schedule (Required + No Match)

Create a Pod requiring a label that doesn't exist:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: affinity-nomatch
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: team
            operator: In
            values:
            - does-not-exist
  containers:
  - name: hello
    image: kube-trainer-app:latest
    imagePullPolicy: Never
EOF
```

Check its status:

```bash
kubectl get pod affinity-nomatch
```

It should be stuck in `Pending`. Check why:

```bash
kubectl describe pod affinity-nomatch | grep -A 5 "Events"
```

You'll see an event like:
```
Warning  FailedScheduling  ... node(s) didn't match Pod's node affinity/selector
```

Clean up all test Pods:

```bash
kubectl delete pod affinity-required affinity-preferred affinity-nomatch --ignore-not-found
```

---

## Affinity Operators

| Operator | Meaning |
|---|---|
| `In` | Value must be in the list |
| `NotIn` | Value must NOT be in the list |
| `Exists` | Label key must exist (value doesn't matter) |
| `DoesNotExist` | Label key must NOT exist |
| `Gt` | Value must be greater than (numeric) |
| `Lt` | Value must be less than (numeric) |

---

## Real-World Use Cases

| Scenario | Affinity Rule |
|---|---|
| GPU workloads | Required: `gpu=true` |
| SSD-optimized databases | Preferred: `disk=ssd` |
| Region compliance | Required: `topology.kubernetes.io/zone=us-east-1a` |
| Team isolation | Required: `team=backend` |
| Cost optimization | Preferred: `node-type=spot` (but OK on on-demand) |

---

## What You Learned

| Concept | What you did |
|---|---|
| **Node labels** | Added `team=hello` to the minikube node |
| **nodeSelector** | Simple hard constraint for Pod scheduling |
| **Required affinity** | Pod must match — Pending if no match |
| **Preferred affinity** | Pod prefers a match but schedules anyway |
| **Operators** | `In`, `NotIn`, `Exists`, etc. for flexible matching |
| **Failed scheduling** | Saw a Pod stuck in Pending with no matching node |

---

**Next up:** [Taints & Tolerations →](./04-taints-and-tolerations.md)
