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

const page = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>The project App</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>The project App</h1>
  <img src="/image" alt="Random picture">
  <p>DevOps with Kubernetes</p>
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
