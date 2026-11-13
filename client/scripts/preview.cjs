const http = require("http");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "../build");
const port = Number(process.env.PORT || 5300);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
};
const server = http.createServer((request, response) => {
  let filename;
  try {
    filename = path.resolve(
      root,
      `.${decodeURIComponent(new URL(request.url, "http://localhost").pathname)}`,
    );
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }
  if (filename !== root && !filename.startsWith(root + path.sep)) {
    response.writeHead(403);
    response.end();
    return;
  }
  if (!fs.existsSync(filename) || fs.statSync(filename).isDirectory())
    filename = path.join(root, "index.html");
  response.writeHead(200, {
    "Content-Type": types[path.extname(filename)] || "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  fs.createReadStream(filename).pipe(response);
});
server.listen(port, "127.0.0.1", () =>
  process.stdout.write(`UDU cinematic: http://localhost:${port}\n`),
);
