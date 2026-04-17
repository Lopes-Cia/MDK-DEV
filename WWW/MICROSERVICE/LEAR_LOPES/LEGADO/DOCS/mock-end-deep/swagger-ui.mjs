import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function contentTypeByExt(p) {
  const ext = String(path.extname(p) ?? "").toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  return "application/octet-stream";
}

function send(res, status, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body ?? ""), "utf8");
  res.writeHead(status, { "Content-Length": buf.length, ...headers });
  res.end(buf);
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const port = Number(process.env.PORT ?? 4010);
  const htmlPath = path.join(__dirname, "swagger-ui.html");
  const specPath = path.join(__dirname, "openapi.mock-end.json");

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const pathname = url.pathname;

    if (req.method === "GET" && (pathname === "/" || pathname === "/swagger-ui.html")) {
      const html = await readFile(htmlPath);
      send(res, 200, html, { "Content-Type": contentTypeByExt(htmlPath) });
      return;
    }

    if (req.method === "GET" && pathname === "/openapi.mock-end.json") {
      const spec = await readFile(specPath);
      send(res, 200, spec, { "Content-Type": contentTypeByExt(specPath) });
      return;
    }

    send(res, 404, "not_found\n", { "Content-Type": "text/plain; charset=utf-8" });
  });

  server.listen(port, () => {
    process.stdout.write(`Swagger UI: http://localhost:${port}\n`);
  });
}

main().catch((err) => {
  process.stderr.write(`${err?.message ?? err}\n`);
  process.exitCode = 1;
});

