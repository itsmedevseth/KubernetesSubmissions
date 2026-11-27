'use strict';

const http = require('node:http');
const { randomUUID } = require('node:crypto');

const PORT = Number(process.env.PORT) || 3001;
const MAX_BODY_BYTES = 10 * 1024;
const MAX_TEXT_LENGTH = 140;

const todos = [];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.removeAllListeners('data');
        req.resume();
        reject(new HttpError(413, 'Payload too large'));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

function validateText(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new HttpError(400, 'Todo text must be a non-empty string');
  }
  const trimmed = text.trim();
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new HttpError(400, `Todo text must be at most ${MAX_TEXT_LENGTH} characters`);
  }
  return trimmed;
}

async function handle(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && pathname === '/healthz') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (pathname === '/todos') {
    if (req.method === 'GET') {
      return sendJson(res, 200, todos);
    }
    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const todo = {
        id: randomUUID(),
        text: validateText(body.text),
        done: false,
        createdAt: new Date().toISOString(),
      };
      todos.push(todo);
      return sendJson(res, 201, todo);
    }
    throw new HttpError(405, 'Method not allowed');
  }

  throw new HttpError(404, 'Not found');
}

const server = http.createServer(async (req, res) => {
  try {
    await handle(req, res);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error(err);
    sendJson(res, status, { error: status === 500 ? 'Internal server error' : err.message });
  } finally {
    if (req.url !== '/healthz') {
      console.log(`${req.method} ${req.url} -> ${res.statusCode}`);
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`todo-backend listening on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
