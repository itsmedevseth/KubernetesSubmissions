'use strict';

const http = require('node:http');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');

const PORT = Number(process.env.PORT) || 3000;
const PING_PONG_URL = process.env.PING_PONG_URL || 'http://ping-pong-svc:2345/pings';
const INFO_FILE_PATH = process.env.INFO_FILE_PATH || '/config/information.txt';
const FETCH_TIMEOUT_MS = 2000;

const randomString = randomUUID();

const currentStatus = () => `${new Date().toISOString()}: ${randomString}.`;

const logTimer = setInterval(() => console.log(currentStatus()), 5000);
console.log(currentStatus());

async function readInfoFile() {
  try {
    return (await fs.readFile(INFO_FILE_PATH, 'utf8')).trim();
  } catch (err) {
    console.error(`Could not read ${INFO_FILE_PATH}: ${err.message}`);
    return '(file not available)';
  }
}

async function fetchPongs() {
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

  const header =
    `file content: ${await readInfoFile()}\n` +
    `env variable: MESSAGE=${process.env.MESSAGE ?? '(not set)'}\n`;

  try {
    const pongs = await fetchPongs();
    return send(res, 200, `${header}${currentStatus()}\nPing / Pongs: ${pongs}\n`);
  } catch (err) {
    console.error(`Failed to fetch pongs from ${PING_PONG_URL}: ${err.message}`);
    return send(res, 503, `${header}${currentStatus()}\nPing / Pongs: unavailable\n`);
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
