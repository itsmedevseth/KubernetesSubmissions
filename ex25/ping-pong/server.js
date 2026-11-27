'use strict';

const http = require('node:http');

const PORT = Number(process.env.PORT) || 3001;

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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ping-pong listening on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
