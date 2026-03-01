# Security Best Practices

You've learned how to control **API access** (RBAC) and **network access** (NetworkPolicies). Now let's look at how to secure the containers themselves using **SecurityContext** and the principle of least privilege.

---

## The Security Layers

Kubernetes security works in layers — each one reduces the blast radius if something goes wrong:

```
┌──────────────────────────────────────────────────────────┐
│ Layer 1: RBAC                                            │
│   → What can this identity DO in the API?                │
│                                                          │
│ Layer 2: NetworkPolicies                                 │
│   → What can this Pod TALK TO on the network?            │
│                                                          │
│ Layer 3: SecurityContext                                 │
│   → How does this container RUN on the node?             │
│     (user, filesystem, capabilities, privilege)          │
│                                                          │
│ Layer 4: Pod Security Standards                          │
│   → What security standards does the namespace ENFORCE?  │
└──────────────────────────────────────────────────────────┘
```

In this lesson, we'll focus on **Layer 3: SecurityContext**.

---

## SecurityContext

A `securityContext` can be set at the **Pod level** or **container level** in your manifest. It controls how the container process runs.

### Key Settings

| Setting | Purpose | Recommended |
|---|---|---|
| `runAsNonRoot: true` | Prevents the container from running as root | ✅ Always |
| `runAsUser: 1000` | Runs the process as a specific user ID | ✅ Preferred |
| `readOnlyRootFilesystem: true` | Makes the root filesystem read-only | ✅ When possible |
| `allowPrivilegeEscalation: false` | Prevents gaining more privileges than the parent process | ✅ Always |
| `capabilities.drop: ["ALL"]` | Drops all Linux capabilities | ✅ Always |
| `capabilities.add: [...]` | Adds back only needed capabilities | Only if needed |

---

## Step 1: Inspect Current Security Settings

Check what your current Pods are running as:

```bash
POD_NAME=$(kubectl get pods -l app=hello-app -o jsonpath='{.items[0].metadata.name}')

# Check the user ID
kubectl exec $POD_NAME -- id
```

If no `securityContext` is set, the container likely runs as **root** (UID 0) — this is a security risk.

Check if the filesystem is writable:

```bash
# Try writing to the root filesystem
kubectl exec $POD_NAME -- sh -c 'echo test > /tmp/test.txt && echo "writable" || echo "read-only"'
```

---

## Step 2: Understand a Secure Pod Spec

Here's what a properly secured Pod spec looks like:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  # Pod-level security context
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000

  containers:
    - name: app
      image: kube-trainer-app:latest
      ports:
        - containerPort: 3000

      # Container-level security context
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
```

Let's break down each setting:

### `runAsNonRoot: true`

Kubernetes **rejects** the Pod if the container image tries to run as root (UID 0):

```bash
# This would fail if the image's USER is root
kubectl run test --image=nginx --overrides='{"spec":{"securityContext":{"runAsNonRoot":true}}}' --restart=Never
```

### `readOnlyRootFilesystem: true`

The container's root filesystem becomes read-only. The app can only write to explicitly mounted volumes:

```yaml
securityContext:
  readOnlyRootFilesystem: true
# To allow writes, mount a volume:
volumeMounts:
  - name: tmp
    mountPath: /tmp
volumes:
  - name: tmp
    emptyDir: {}
```

### `allowPrivilegeEscalation: false`

Prevents a process from gaining more privileges than its parent. Blocks `setuid` binaries and other escalation techniques.

### `capabilities.drop: ["ALL"]`

Linux capabilities are fine-grained root permissions. Dropping all of them significantly reduces what a compromised container can do:

| Capability | What it allows |
|---|---|
| `NET_ADMIN` | Modify network configuration |
| `SYS_ADMIN` | Wide range of system operations |
| `NET_RAW` | Use raw sockets (network sniffing) |
| `SYS_PTRACE` | Trace/debug other processes |

> 💡 **Best practice:** Drop **ALL** capabilities, then add back only the specific ones your app needs. Most Node.js apps need **none**.

---

## Step 3: Check Pod Security with kubectl

You can inspect the security context of running Pods:

```bash
# View the security context
kubectl get pod -l app=hello-app -o jsonpath='{.items[0].spec.containers[0].securityContext}' | python3 -m json.tool
```

---

## Pod Security Standards

Kubernetes 1.25+ includes **Pod Security Admission** — a built-in controller that enforces security standards at the namespace level.

There are three levels:

| Level | Description | Typical Use |
|---|---|---|
| **Privileged** | No restrictions | System-level workloads (CNI, storage drivers) |
| **Baseline** | Blocks known privilege escalations | General workloads |
| **Restricted** | Heavily restricted, follows best practices | Security-sensitive workloads |

You can enforce them by labeling a namespace:

```bash
# Warn on violations of the restricted standard
kubectl label namespace default pod-security.kubernetes.io/warn=restricted

# Enforce the baseline standard (reject violating Pods)
kubectl label namespace default pod-security.kubernetes.io/enforce=baseline
```

> 💡 **For learning:** Start with `warn` mode to see what would be blocked, then move to `enforce` when you're confident your workloads comply. We won't enforce these in this training to avoid blocking other phases.

---

## The Principle of Least Privilege — Summary

| Area | Least Privilege Approach |
|---|---|
| **RBAC** | Create dedicated ServiceAccounts; grant only needed verbs on needed resources |
| **NetworkPolicies** | Default deny; explicitly allow only needed communication paths |
| **SecurityContext** | Run as non-root; read-only filesystem; drop all capabilities |
| **Images** | Use minimal base images (distroless, Alpine); scan for vulnerabilities |
| **Secrets** | Never hardcode; use K8s Secrets or external secret managers |
| **Namespaces** | Separate workloads by team/environment; apply PSA labels |

---

## What You Learned

| Concept | What you did |
|---|---|
| **SecurityContext** | Understood runAsNonRoot, readOnlyRootFilesystem, capabilities |
| **Privilege escalation** | Learned why `allowPrivilegeEscalation: false` matters |
| **Linux capabilities** | Understood dropping ALL and adding back only what's needed |
| **Pod Security Standards** | Learned about Privileged, Baseline, and Restricted levels |
| **Least privilege** | Reviewed the comprehensive security checklist |

---

**Next up:** [Hands-On Exercise: RBAC & Security →](./05-hands-on-exercise.md)
