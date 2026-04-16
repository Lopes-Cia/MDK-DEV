import fs from "node:fs/promises";
import path from "node:path";

import { readRequestJson } from "../../../../../lib/body.mjs";
import { json } from "../../../../../lib/response.mjs";
import {
  readJsonFile,
  removeArrayItemById,
  toPublicError,
  upsertArrayItemById,
  withFileLock,
  writeJsonAtomic,
} from "../../../../../lib/json-store.mjs";

const COMMERCE_SCHEMA_VERSION = 1;

const COMMERCE_FILE_ALLOWLIST = new Set([
  "users.json",
  "sessions.json",
  "orders.json",
  "carts.json",
  "passwordResets.json",
]);

const COMMERCE_SEEDS = {
  "users.json": { schemaVersion: COMMERCE_SCHEMA_VERSION, users: [] },
  "sessions.json": { schemaVersion: COMMERCE_SCHEMA_VERSION, sessions: [] },
  "orders.json": { schemaVersion: COMMERCE_SCHEMA_VERSION, orders: [] },
  "carts.json": { schemaVersion: COMMERCE_SCHEMA_VERSION, carts: [] },
  "passwordResets.json": { schemaVersion: COMMERCE_SCHEMA_VERSION, passwordResets: [] },
};

function isSafeTenant(tenant) {
  const t = String(tenant ?? "").trim();
  if (!t) return false;
  // Mantém simples e evita traversal (sem /, \, .).
  return /^[a-z0-9][a-z0-9-_]*$/i.test(t);
}

async function resolveTenantBaseDir(rootDir, tenant, { createIfMissing = false } = {}) {
  const t = String(tenant ?? "").trim();
  const direct = path.join(rootDir, t);
  try {
    await fs.access(direct);
    return direct;
  } catch {
    // fallback: estrutura legada em /LEGADO/<tenant>
  }

  const legacy = path.join(rootDir, "LEGADO", t);
  try {
    await fs.access(legacy);
    return legacy;
  } catch {
    if (!createIfMissing) return null;
  }

  await fs.mkdir(legacy, { recursive: true });
  return legacy;
}

function parseCommercePath(raw) {
  const relPath = String(raw ?? "");
  if (!relPath || relPath.includes("\0")) return null;
  if (path.isAbsolute(relPath)) return null;

  const normalized = relPath.replaceAll("\\", "/").replace(/^\/+/, "");
  if (normalized === "COMMERCE/*.json") return { kind: "wildcard", normalized };

  if (!normalized.startsWith("COMMERCE/")) return null;
  const fileName = normalized.slice("COMMERCE/".length);
  if (!fileName || fileName.includes("/")) return null;
  if (!fileName.toLowerCase().endsWith(".json")) return null;
  if (!COMMERCE_FILE_ALLOWLIST.has(fileName)) return null;
  return { kind: "single", normalized: `COMMERCE/${fileName}`, fileName };
}

function fullPathForTenantFile(tenantDir, normalizedRelPath) {
  const base = path.resolve(tenantDir);
  const full = path.resolve(base, normalizedRelPath);
  if (!full.startsWith(base + path.sep)) return null;
  return full;
}

function seedForFile(fileName) {
  const seed = COMMERCE_SEEDS[fileName];
  // Clona para evitar mutação global.
  return seed ? JSON.parse(JSON.stringify(seed)) : {};
}

async function getJson(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const tenant = String(ctx?.routeParams?.tenant ?? "").trim();
  if (!isSafeTenant(tenant)) {
    json(res, 400, { success: false, error: "invalid_tenant" }, cors);
    return;
  }

  const relPathRaw = ctx.url?.searchParams?.get("path");
  const parsed = parseCommercePath(relPathRaw);
  if (!parsed) {
    json(res, 400, { success: false, error: "invalid_path" }, cors);
    return;
  }

  const tenantDir = await resolveTenantBaseDir(ctx.rootDir, tenant, { createIfMissing: false });
  if (!tenantDir) {
    json(res, 404, { success: false, error: "tenant_not_found" }, cors);
    return;
  }

  if (parsed.kind === "wildcard") {
    const files = {};
    const missing = [];
    for (const fileName of COMMERCE_FILE_ALLOWLIST) {
      const rel = `COMMERCE/${fileName}`;
      const full = fullPathForTenantFile(tenantDir, rel);
      if (!full) continue;
      try {
        files[fileName] = await readJsonFile(full);
      } catch (err) {
        if (String(err?.code ?? "") === "ENOENT") {
          missing.push(fileName);
          continue;
        }
        const pub = toPublicError(err);
        json(res, pub.status, { success: false, error: pub.error }, cors);
        return;
      }
    }

    if (Object.keys(files).length === 0) {
      json(res, 404, { success: false, error: "not_found" }, cors);
      return;
    }

    json(res, 200, { success: true, data: { files, missing } }, cors);
    return;
  }

  const full = fullPathForTenantFile(tenantDir, parsed.normalized);
  if (!full) {
    json(res, 400, { success: false, error: "invalid_path" }, cors);
    return;
  }

  try {
    const data = await readJsonFile(full);
    json(res, 200, { success: true, data }, cors);
  } catch (err) {
    const pub = toPublicError(err);
    json(res, pub.status, { success: false, error: pub.error }, cors);
  }
}

