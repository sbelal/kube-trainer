# Phase 0: Docker Refresher

Before diving into Kubernetes, let's make sure you're comfortable with the fundamentals — running an app locally and containerizing it with Docker.

In this phase you'll:

1. Run the Hello World app **directly** with Node.js
2. View it in your browser
3. Build a **Docker image** for the app
4. Run it inside a **Docker container**
5. View it in your browser again — this time served from Docker

---

## Lesson 1: Run the App Locally

The `app/` folder in this repo contains a tiny Node.js web server. Let's run it.

### Start the Server

```bash
# From the repo root
cd app/
node server.js
```

You should see:

```
🧊 Kube-Trainer app listening on http://localhost:3000
```

### View It in Your Browser

Open your browser and go to:

- **http://localhost:3000** — You should see a purple gradient page with **"🧊 Hello World"**
- **http://localhost:3000/health** — You should see `{"status":"ok"}`

> 💡 **What's happening?** Node.js is running a simple HTTP server that responds to two routes. This is about as simple as a web app can be — no frameworks, no dependencies, just the built-in `http` module.

### Inspect the Code

Take a quick look at `server.js` — it's about 30 lines of code:

- `GET /` returns an HTML page
- `GET /health` returns a JSON health check (a common pattern in production apps, used by orchestrators to check if the app is alive)

### Stop the Server

Press `Ctrl+C` in the terminal to stop the server.

---

## Lesson 2: Containerize with Docker

Now let's package the app into a Docker container. This is the step that bridges "runs on my machine" to "runs anywhere".

### Understanding the Dockerfile

Look at `app/Dockerfile`:

```dockerfile
FROM node:20-alpine       # Start from a lightweight Node.js base image
WORKDIR /app              # Set the working directory inside the container
COPY package.json ./      # Copy package.json first (for caching)
COPY server.js ./         # Copy the application code
EXPOSE 3000               # Document which port the app uses
CMD ["node", "server.js"] # Command to run when the container starts
```

> 💡 **Why Alpine?** `node:20-alpine` is a minimal Linux image (~50MB vs ~350MB for the full image). Smaller images = faster builds, faster pulls, smaller attack surface.

### Build the Image

```bash
# Make sure you're in the app/ directory
cd app/

# Build the image and tag it as "kube-trainer-app"
docker build -t kube-trainer-app:latest .
```

You should see output similar to this:

```
[+] Building 1.4s (9/9) FINISHED                                  docker:default
...
 => => naming to docker.io/library/kube-trainer-app:latest                  0.0s
 => => unpacking to docker.io/library/kube-trainer-app:latest               0.0s
```

### Verify the Image Exists

```bash
docker images | grep kube-trainer-app
```

Expected:

```
kube-trainer-app   latest   xxxxxxxxxx   Just now   XXX MB
```

### Run the Container

```bash
# Run the container
#   -d          = run in background (detached)
#   -p 4000:3000 = map your port 4000 → container's port 3000
#   --name      = give the container a name
docker run -d -p 4000:3000 --name hello-container kube-trainer-app:latest
```

> 💡 **Why port 4000?** We use a different host port (4000) than the container port (3000) so you can see port mapping in action. Your browser hits `localhost:4000`, Docker forwards that to port `3000` inside the container.

### View It in Your Browser

Open your browser:

- **http://localhost:4000** — Same Hello World page, but now served from inside a Docker container!
- **http://localhost:4000/health** — Same health check: `{"status":"ok"}`

### Check Container Status

```bash
# See running containers
docker ps

# View the container's logs
docker logs hello-container
```

### Stop and Remove the Container

```bash
# Stop the container
docker stop hello-container

# Remove it
docker rm hello-container
```

Go back to the repo root:

```bash
cd ..
```

---

## What You Learned

| Concept | What you did |
|---|---|
| **Running locally** | `node server.js` — app runs directly on your machine |
| **Dockerfile** | Defined how to package the app into a container image |
| **docker build** | Built an image from the Dockerfile |
| **docker run** | Started a container from the image |
| **Port mapping** | `-p 4000:3000` — mapped host port to container port |
| **Health check** | `/health` endpoint — a pattern you'll see again in Kubernetes (probes) |

### Why This Matters for Kubernetes

Everything Kubernetes does revolves around **container images**. When you tell Kubernetes "run my app", you're telling it to pull a container image and run it — exactly like `docker run`, but automated, scaled, and self-healing across a cluster.

---

## Verify Your Progress

```bash
# From the repo root
node verify-phase.js 0
```

All checks should pass ✅. Then move on to **[Phase 1: Foundations & Setup →](../01-foundations-and-setup/01-what-is-kubernetes.md)**
