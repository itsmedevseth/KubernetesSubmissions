const http = require("http");

const PORT = Number(process.env.PORT) || 3000;
let counter = 0;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/pingpong") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`pong ${counter++}\n`);
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
