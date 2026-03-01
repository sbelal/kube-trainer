# Hands-On Exercise: Advanced Workloads

Time to put everything together! In this exercise, you'll create and verify all four advanced workload types: Jobs, CronJobs, DaemonSets, and StatefulSets.

---

## Objectives

By the end of this exercise, you should have:

- ✅ Created and run a Job to completion
- ✅ Created a CronJob that runs on a schedule
- ✅ Deployed a DaemonSet running on every node
- ✅ Deployed a StatefulSet with a headless Service and persistent storage

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

## Part 1: Create a Job

Apply the Job manifest:

```bash
kubectl apply -f app/job.yaml
```

Watch the Job complete:

```bash
kubectl get jobs hello-app-job -w
```

Wait until `COMPLETIONS` shows `1/1`, then press `Ctrl+C`.

View the Job's output:

```bash
kubectl logs job/hello-app-job
```

Verify it completed:

```bash
kubectl get job hello-app-job -o jsonpath='{.status.succeeded}'
```

Should output `1`.

---

## Part 2: Create a CronJob

Apply the CronJob manifest:

```bash
kubectl apply -f app/cronjob.yaml
```

Verify the CronJob exists:

```bash
kubectl get cronjobs
```

You should see `hello-app-cronjob` with schedule `*/1 * * * *`.

Wait ~1 minute for the first run, then check:

```bash
kubectl get jobs -l app=hello-app-cronjob
```

You should see at least one completed Job.

---

## Part 3: Deploy a DaemonSet

Apply the DaemonSet manifest:

```bash
kubectl apply -f app/daemonset.yaml
```

Verify it's running on all nodes:

```bash
kubectl get daemonset hello-app-daemon
```

The `DESIRED` and `READY` columns should match.

Check the Pod:

```bash
kubectl get pods -l app=hello-app-daemon -o wide
```

---

## Part 4: Deploy a StatefulSet

Apply the StatefulSet manifest (includes the headless Service):

```bash
kubectl apply -f app/statefulset.yaml
```

Watch Pods start in order:

```bash
kubectl get pods -l app=hello-app-stateful -w
```

Wait until both `hello-app-stateful-0` and `hello-app-stateful-1` are `1/1 Running`, then press `Ctrl+C`.

Verify the headless Service:

```bash
kubectl get svc hello-app-headless
```

The `CLUSTER-IP` should show `None`.

Verify dedicated PVCs:

```bash
kubectl get pvc -l app=hello-app-stateful
```

You should see two separate PVCs, one for each Pod.

---

## Verification

Run the phase verification to check your progress:

```bash
node verify-phase.js 6
```

All checks should pass:

- ✅ Job hello-app-job completed successfully
- ✅ CronJob hello-app-cronjob exists
- ✅ DaemonSet hello-app-daemon has desired pods scheduled
- ✅ StatefulSet hello-app-stateful has ready replicas
- ✅ Headless Service hello-app-headless exists

---

## What You Accomplished

| Task | Status |
|---|---|
| Created a run-to-completion Job | ✅ |
| Created a scheduled CronJob | ✅ |
| Deployed a DaemonSet on every node | ✅ |
| Deployed a StatefulSet with persistent storage | ✅ |
| Verified headless Service for StatefulSet | ✅ |

---

## Summary

In this phase, you learned the advanced Kubernetes workload types:

| Workload | Purpose | Key Feature |
|---|---|---|
| **Job** | One-off batch tasks | Runs to completion, then stops |
| **CronJob** | Scheduled recurring tasks | Cron-based timing |
| **DaemonSet** | Node-level agents | One Pod per node |
| **StatefulSet** | Stateful applications | Stable names, ordered operations, dedicated storage |

These workloads, combined with Deployments from Phase 2, cover the vast majority of Kubernetes use cases you'll encounter.

---

🎉 **Phase 6 Complete!** You now understand all the core Kubernetes workload types. Next up is Phase 7: RBAC & Security (ServiceAccounts, Roles, NetworkPolicies).
