/**
 * Kube-Trainer Hello World App
 *
 * A minimal Node.js web server used as the workload you'll deploy,
 * scale, and manage throughout the Kubernetes training phases.
 *
 * Endpoints:
 *   GET /        → HTML "Hello World" page
 *   GET /health  → JSON health check { "status": "ok" }
 *   GET /ready   → JSON readiness check { "ready": true }
 *   GET /startup → JSON startup check { "started": true }
 */

const http = require('http');
const os = require('os');

const PORT = process.env.PORT || 3000;
const HOSTNAME = os.hostname();
const START_TIME = Date.now();

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kube-Trainer Hello World</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 { font-size: 3rem; margin-bottom: 0.5rem; }
    p { font-size: 1.2rem; opacity: 0.85; }
    code {
      background: rgba(255,255,255,0.2);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧊 Hello World</h1>
    <p>Your Kube-Trainer app is running!</p>
    <p>Hostname: <code>${HOSTNAME}</code></p>
    <p>Health check: <code>GET /health</code></p>
  </div>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const timestamp = new Date().toISOString();

  // Log every incoming request (useful for kubectl logs demos)
  console.log(`[${timestamp}] ${req.method} ${req.url} — from ${req.socket.remoteAddress}`);

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', hostname: HOSTNAME }));
    return;
  }

  if (req.url === '/ready' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ready: true, hostname: HOSTNAME }));
    return;
  }

  if (req.url === '/startup' && req.method === 'GET') {
    const uptimeMs = Date.now() - START_TIME;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ started: true, hostname: HOSTNAME, uptimeMs }));
    return;
  }

  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML_PAGE);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`🧊 Kube-Trainer app listening on http://localhost:${PORT}`);
  console.log(`   Hostname: ${HOSTNAME}`);
  console.log(`   Endpoints: / | /health | /ready | /startup`);
});
