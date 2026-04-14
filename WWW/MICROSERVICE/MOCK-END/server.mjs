import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { corsHeaders } from "./lib/cors.mjs";
import { loadDotEnv } from "./lib/env.mjs";
import { resolveProjectByPathname } from "./lib/project.mjs";
import { json, text } from "./lib/response.mjs";
import { handleRoutes } from "./routes/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;

await loadDotEnv(ROOT, ".env");

const PORT = Number(process.env.PORT ?? "4000");

async function handle(req, res) {
  const cors = corsHeaders(req) ?? {};
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname = url.pathname;
  const project = resolveProjectByPathname(ROOT, pathname);

  const handled = await handleRoutes(req, res, {
    cors,
    url,
    pathname,
    rootDir: ROOT,
    projectDir: project?.projectDir ?? null,
    basePrefix: project?.basePrefix ?? null,
  });
  if (handled) return;

  json(res, 404, { error: "not_found" }, cors);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(() => text(res, 500, "internal_error"));
});

server.listen(PORT, () => {
  process.stdout.write(`MOCK-END listening on http://localhost:${PORT}\n`);
});
