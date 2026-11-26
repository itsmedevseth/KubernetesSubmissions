const http = require("http");
const fs = require("fs");

const PORT = Number(process.env.PORT) || 3000;
const LOG_FILE = process.env.LOG_FILE || "/usr/src/app/files/log.txt";
const PINGPONG_FILE = process.env.PINGPONG_FILE || "/usr/src/app/shared/pingpong.txt";

function readLastLine() {
  try {
    const lines = fs.readFileSync(LOG_FILE, "utf8").trim().split("\n");
    return lines[lines.length - 1] || null;
  } catch {
    return null;
  }
}

function readPingPongs() {
  try {
    const n = parseInt(fs.readFileSync(PINGPONG_FILE, "utf8"), 10);
    return Number.isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" || req.url !== "/") {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found\n");
    return;
  }
  const line = readLastLine();
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(line ? `${line}.\nPing / Pongs: ${readPingPongs()}\n` : "No logs yet\n");
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
});
