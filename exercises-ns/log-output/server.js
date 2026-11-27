'use strict';

// Log output app
//   - Generates a random string on startup and logs it with a timestamp every 5 seconds.
//   - GET /        -> "<timestamp>: <random string>.\nPing / Pongs: N"
//                     N is fetched over HTTP from the Ping pong app's /pings endpoint.
//   - GET /healthz -> health check for Kubernetes probes

const http = require('node:http');
const { randomUUID } = require('node:crypto');

const PORT = Number(process.env.PORT) || 3000;
// In-cluster address of the Ping pong Service. Configurable so the app can also
// be run locally (e.g. PING_PONG_URL=http://localhost:3001/pings).
const PING_PONG_URL = process.env.PING_PONG_URL || 'http://ping-pong-svc:2345/pings';
const FETCH_TIMEOUT_MS = 2000;

const randomString = randomUUID();

const currentStatus = () => `${new Date().toISOString()}: ${randomString}.`;

// Log to stdout every 5 seconds, as in the original Log output exercise.
const logTimer = setInterval(() => console.log(currentStatus()), 5000);
console.log(currentStatus());

async function fetchPongs() {
  // AbortSignal.timeout prevents a slow or hung Ping pong app from hanging
  // every request to Log output. Global fetch is built into Node 18+.
  const response = await fetch(PING_PONG_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Ping pong responded with HTTP ${response.status}`);
  }
  const data = await response.json();
  if (typeof data.pongs !== 'number') {
    throw new Error('Unexpected response from Ping pong');
  }
  return data.pongs;
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (req.method !== 'GET') return send(res, 405, 'Method not allowed\n');
  if (pathname === '/healthz') return send(res, 200, 'ok\n');
  if (pathname !== '/') return send(res, 404, 'Not found\n');

  try {
    const pongs = await fetchPongs();
    return send(res, 200, `${currentStatus()}\nPing / Pongs: ${pongs}\n`);
  } catch (err) {
    // Degrade gracefully: still show our own status, and report that the
    // dependency is unavailable with 503 rather than crashing or hanging.
    console.error(`Failed to fetch pongs from ${PING_PONG_URL}: ${err.message}`);
    return send(res, 503, `${currentStatus()}\nPing / Pongs: unavailable\n`);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`log-output listening on port ${PORT}, ping pong at ${PING_PONG_URL}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  clearInterval(logTimer);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
