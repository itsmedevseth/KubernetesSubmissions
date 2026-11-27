'use strict';

const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3000;
const IMAGE_DIR = process.env.IMAGE_DIR || '/usr/src/app/files';
const IMAGE_URL = process.env.IMAGE_URL || 'https://picsum.photos/1200';
const CACHE_MS = Number(process.env.IMAGE_CACHE_MINUTES || 10) * 60 * 1000;
const DOWNLOAD_TIMEOUT_MS = 15_000;

const IMAGE_PATH = path.join(IMAGE_DIR, 'image.jpg');

let refreshInFlight = null;

async function downloadImage() {
  const response = await fetch(IMAGE_URL, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Image download failed with HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  const tmpPath = `${IMAGE_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmpPath, buffer);
  await fs.rename(tmpPath, IMAGE_PATH);
  console.log(`Downloaded new image (${buffer.length} bytes)`);
}

function refreshImage() {
  if (!refreshInFlight) {
    refreshInFlight = downloadImage().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function imageAgeMs() {
  try {
    const stats = await fs.stat(IMAGE_PATH);
    return Date.now() - stats.mtimeMs;
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function getImage() {
  const age = await imageAgeMs();
  if (age === null) {
    await refreshImage();
  } else if (age > CACHE_MS) {
    refreshImage().catch((err) => console.error(`Background image refresh failed: ${err.message}`));
  }
  return fs.readFile(IMAGE_PATH);
}

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>The project App</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
    img { width: 100%; height: auto; border-radius: 8px; }
    form { display: flex; gap: 0.5rem; margin: 1rem 0; }
    input { flex: 1; padding: 0.5rem; }
    button { padding: 0.5rem 1rem; }
    .error { color: #b00020; }
    .counter { font-size: 0.85rem; color: #666; }
  </style>
</head>
<body>
  <h1>The project App</h1>
  <img src="/image" alt="Random picture">
  <form id="todo-form">
    <input id="todo-input" type="text" maxlength="140" placeholder="New todo" required>
    <button type="submit">Create todo</button>
  </form>
  <div class="counter"><span id="char-count">0</span>/140</div>
  <p id="error" class="error" role="alert"></p>
  <ul id="todo-list"></ul>
  <script>
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const list = document.getElementById('todo-list');
    const errorBox = document.getElementById('error');
    const charCount = document.getElementById('char-count');

    function renderTodos(todos) {
      list.replaceChildren(...todos.map((todo) => {
        const li = document.createElement('li');
        li.textContent = todo.text;
        return li;
      }));
    }

    async function loadTodos() {
      try {
        const response = await fetch('/todos');
        if (!response.ok) throw new Error('Could not load todos');
        renderTodos(await response.json());
        errorBox.textContent = '';
      } catch (err) {
        errorBox.textContent = err.message;
      }
    }

    input.addEventListener('input', () => {
      charCount.textContent = input.value.length;
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      try {
        const response = await fetch('/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Could not create todo');
        }
        input.value = '';
        charCount.textContent = '0';
        await loadTodos();
      } catch (err) {
        errorBox.textContent = err.message;
      }
    });

    loadTodos();
  </script>
</body>
</html>
`;

function send(res, status, body, contentType) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (req.method !== 'GET') {
    return send(res, 405, 'Method not allowed\n', 'text/plain; charset=utf-8');
  }

  if (pathname === '/healthz') {
    return send(res, 200, 'ok\n', 'text/plain; charset=utf-8');
  }

  if (pathname === '/') {
    return send(res, 200, PAGE, 'text/html; charset=utf-8');
  }

  if (pathname === '/image') {
    try {
      const image = await getImage();
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': image.length,
        'Cache-Control': 'no-store',
      });
      return res.end(image);
    } catch (err) {
      console.error(`Could not serve image: ${err.message}`);
      return send(res, 503, 'Image unavailable\n', 'text/plain; charset=utf-8');
    }
  }

  return send(res, 404, 'Not found\n', 'text/plain; charset=utf-8');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`todo-app listening on port ${PORT}, image dir ${IMAGE_DIR}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
