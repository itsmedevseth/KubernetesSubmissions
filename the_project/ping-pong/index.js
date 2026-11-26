const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const FILE = process.env.PINGPONG_FILE || "/usr/src/app/shared/pingpong.txt";

fs.mkdirSync(path.dirname(FILE), { recursive: true });

function readCounter() {
  try {
    const n = parseInt(fs.readFileSync(FILE, "utf8"), 10);
    return Number.isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}

let counter = readCounter();

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/pingpong") {
    const current = counter;
    try {
      fs.writeFileSync(FILE, String(current + 1));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Could not save counter\n");
      return;
    }
    counter = current + 1;
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`pong ${current}\n`);
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found\n");
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
});
