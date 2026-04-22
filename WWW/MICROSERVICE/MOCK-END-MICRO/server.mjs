import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { corsHeaders } from "./lib/cors.mjs";
import { loadDotEnv } from "./lib/env.mjs";
import { json, text } from "./lib/response.mjs";
import { handleRoutes } from "./routes/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;

await loadDotEnv(ROOT, ".env");

const PORT = Number.parseInt(String(process.env.PORT ?? "").trim(), 10);
if (!Number.isFinite(PORT) || PORT < 1) {
  throw new Error("PORT inválida no .env");
}

const HOST = String(process.env.HOST ?? "").trim();

const baseUrlRaw = String(process.env.BASE_URL_API ?? "").trim();
if (!baseUrlRaw) {
  throw new Error("BASE_URL_API ausente no .env");
}
let baseUrl;
try {
  baseUrl = new URL(baseUrlRaw);
} catch {
  throw new Error("BASE_URL_API inválida no .env (ex.: http://localhost)");
}

const PRODUTO = String(process.env.PRODUTO ?? "").trim();
if (!PRODUTO) {
  throw new Error("PRODUTO ausente no .env");
}

async function handle(req, res) {
  const cors = corsHeaders(req) ?? {};
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", baseUrl);
  const pathname = url.pathname;

  const handled = await handleRoutes(req, res, {
    cors,
    url,
    pathname,
    rootDir: ROOT,
    produtoName: PRODUTO,
  });
  if (handled) return;

  json(res, 404, { error: "not_found" }, cors);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(() => text(res, 500, "internal_error"));
});

const publicOrigin = baseUrl.port ? baseUrl.origin : `${baseUrl.origin}:${PORT}`;
if (HOST) {
  server.listen(PORT, HOST, () => {
    process.stdout.write(`MOCK-END-MICRO listening on ${publicOrigin}\n`);
  });
} else {
  server.listen(PORT, () => {
    process.stdout.write(`MOCK-END-MICRO listening on ${publicOrigin}\n`);
  });
}
