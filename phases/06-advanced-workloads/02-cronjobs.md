# CronJobs

A **CronJob** runs a Job on a **recurring schedule** — just like cron on Linux. Use it for tasks that need to happen periodically: backups, report generation, cache cleanup, health checks, etc.

---

## How CronJobs Work

```
┌──────────────────────────────────────────────────────────┐
│                      CronJob                              │
│              schedule: "*/1 * * * *"                       │
│                                                            │
│   :00 ──► creates Job 1 ──► Pod runs ──► completes ✅     │
│   :01 ──► creates Job 2 ──► Pod runs ──► completes ✅     │
│   :02 ──► creates Job 3 ──► Pod runs ──► completes ✅     │
│   ...                                                      │
└──────────────────────────────────────────────────────────┘
```

A CronJob is essentially a **Job template** + a **cron schedule**. At each scheduled time, the CronJob controller creates a new Job, which in turn creates a Pod.

---

## Cron Schedule Syntax

```
┌───────── minute (0–59)
│ ┌─────── hour (0–23)
│ │ ┌───── day of month (1–31)
│ │ │ ┌─── month (1–12)
│ │ │ │ ┌─ day of week (0–6, Sun=0)
│ │ │ │ │
* * * * *
```

| Schedule | Meaning |
|---|---|
| `*/1 * * * *` | Every minute |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Every day at midnight |
| `0 0 * * 0` | Every Sunday at midnight |
| `30 2 1 * *` | 2:30 AM on the 1st of every month |

---

## Prerequisites

Make sure your cluster is running:

```bash
minikube status
```

---

## Step 1: Understand the CronJob Manifest

Create the file `app/cronjob.yaml`:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: hello-app-cronjob
spec:
  schedule: "*/1 * * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        metadata:
          labels:
            app: hello-app-cronjob
        spec:
          restartPolicy: Never
          containers:
          - name: hello-cron
            image: busybox:1.36
            command: ["sh", "-c"]
            args:
            - |
              echo "=== CronJob run at $(date) ==="
              echo "Hostname: $(hostname)"
              echo "Performing scheduled task..."
              sleep 3
              echo "=== Scheduled task completed ==="
```

Key fields:

| Field | Value | Purpose |
|---|---|---|
| `schedule` | `"*/1 * * * *"` | Run every minute |
| `concurrencyPolicy` | `Forbid` | Don't start a new Job if the previous one is still running |
| `successfulJobsHistoryLimit` | `3` | Keep the last 3 successful Jobs visible |
| `failedJobsHistoryLimit` | `1` | Keep the last 1 failed Job visible |

---

## Step 2: Create the CronJob

```bash
kubectl apply -f app/cronjob.yaml
```

Check the CronJob:

```bash
kubectl get cronjobs
```

Output:

```
NAME                SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
hello-app-cronjob   */1 * * * *   False     0        <none>          10s
```

---

## Step 3: Watch It Run

Wait about a minute, then check for Jobs created by the CronJob:

```bash
kubectl get jobs -l app=hello-app-cronjob --watch
```

After a minute or two, you'll see Jobs appear:

```
NAME                           COMPLETIONS   DURATION   AGE
hello-app-cronjob-1705312860   1/1           5s         60s
hello-app-cronjob-1705312920   0/1           3s         3s
```

Press `Ctrl+C` to stop watching.

Check the Pod logs from the most recent run:

```bash
# List Pods from CronJob
kubectl get pods -l app=hello-app-cronjob --sort-by=.metadata.creationTimestamp

# View logs from the latest
kubectl logs -l app=hello-app-cronjob --tail=10
```

---

## Step 4: Understand Concurrency Policies

| Policy | Behavior |
|---|---|
| `Allow` (default) | Multiple Jobs can run at the same time |
| `Forbid` | Skip the new run if the previous Job is still active |
| `Replace` | Cancel the running Job and start a new one |

> 💡 **Best practice:** Use `Forbid` for tasks that shouldn't overlap (e.g., database backups). Use `Allow` only when runs are independent and safe to overlap.

---

## Step 5: Suspend a CronJob

You can pause a CronJob without deleting it:

```bash
# Suspend
kubectl patch cronjob hello-app-cronjob -p '{"spec":{"suspend":true}}'

# Verify
kubectl get cronjob hello-app-cronjob
```

The `SUSPEND` column will show `True`. To resume:

```bash
kubectl patch cronjob hello-app-cronjob -p '{"spec":{"suspend":false}}'
```

---

## Useful kubectl Commands for CronJobs

| Command | Purpose |
|---|---|
| `kubectl get cronjobs` | List all CronJobs |
| `kubectl describe cronjob <name>` | Detailed CronJob info |
| `kubectl get jobs -l app=<label>` | See Jobs created by a CronJob |
| `kubectl delete cronjob <name>` | Delete CronJob and all its Jobs |
| `kubectl create job --from=cronjob/<name> manual-run` | Trigger a CronJob manually |

---

## What You Learned

| Concept | What you did |
|---|---|
| **CronJobs** | Scheduled, recurring Jobs based on cron syntax |
| **schedule** | Standard cron expression for timing |
| **concurrencyPolicy** | Control overlap behavior (Allow, Forbid, Replace) |
| **History limits** | Keep a bounded number of past Jobs |
| **Suspend** | Pause/resume a CronJob without deletion |

---

**Next up:** [DaemonSets →](./03-daemonsets.md)
