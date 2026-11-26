const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FILE = process.env.LOG_FILE || "/usr/src/app/files/log.txt";
const randomString = crypto.randomUUID();

fs.mkdirSync(path.dirname(FILE), { recursive: true });

function writeLine() {
  const line = `${new Date().toISOString()}: ${randomString}\n`;
  fs.appendFile(FILE, line, (err) => {
    if (err) console.error(err);
  });
}

writeLine();
const timer = setInterval(writeLine, 5000);

process.on("SIGTERM", () => {
  clearInterval(timer);
  process.exit(0);
});
