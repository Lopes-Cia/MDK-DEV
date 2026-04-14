import fs from "node:fs/promises";
import path from "node:path";

import { readJsonFile } from "./fs-json.mjs";

export function normalizeTenant(tenant) {
  return String(tenant ?? "").trim();
}

export async function listTenants(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const candidates = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const tenants = [];
  for (const name of candidates) {
    try {
      const catalogDir = path.join(rootDir, name, "CATALOGO");
      await fs.access(path.join(catalogDir, "categorias.json"));
      await fs.access(path.join(catalogDir, "produtos.json"));
      tenants.push(name);
    } catch {
      continue;
    }
  }
  return tenants;
}

export async function ensureTenant(rootDir, tenant) {
  const t = normalizeTenant(tenant);
  if (!t) return null;
  const tenants = await listTenants(rootDir);
  if (!tenants.includes(t)) return null;
  return t;
}

export async function readCatalogList(rootDir, tenant, fileName) {
  const base = path.join(rootDir, tenant, "CATALOGO");
  const fullPath = path.join(base, fileName);
  return await readJsonFile(fullPath);
}

export const ALLOWED_JSON_ROOT_DIRS = new Set([
  "CATALOGO",
  "THEMA",
  "COPY",
  "CONTEXTO",
  "BUILDER",
  "BLUEPRINT",
  "COMMERCE",
]);

export function resolveTenantJsonPath(rootDir, tenant, relPath) {
  const base = path.resolve(rootDir, tenant);
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

export function resolveTenantAssetPath(rootDir, tenant, relPath) {
  const base = path.resolve(rootDir, tenant);
  const raw = String(relPath ?? "");
  if (!raw || raw.includes("\0")) return null;
  if (path.isAbsolute(raw)) return null;
  const normalized = raw.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized.startsWith("THEMA/assets/images/")) return null;
  const ext = path.extname(normalized).toLowerCase();
  const allowedExts = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg"]);
  if (!allowedExts.has(ext)) return null;
  const full = path.resolve(base, normalized);
  if (!full.startsWith(base + path.sep)) return null;
  return full;
}

export async function listJsonFiles(rootDir, tenant, relDir) {
  const base = path.resolve(rootDir, tenant);
  const raw = String(relDir ?? "");
  if (!raw || raw.includes("\0")) return null;
  if (path.isAbsolute(raw)) return null;
  const normalized = raw
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
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
