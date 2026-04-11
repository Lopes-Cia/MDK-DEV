import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;

const PORT = Number(process.env.PORT ?? "4000");

function json(res, statusCode, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

function text(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

function normalizeTenant(tenant) {
  return String(tenant ?? "").trim();
}

async function listTenants() {
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  const candidates = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const tenants = [];
  for (const name of candidates) {
    try {
      const catalogDir = path.join(ROOT, name, "CATALOGO");
      await fs.access(path.join(catalogDir, "categorias.json"));
      await fs.access(path.join(catalogDir, "produtos.json"));
      tenants.push(name);
    } catch {
      continue;
    }
  }
  return tenants;
}

async function ensureTenant(tenant) {
  const t = normalizeTenant(tenant);
  if (!t) return null;
  const tenants = await listTenants();
  if (!tenants.includes(t)) return null;
  return t;
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  const host = url.hostname;
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  if (port !== "3000") return false;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host === "lvh.me" || host.endsWith(".lvh.me")) return true;
  return false;
}

function corsHeaders(req) {
  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function readCatalogList(tenant, fileName) {
  const base = path.join(ROOT, tenant, "CATALOGO");
  const fullPath = path.join(base, fileName);
  return await readJsonFile(fullPath);
}

async function handle(req, res) {
  const cors = corsHeaders(req) ?? {};
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (req.method !== "GET") {
    json(res, 405, { error: "method_not_allowed" }, cors);
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname = url.pathname;

  if (pathname === "/health") {
    json(res, 200, { ok: true }, cors);
    return;
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 4) {
    json(res, 404, { error: "not_found" }, cors);
    return;
  }

  const [api, tenantRaw, catalogo, resource, slug] = parts;
  if (api !== "api" || catalogo !== "catalogo") {
    json(res, 404, { error: "not_found" }, cors);
    return;
  }

  const tenant = await ensureTenant(tenantRaw);
  if (!tenant) {
    json(res, 404, { error: "tenant_not_found" }, cors);
    return;
  }

  try {
    if (resource === "categorias") {
      const categories = await readCatalogList(tenant, "categorias.json");
      if (!slug) {
        json(res, 200, categories, cors);
        return;
      }
      const item = Array.isArray(categories) ? categories.find((c) => c?.slug === slug) : null;
      if (!item) {
        json(res, 404, { error: "slug_not_found" }, cors);
        return;
      }
      json(res, 200, item, cors);
      return;
    }

    if (resource === "produtos") {
      const products = await readCatalogList(tenant, "produtos.json");
      if (!slug) {
        json(res, 200, products, cors);
        return;
      }
      const item = Array.isArray(products) ? products.find((p) => p?.slug === slug) : null;
      if (!item) {
        json(res, 404, { error: "slug_not_found" }, cors);
        return;
      }
      json(res, 200, item, cors);
      return;
    }

    json(res, 404, { error: "not_found" }, cors);
  } catch (e) {
    json(res, 500, { error: "seed_read_error" }, cors);
  }
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(() => text(res, 500, "internal_error"));
});

server.listen(PORT, () => {
  process.stdout.write(`MOCK-END listening on http://localhost:${PORT}\n`);
});
