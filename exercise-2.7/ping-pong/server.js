'use strict';

const http = require('node:http');
const { Pool } = require('pg');

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    console.error(`Missing required environment variable ${name}`);
    process.exit(1);
  }
  return value.trim();
}

const PORT = Number(requireEnv('PORT'));
const DB_RETRY_DELAY_MS = Number(requireEnv('DB_RETRY_DELAY_MS'));
const DB_MAX_RETRIES = Number(requireEnv('DB_MAX_RETRIES'));

const pool = new Pool({
  host: requireEnv('PGHOST'),
  port: Number(requireEnv('PGPORT')),
  database: requireEnv('PGDATABASE'),
  user: requireEnv('PGUSER'),
  password: requireEnv('PGPASSWORD'),
  max: 5,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error(`Unexpected database error: ${err.message}`);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function initDatabase() {
  for (let attempt = 1; attempt <= DB_MAX_RETRIES; attempt += 1) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pingpong_counter (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          count BIGINT NOT NULL DEFAULT 0
        )
      `);
      await pool.query('INSERT INTO pingpong_counter (id, count) VALUES (1, 0) ON CONFLICT (id) DO NOTHING');
      console.log('Database ready');
      return;
    } catch (err) {
      console.error(`Database not ready (attempt ${attempt}/${DB_MAX_RETRIES}): ${err.message}`);
      await sleep(DB_RETRY_DELAY_MS);
    }
  }
  throw new Error('Could not connect to the database');
}

async function incrementCounter() {
  const result = await pool.query(
    'UPDATE pingpong_counter SET count = count + 1 WHERE id = 1 RETURNING count - 1 AS previous',
  );
  return Number(result.rows[0].previous);
}

async function readCounter() {
  const result = await pool.query('SELECT count FROM pingpong_counter WHERE id = 1');
  return Number(result.rows[0].count);
}

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (req.method !== 'GET') {
    return send(res, 405, 'Method not allowed\n');
  }

  try {
    switch (pathname) {
      case '/pingpong': {
        const current = await incrementCounter();
        console.log(`GET /pingpong -> pong ${current}`);
        return send(res, 200, `pong ${current}\n`);
      }
      case '/pings':
        return send(res, 200, JSON.stringify({ pongs: await readCounter() }), 'application/json');
      case '/healthz':
        return send(res, 200, 'ok\n');
      default:
        return send(res, 404, 'Not found\n');
    }
  } catch (err) {
    console.error(`Request ${pathname} failed: ${err.message}`);
    return send(res, 503, 'Database unavailable\n');
  }
});

async function start() {
  try {
    await initDatabase();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ping-pong listening on port ${PORT}`);
  });
}

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
