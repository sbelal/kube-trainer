# Jobs

A **Job** creates one or more Pods and ensures they run to **completion**. Unlike Deployments (which keep Pods running forever), Jobs are for **one-off or batch tasks** — things like database migrations, report generation, or data processing.

---

## Jobs vs Deployments

```
┌───────────────────────────────────────────────────────┐
│                    Deployment                         │
│                                                       │
│   Pod crashes → restart it    (run forever)           │
│   Pod completes → restart it  (keep running)          │
│                                                       │
├───────────────────────────────────────────────────────┤
│                      Job                              │
│                                                       │
│   Pod crashes → retry it      (up to backoffLimit)    │
│   Pod completes → done ✅     (don't restart)        │
│                                                       │
└───────────────────────────────────────────────────────┘
```

| Feature | Deployment | Job |
|---|---|---|
| **Purpose** | Long-running services | Run-to-completion tasks |
| **restartPolicy** | `Always` | `Never` or `OnFailure` |
| **Completed Pods** | Restarted | Left in `Completed` state |
| **Use cases** | Web servers, APIs | Migrations, batch processing |

---

## Prerequisites

Make sure your cluster is running and image is built:

```bash
minikube status

# Build the image inside minikube
eval $(minikube docker-env)
cd app/
docker build -t kube-trainer-app:latest .
cd ..
```

---

## Step 1: Understand the Job Manifest

Let's look at a simple Job. Create the file `app/job.yaml`:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: hello-app-job
spec:
  backoffLimit: 3
  ttlSecondsAfterFinished: 120
  template:
    metadata:
      labels:
        app: hello-app-job
    spec:
      restartPolicy: Never
      containers:
      - name: hello-job
        image: busybox:1.36
        command: ["sh", "-c"]
        args:
        - |
          echo "=== Job started at $(date) ==="
          echo "Running on host: $(hostname)"
          echo "Performing batch task..."
          sleep 5
          echo "=== Job completed successfully ==="
```

Key fields:

| Field | What it does |
|---|---|
| `backoffLimit: 3` | Retry up to 3 times if the Pod fails |
| `ttlSecondsAfterFinished: 120` | Auto-delete the Job 120 seconds after completion |
| `restartPolicy: Never` | Don't restart the Pod — let the Job controller handle retries |

> 💡 **Why `restartPolicy: Never`?** Jobs need to know when a Pod fails so they can track retry attempts. If set to `Always`, the kubelet would restart the container before the Job controller can count the failure.

---

## Step 2: Create the Job

```bash
kubectl apply -f app/job.yaml
```

Watch the Job progress:

```bash
kubectl get jobs -w
```

You should see:

```
NAME            COMPLETIONS   DURATION   AGE
hello-app-job   0/1           3s         3s
hello-app-job   1/1           8s         8s
```

Press `Ctrl+C` to stop watching.

---

## Step 3: Inspect the Job

Check the Job status:

```bash
kubectl describe job hello-app-job
```

Look for the `Pods Statuses` and `Events` sections:

```
Pods Statuses:    0 Active / 1 Succeeded / 0 Failed
...
Events:
  Type    Reason            Age   From            Message
  ----    ------            ----  ----            -------
  Normal  SuccessfulCreate  30s   job-controller  Created pod: hello-app-job-xxxxx
  Normal  Completed         22s   job-controller  Job completed
```

View the Pod's logs:

```bash
kubectl logs job/hello-app-job
```

Output:

```
=== Job started at Sun Jan 15 10:30:00 UTC 2025 ===
Running on host: hello-app-job-xxxxx
Performing batch task...
=== Job completed successfully ===
```

---

## Step 4: Parallel and Multi-Completion Jobs

Jobs support running **multiple Pods** for parallel processing:

```yaml
spec:
  completions: 3    # Total Pods that must succeed
  parallelism: 2    # Run 2 Pods at a time
```

```
Timeline:
  ├── Pod 1 starts ──► completes ✅
  ├── Pod 2 starts ──► completes ✅
  └── Pod 3 starts ──────────────► completes ✅
       (waits for a slot)
```

| Field | Default | Purpose |
|---|---|---|
| `completions` | 1 | How many Pods must succeed |
| `parallelism` | 1 | Max Pods running at the same time |

> 💡 **When to use parallel Jobs:** Processing a queue of work items, running tests in parallel, or batch data processing where each Pod handles a chunk.

---

## Step 5: Clean Up

The Job will auto-delete after `ttlSecondsAfterFinished` (120 seconds). To delete it immediately:

```bash
kubectl delete job hello-app-job
```

---

## Useful kubectl Commands for Jobs

| Command | Purpose |
|---|---|
| `kubectl get jobs` | List all Jobs |
| `kubectl describe job <name>` | Detailed Job info |
| `kubectl logs job/<name>` | View Job Pod logs |
| `kubectl delete job <name>` | Delete a Job and its Pods |
| `kubectl get pods -l job-name=<name>` | Find Pods created by a Job |

---

## What You Learned

| Concept | What you did |
|---|---|
| **Jobs** | Run-to-completion workloads that exit when done |
| **backoffLimit** | Maximum retries before marking the Job as failed |
| **ttlSecondsAfterFinished** | Auto-cleanup after completion |
| **completions & parallelism** | Run multiple Pods, optionally in parallel |
| **restartPolicy** | Must be `Never` or `OnFailure` for Jobs |

---

**Next up:** [CronJobs →](./02-cronjobs.md)
