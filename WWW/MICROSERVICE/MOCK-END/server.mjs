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
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function readRequestJson(req) {
  const chunks = [];
  let total = 0;
  const MAX = 2_000_000;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > MAX) throw new Error("payload_too_large");
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}

async function readRequestBinary(req) {
  const chunks = [];
  let total = 0;
  const MAX = 10_000_000; // 10MB limit for images
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > MAX) throw new Error("payload_too_large");
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

async function readCatalogList(tenant, fileName) {
  const base = path.join(ROOT, tenant, "CATALOGO");
  const fullPath = path.join(base, fileName);
  return await readJsonFile(fullPath);
}

const ALLOWED_JSON_ROOT_DIRS = new Set([
  "CATALOGO",
  "THEMA",
  "COPY",
  "CONTEXTO",
  "BUILDER",
  "BLUEPRINT",
  "COMMERCE",
]);

const COMMERCE_SCHEMA_VERSION = 1;
const SEEDED_COMMERCE_TENANTS = new Set();
const SEEDING_COMMERCE_TENANTS = new Map();

async function writeJsonIfMissing(filePath, data) {
  try {
    await fs.access(filePath);
    return false;
  } catch (err) {
    if (err?.code !== "ENOENT") throw err;
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8", {
      flag: "wx",
    });
    return true;
  } catch (err) {
    if (err?.code === "EEXIST") return false;
    throw err;
  }
}

async function ensureCommerceSeed(tenant) {
  if (SEEDED_COMMERCE_TENANTS.has(tenant)) return;
  const inFlight = SEEDING_COMMERCE_TENANTS.get(tenant);
  if (inFlight) return await inFlight;

  const p = (async () => {
    const dir = path.join(ROOT, tenant, "COMMERCE");
    await fs.mkdir(dir, { recursive: true });

    await writeJsonIfMissing(path.join(dir, "users.json"), {
      schemaVersion: COMMERCE_SCHEMA_VERSION,
      users: [],
    });
    await writeJsonIfMissing(path.join(dir, "sessions.json"), {
      schemaVersion: COMMERCE_SCHEMA_VERSION,
      sessions: [],
    });
    await writeJsonIfMissing(path.join(dir, "orders.json"), {
      schemaVersion: COMMERCE_SCHEMA_VERSION,
      orders: [],
    });
  })();

  SEEDING_COMMERCE_TENANTS.set(tenant, p);
  try {
    await p;
    SEEDED_COMMERCE_TENANTS.add(tenant);
  } finally {
    SEEDING_COMMERCE_TENANTS.delete(tenant);
  }
}

function resolveTenantJsonPath(tenant, relPath) {
  const base = path.resolve(ROOT, tenant);
  const raw = String(relPath ?? "");
  if (!raw || raw.includes("\0")) return null;
  if (path.isAbsolute(raw)) return null;
  const normalized = raw.replaceAll("\\", "/").replace(/^\/+/, "");
  const first = normalized.split("/")[0] ?? "";
  if (!ALLOWED_JSON_ROOT_DIRS.has(first)) return null;
  if (!normalized.toLowerCase().endsWith(".json")) return null;
  const full = path.resolve(base, normalized);
  if (!full.startsWith(base + path.sep)) return null;
  return full;
}

function resolveTenantAssetPath(tenant, relPath) {
  const base = path.resolve(ROOT, tenant);
  const raw = String(relPath ?? "");
  if (!raw || raw.includes("\0")) return null;
  if (path.isAbsolute(raw)) return null;
  const normalized = raw.replaceAll("\\", "/").replace(/^\/+/, "");
  
  // Apenas permitir salvar em THEMA/assets/images/
  if (!normalized.startsWith("THEMA/assets/images/")) return null;
  
  // Impedir arquivos perigosos (apenas imagens permitidas por enquanto)
  const ext = path.extname(normalized).toLowerCase();
  const allowedExts = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg"]);
  if (!allowedExts.has(ext)) return null;

  const full = path.resolve(base, normalized);
  if (!full.startsWith(base + path.sep)) return null;
  return full;
}

async function listJsonFiles(tenant, relDir) {
  const base = path.resolve(ROOT, tenant);
  const raw = String(relDir ?? "");
  if (!raw || raw.includes("\0")) return null;
  if (path.isAbsolute(raw)) return null;
  const normalized = raw.replaceAll("\\", "/").replace(/^\/+/, "").replace(/\/+$/, "");
  const first = normalized.split("/")[0] ?? "";
  if (!ALLOWED_JSON_ROOT_DIRS.has(first)) return null;
  const fullDir = path.resolve(base, normalized);
  if (!fullDir.startsWith(base + path.sep)) return null;
  const entries = await fs.readdir(fullDir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!e.name.toLowerCase().endsWith(".json")) continue;
    const filePath = path.join(fullDir, e.name);
    const st = await fs.stat(filePath);
    out.push({
      name: e.name,
      size: st.size,
      mtimeMs: st.mtimeMs,
      path: normalized ? `${normalized}/${e.name}` : e.name,
    });
  }
  return out;
}

