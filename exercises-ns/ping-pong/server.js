'use strict';

// Ping pong app
//   GET /pingpong -> increments the counter, responds "pong N"  (via Ingress, for the browser)
//   GET /pings    -> current counter as JSON {"pongs": N}       (in-cluster, for Log output)
//   GET /healthz  -> health check for Kubernetes probes

const http = require('node:http');

const PORT = Number(process.env.PORT) || 3001;

// In-memory counter: the shared volume was removed, so the count resets when
// the pod restarts. That's expected for this exercise.
let counter = 0;

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (req.method !== 'GET') {
    return send(res, 405, 'Method not allowed\n');
  }

  switch (pathname) {
    case '/pingpong': {
      const current = counter;
      counter += 1;
      console.log(`GET /pingpong -> pong ${current}`);
      return send(res, 200, `pong ${current}\n`);
    }
    case '/pings':
      return send(res, 200, JSON.stringify({ pongs: counter }), 'application/json');
    case '/healthz':
      return send(res, 200, 'ok\n');
    default:
      return send(res, 404, 'Not found\n');
  }
});

// 0.0.0.0 so the app is reachable from outside its own container.
server.listen(PORT, '0.0.0.0', () => {
  console.log(`ping-pong listening on port ${PORT}`);
});

// Handle SIGTERM so pod shutdowns are immediate instead of waiting the full grace period.
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
