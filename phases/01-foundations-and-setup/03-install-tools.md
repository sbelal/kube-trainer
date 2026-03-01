# Installing Your Kubernetes Tools

In this lesson you'll install the two essential tools for local Kubernetes development:

1. **kubectl** — the CLI for interacting with any Kubernetes cluster
2. **minikube** — a tool that runs a local Kubernetes cluster on your machine

All commands should be run in your **WSL2 Ubuntu terminal**.

---

## Prerequisites

Before we begin, make sure you have:

- **WSL2 with Ubuntu** installed and working
- **Docker** installed inside WSL2 (you should be able to run `docker --version`)

> ⚠️ **Docker must be running inside WSL2**, not Docker Desktop on Windows. If you've installed Docker Desktop previously, you'll need to ensure the Docker daemon is accessible from your WSL2 Ubuntu terminal. The simplest approach is to install Docker Engine directly in WSL2.

### Verify Docker is Working

```bash
docker --version
# Expected: Docker version 2X.x.x or similar

docker run hello-world
# Expected: "Hello from Docker!" message
```

If Docker isn't installed in WSL2, follow the [official Docker Engine install for Ubuntu](https://docs.docker.com/engine/install/ubuntu/).

---

## Installing kubectl

**kubectl** (pronounced "kube-control" or "kube-cuddle") is the command-line tool for communicating with Kubernetes clusters. Every interaction with Kubernetes goes through kubectl.

### Step 1: Download the Latest Release

```bash
# Download the latest stable kubectl binary
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
```

### Step 2: Install It

```bash
# Make it executable
chmod +x kubectl

# Move it to a directory in your PATH
sudo mv kubectl /usr/local/bin/

# Verify
kubectl version --client
```

You should see output showing the client version. Don't worry about "connection refused" errors — that just means there's no cluster running yet.

### Step 3: Enable Shell Autocompletion (Optional but Recommended)

Autocompletion makes kubectl much faster to use:

```bash
# Install bash-completion if not already installed
sudo apt-get install -y bash-completion

# Enable kubectl autocompletion
echo 'source <(kubectl completion bash)' >> ~/.bashrc

# Add a shortcut alias (optional)
echo 'alias k=kubectl' >> ~/.bashrc
echo 'complete -o default -F __start_kubectl k' >> ~/.bashrc

# Reload your shell
source ~/.bashrc
```

Now you can type `kubectl get po<TAB>` and it will autocomplete to `kubectl get pods`.

---

## Installing minikube

**minikube** lets you run a Kubernetes cluster locally. It creates a single-node cluster that runs in a container (using Docker as the driver in WSL2).

### Step 1: Download and Install

```bash
# Download the latest minikube binary
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64

# Install it
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Clean up the downloaded file
rm minikube-linux-amd64

# Verify
minikube version
```

### Step 2: Configure minikube to Use Docker Driver

Since you're running in WSL2 with Docker, tell minikube to use Docker as its driver:

```bash
minikube config set driver docker
```

> 💡 **Why Docker driver?** minikube can use different "drivers" to create the local cluster (VirtualBox, Hyper-V, Docker, etc.). In WSL2, Docker is the most lightweight and reliable option — it runs the Kubernetes node as a Docker container.

---

## Verify Your Installation

Run both tools to confirm they're installed correctly:

```bash
# Check kubectl
kubectl version --client --output=yaml
# ✅ Should show clientVersion with major, minor, gitVersion, etc.

# Check minikube
minikube version
# ✅ Should show minikube version: vX.X.X
```

If both commands work, you're ready to start your first cluster!

---

## Troubleshooting

### "command not found: kubectl"

Make sure `/usr/local/bin` is in your PATH:

```bash
echo $PATH
# Should contain /usr/local/bin
```

If not, add it:

```bash
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
source ~/.bashrc
```

### "command not found: minikube"

Same fix as above — ensure `/usr/local/bin` is in your PATH.

### Docker permission errors

If you see "permission denied" errors with Docker:

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and back in (or restart WSL2)
# Then verify:
docker run hello-world
```

---

**Next up:** [Your First Kubernetes Cluster →](./04-first-cluster.md)