async function putJson(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const tenant = String(ctx?.routeParams?.tenant ?? "").trim();
  if (!isSafeTenant(tenant)) {
    json(res, 400, { success: false, error: "invalid_tenant" }, cors);
    return;
  }

  const relPathRaw = ctx.url?.searchParams?.get("path");
  const parsed = parseCommercePath(relPathRaw);
  if (!parsed || parsed.kind !== "single") {
    json(res, 400, { success: false, error: "invalid_path" }, cors);
    return;
  }

  let body = null;
  try {
    body = await readRequestJson(req);
  } catch (err) {
    const pub = toPublicError(err);
    json(res, pub.status, { success: false, error: pub.error }, cors);
    return;
  }

  // Permite "seed lazy" quando o cliente mandar vazio/nulo no PUT.
  const dataToWrite =
    body == null || (typeof body === "object" && !Array.isArray(body) && Object.keys(body).length === 0)
      ? seedForFile(parsed.fileName)
      : body;

  const tenantDir = await resolveTenantBaseDir(ctx.rootDir, tenant, { createIfMissing: true });
  const full = fullPathForTenantFile(tenantDir, parsed.normalized);
  if (!full) {
    json(res, 400, { success: false, error: "invalid_path" }, cors);
    return;
  }

  try {
    await withFileLock(full, async () => {
      await writeJsonAtomic(full, dataToWrite);
    });
    json(res, 200, { success: true, data: dataToWrite }, cors);
  } catch (err) {
    const pub = toPublicError(err);
    json(res, pub.status, { success: false, error: pub.error }, cors);
  }
}

async function upsertArrayItem(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const tenant = String(ctx?.routeParams?.tenant ?? "").trim();
  if (!isSafeTenant(tenant)) {
    json(res, 400, { success: false, error: "invalid_tenant" }, cors);
    return;
  }

  const relPathRaw = ctx.url?.searchParams?.get("path");
  const parsed = parseCommercePath(relPathRaw);
  if (!parsed || parsed.kind !== "single") {
    json(res, 400, { success: false, error: "invalid_path" }, cors);
    return;
  }

  const arrayKey = String(ctx.url?.searchParams?.get("key") ?? "").trim();
  if (!arrayKey) {
    json(res, 400, { success: false, error: "missing_array_key" }, cors);
    return;
  }

  let item = null;
  try {
    item = await readRequestJson(req);
  } catch (err) {
    const pub = toPublicError(err);
    json(res, pub.status, { success: false, error: pub.error }, cors);
    return;
  }

  const tenantDir = await resolveTenantBaseDir(ctx.rootDir, tenant, { createIfMissing: true });
  const full = fullPathForTenantFile(tenantDir, parsed.normalized);
  if (!full) {
    json(res, 400, { success: false, error: "invalid_path" }, cors);
    return;
  }

  try {
    const out = await withFileLock(full, async () => {
      let root = null;
      try {
        root = await readJsonFile(full);
      } catch (err) {
        if (String(err?.code ?? "") === "ENOENT") {
          root = seedForFile(parsed.fileName);
        } else {
          throw err;
        }
      }
      const { root: next, item: saved } = upsertArrayItemById(root, arrayKey, item);
      await writeJsonAtomic(full, next);
      return { next, saved };
    });
    json(res, 200, { success: true, data: { item: out.saved, file: out.next } }, cors);
  } catch (err) {
    const pub = toPublicError(err);
    json(res, pub.status, { success: false, error: pub.error }, cors);
  }
}

async function removeArrayItem(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const tenant = String(ctx?.routeParams?.tenant ?? "").trim();
  if (!isSafeTenant(tenant)) {
    json(res, 400, { success: false, error: "invalid_tenant" }, cors);
    return;
  }

  const relPathRaw = ctx.url?.searchParams?.get("path");
  const parsed = parseCommercePath(relPathRaw);
  if (!parsed || parsed.kind !== "single") {
    json(res, 400, { success: false, error: "invalid_path" }, cors);
    return;
  }

  const arrayKey = String(ctx.url?.searchParams?.get("key") ?? "").trim();
  if (!arrayKey) {
    json(res, 400, { success: false, error: "missing_array_key" }, cors);
    return;
  }

  const id = String(ctx.url?.searchParams?.get("id") ?? "").trim();
  if (!id) {
    json(res, 400, { success: false, error: "missing_id" }, cors);
    return;
  }

  const tenantDir = await resolveTenantBaseDir(ctx.rootDir, tenant, { createIfMissing: false });
  if (!tenantDir) {
    json(res, 404, { success: false, error: "tenant_not_found" }, cors);
    return;
  }

  const full = fullPathForTenantFile(tenantDir, parsed.normalized);
  if (!full) {
    json(res, 400, { success: false, error: "invalid_path" }, cors);
    return;
  }

  try {
    const out = await withFileLock(full, async () => {
      const root = await readJsonFile(full);
      const { root: next, removed } = removeArrayItemById(root, arrayKey, id);
      await writeJsonAtomic(full, next);
      return { next, removed };
    });
    json(res, 200, { success: true, data: { removed: out.removed, file: out.next } }, cors);
  } catch (err) {
    const pub = toPublicError(err);
    json(res, pub.status, { success: false, error: pub.error }, cors);
  }
}

export const handlers = {
  getJson,
  putJson,
  upsertArrayItem,
  removeArrayItem,
};

