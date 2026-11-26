const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 3000;

const randomString = crypto.randomUUID();
let latest = "";

function logOutput() {
  latest = `${new Date().toISOString()}: ${randomString}`;
  console.log(latest);
}

logOutput();
const timer = setInterval(logOutput, 5000);

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(latest + "\n");
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found\n");
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down");
  clearInterval(timer);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref(); // fallback if connections linger
});