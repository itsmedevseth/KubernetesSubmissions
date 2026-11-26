const http = require("http");
const fs = require("fs");

const PORT = Number(process.env.PORT) || 3000;
const FILE = process.env.LOG_FILE || "/usr/src/app/files/log.txt";

const server = http.createServer((req, res) => {
  if (req.method !== "GET" || req.url !== "/") {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found\n");
    return;
  }
  fs.readFile(FILE, "utf8", (err, data) => {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(err ? "No logs yet\n" : data);
  });
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
});
