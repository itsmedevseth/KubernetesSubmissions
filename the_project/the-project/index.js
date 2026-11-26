const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const IMAGE_DIR = process.env.IMAGE_DIR || "/usr/src/app/files";
const IMAGE_URL = process.env.IMAGE_URL || "https://picsum.photos/1200";
const MAX_AGE_MS = (Number(process.env.CACHE_SECONDS) || 600) * 1000;
const IMAGE_FILE = path.join(IMAGE_DIR, "image.jpg");

fs.mkdirSync(IMAGE_DIR, { recursive: true });

let downloading = null;

function downloadImage() {
  if (downloading) return downloading;
  downloading = (async () => {
    const res = await fetch(IMAGE_URL);
    if (!res.ok) throw new Error(`Image download failed: ${res.status}`);
    const data = Buffer.from(await res.arrayBuffer());
    const tmp = `${IMAGE_FILE}.tmp`;
    await fsp.writeFile(tmp, data);
    await fsp.rename(tmp, IMAGE_FILE);
    console.log("Downloaded new image");
  })().finally(() => {
    downloading = null;
  });
  return downloading;
}

async function imageAge() {
  try {
    const stat = await fsp.stat(IMAGE_FILE);
    return Date.now() - stat.mtimeMs;
  } catch {
    return null;
  }
}

async function serveImage(res) {
  const age = await imageAge();
  if (age === null) {
    try {
      await downloadImage();
    } catch (err) {
      console.error(err.message);
      res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Image not available\n");
      return;
    }
  } else if (age > MAX_AGE_MS) {
    downloadImage().catch((err) => console.error(err.message));
  }
  res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "no-store" });
  fs.createReadStream(IMAGE_FILE).pipe(res);
}

const todos = [
  "Learn Kubernetes basics",
  "Deploy application to cluster",
  "Configure persistent volumes",
];

const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const page = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Todo App</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #333; }
    h1, h2 { text-align: center; }
    .image { display: block; width: 400px; max-width: 100%; margin: 0 auto 3rem; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    form { display: flex; gap: 1rem; max-width: 520px; margin: 0 auto; }
    input { flex: 1; padding: 0.75rem; font-size: 1rem; border: 2px solid #4caf50; border-radius: 4px; }
    button { padding: 0.75rem 1.5rem; font-size: 1rem; color: #fff; background: #4caf50; border: none; border-radius: 4px; cursor: pointer; }
    .counter { max-width: 520px; margin: 0.4rem auto 0; font-size: 0.85rem; color: #777; }
    ul { list-style: none; padding: 0; }
    li { padding: 1rem 1.25rem; margin-bottom: 0.75rem; background: #f8f8f8; border-left: 5px solid #4caf50; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  </style>
</head>
<body>
  <h1>Todo App</h1>
  <img class="image" src="/image" alt="Random picture">

  <form onsubmit="return false">
    <input id="todo" type="text" maxlength="140" placeholder="Enter a new todo (max 140 characters)">
    <button type="submit">Send</button>
  </form>
  <div class="counter"><span id="count">0</span>/140</div>

  <h2>Todos</h2>
  <ul>
    ${todos.map((t) => `<li>${escapeHtml(t)}</li>`).join("\n    ")}
  </ul>

  <script>
    const input = document.getElementById("todo");
    const count = document.getElementById("count");
    input.addEventListener("input", () => { count.textContent = input.value.length; });
  </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(page);
    return;
  }
  if (req.method === "GET" && req.url === "/image") {
    serveImage(res).catch((err) => {
      console.error(err.message);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
    return;
  }
  if (req.method === "POST" && req.url === "/shutdown") {
    console.log("Shutdown requested");
    res.end("Shutting down\n", () => process.exit(1));
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found\n");
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
  imageAge().then((age) => {
    if (age === null) downloadImage().catch((err) => console.error(err.message));
  });
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
});