async function handle(req, res) {
  const cors = corsHeaders(req) ?? {};
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname = url.pathname;

  if (pathname === "/health") {
    json(res, 200, { ok: true }, cors);
    return;
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    json(res, 404, { error: "not_found" }, cors);
    return;
  }

  const [api, tenantRaw, scope, resource, slug] = parts;
  if (api !== "api") {
    json(res, 404, { error: "not_found" }, cors);
    return;
  }

  const tenant = await ensureTenant(tenantRaw);
  if (!tenant) {
    json(res, 404, { error: "tenant_not_found" }, cors);
    return;
  }

  try {
    await ensureCommerceSeed(tenant);

    if (scope === "json") {
      const action = resource;
      if (req.method === "GET" && action === "list") {
        const dir = url.searchParams.get("dir");
        let files;
        try {
          files = await listJsonFiles(tenant, dir);
        } catch (err) {
          if (err?.code === "ENOENT") {
            json(res, 404, { error: "not_found", tenant, dir }, cors);
            return;
          }
          throw err;
        }
        if (!files) {
          json(res, 400, { error: "invalid_dir" }, cors);
          return;
        }
        json(res, 200, { ok: true, tenant, dir, files }, cors);
        return;
      }

      if (req.method === "GET" && !action) {
        const relPath = url.searchParams.get("path");
        const filePath = resolveTenantJsonPath(tenant, relPath);
        if (!filePath) {
          json(res, 400, { error: "invalid_path" }, cors);
          return;
        }
        try {
          const data = await readJsonFile(filePath);
          json(res, 200, { ok: true, tenant, path: relPath, data }, cors);
        } catch (err) {
          if (err?.code === "ENOENT") {
            json(res, 404, { error: "not_found", tenant, path: relPath }, cors);
            return;
          }
          throw err;
        }
        return;
      }

      if (req.method === "PUT" && !action) {
        const relPath = url.searchParams.get("path");
        const filePath = resolveTenantJsonPath(tenant, relPath);
        if (!filePath) {
          json(res, 400, { error: "invalid_path" }, cors);
          return;
        }
        const body = await readRequestJson(req);
        if (!isRecord(body) && !Array.isArray(body)) {
          json(res, 400, { error: "invalid_json_root" }, cors);
          return;
        }
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(body, null, 2) + "\n", "utf8");
        json(res, 200, { ok: true, tenant, path: relPath }, cors);
        return;
      }

      if (req.method === "DELETE" && !action) {
        const relPath = url.searchParams.get("path");
        const filePath = resolveTenantJsonPath(tenant, relPath);
        if (!filePath) {
          json(res, 400, { error: "invalid_path" }, cors);
          return;
        }
        await fs.rm(filePath, { force: true });
        json(res, 200, { ok: true, tenant, path: relPath }, cors);
        return;
      }

      json(res, 405, { error: "method_not_allowed" }, cors);
      return;
    }

    if (scope === "assets") {
      const relPath = url.searchParams.get("path");
      const filePath = resolveTenantAssetPath(tenant, relPath);
      
      if (!filePath) {
        json(res, 400, { error: "invalid_path" }, cors);
        return;
      }

      if (req.method === "PUT") {
        const body = await readRequestBinary(req);
        if (!body || body.length === 0) {
          json(res, 400, { error: "empty_payload" }, cors);
          return;
        }
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, body);
        json(res, 200, { ok: true, tenant, path: relPath, size: body.length }, cors);
        return;
      }

      if (req.method === "DELETE") {
        await fs.rm(filePath, { force: true });
        json(res, 200, { ok: true, tenant, path: relPath }, cors);
        return;
      }

      json(res, 405, { error: "method_not_allowed" }, cors);
      return;
    }

    if (scope !== "catalogo") {
      json(res, 404, { error: "not_found" }, cors);
      return;
    }

    if (resource === "categorias") {
      if (req.method !== "GET") {
        json(res, 405, { error: "method_not_allowed" }, cors);
        return;
      }
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
      if (req.method !== "GET") {
        json(res, 405, { error: "method_not_allowed" }, cors);
        return;
      }
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
    const message = e instanceof Error ? e.message : "";
    if (message === "payload_too_large") {
      json(res, 413, { error: "payload_too_large" }, cors);
      return;
    }
    if (message.includes("JSON")) {
      json(res, 400, { error: "invalid_json" }, cors);
      return;
    }
    json(res, 500, { error: "internal_error" }, cors);
  }
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(() => text(res, 500, "internal_error"));
});

server.listen(PORT, () => {
  process.stdout.write(`MOCK-END listening on http://localhost:${PORT}\n`);
});
