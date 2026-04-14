import fs from "node:fs/promises";
import path from "node:path";

import { readRequestBinary, readRequestJson } from "../../lib/body.mjs";
import { isRecord, readJsonFile } from "../lib/fs-json.mjs";
import { json } from "../../lib/response.mjs";
import {
  ensureTenant,
  listJsonFiles,
  readCatalogList,
  resolveTenantAssetPath,
  resolveTenantJsonPath,
} from "../lib/tenants.mjs";

export async function handleTenant(req, res, ctx) {
  const { cors, url, pathname, rootDir } = ctx;

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 3) return false;

  const [api, marker, tenantRaw, scope, resource, slug] = parts;
  if (api !== "api" || marker !== "tenant") return false;

  const tenant = await ensureTenant(rootDir, tenantRaw);
  if (!tenant) {
    json(res, 404, { error: "tenant_not_found" }, cors);
    return true;
  }

  try {
    if (scope === "json") {
      const action = resource;
      if (req.method === "GET" && action === "list") {
        const dir = url.searchParams.get("dir");
        let files;
        try {
          files = await listJsonFiles(rootDir, tenant, dir);
        } catch (err) {
          if (err?.code === "ENOENT") {
            json(res, 404, { error: "not_found", tenant, dir }, cors);
            return true;
          }
          throw err;
        }
        if (!files) {
          json(res, 400, { error: "invalid_dir" }, cors);
          return true;
        }
        json(res, 200, { ok: true, tenant, dir, files }, cors);
        return true;
      }

      if (req.method === "GET" && !action) {
        const relPath = url.searchParams.get("path");
        const filePath = resolveTenantJsonPath(rootDir, tenant, relPath);
        if (!filePath) {
          json(res, 400, { error: "invalid_path" }, cors);
          return true;
        }
        try {
          const data = await readJsonFile(filePath);
          json(res, 200, { ok: true, tenant, path: relPath, data }, cors);
        } catch (err) {
          if (err?.code === "ENOENT") {
            json(res, 404, { error: "not_found", tenant, path: relPath }, cors);
            return true;
          }
          throw err;
        }
        return true;
      }

      if (req.method === "PUT" && !action) {
        const relPath = url.searchParams.get("path");
        const filePath = resolveTenantJsonPath(rootDir, tenant, relPath);
        if (!filePath) {
          json(res, 400, { error: "invalid_path" }, cors);
          return true;
        }
        const body = await readRequestJson(req);
        if (!isRecord(body) && !Array.isArray(body)) {
          json(res, 400, { error: "invalid_json_root" }, cors);
          return true;
        }
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(body, null, 2) + "\n", "utf8");
        json(res, 200, { ok: true, tenant, path: relPath }, cors);
        return true;
      }

      if (req.method === "DELETE" && !action) {
        const relPath = url.searchParams.get("path");
        const filePath = resolveTenantJsonPath(rootDir, tenant, relPath);
        if (!filePath) {
          json(res, 400, { error: "invalid_path" }, cors);
          return true;
        }
        await fs.rm(filePath, { force: true });
        json(res, 200, { ok: true, tenant, path: relPath }, cors);
        return true;
      }

      json(res, 405, { error: "method_not_allowed" }, cors);
      return true;
    }

    if (scope === "assets") {
      const relPath = url.searchParams.get("path");
      const filePath = resolveTenantAssetPath(rootDir, tenant, relPath);

      if (!filePath) {
        json(res, 400, { error: "invalid_path" }, cors);
        return true;
      }

      if (req.method === "PUT") {
        const body = await readRequestBinary(req);
        if (!body || body.length === 0) {
          json(res, 400, { error: "empty_payload" }, cors);
          return true;
        }
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, body);
        json(res, 200, { ok: true, tenant, path: relPath, size: body.length }, cors);
        return true;
      }

      if (req.method === "DELETE") {
        await fs.rm(filePath, { force: true });
        json(res, 200, { ok: true, tenant, path: relPath }, cors);
        return true;
      }

      json(res, 405, { error: "method_not_allowed" }, cors);
      return true;
    }

    if (scope !== "catalogo") {
      json(res, 404, { error: "not_found" }, cors);
      return true;
    }

    if (resource === "categorias") {
      if (req.method !== "GET") {
        json(res, 405, { error: "method_not_allowed" }, cors);
        return true;
      }
      const categories = await readCatalogList(rootDir, tenant, "categorias.json");
      if (!slug) {
        json(res, 200, categories, cors);
        return true;
      }
      const item = Array.isArray(categories) ? categories.find((c) => c?.slug === slug) : null;
      if (!item) {
        json(res, 404, { error: "slug_not_found" }, cors);
        return true;
      }
      json(res, 200, item, cors);
      return true;
    }

    if (resource === "produtos") {
      if (req.method !== "GET") {
        json(res, 405, { error: "method_not_allowed" }, cors);
        return true;
      }
      const products = await readCatalogList(rootDir, tenant, "produtos.json");
      if (!slug) {
        json(res, 200, products, cors);
        return true;
      }
      const item = Array.isArray(products) ? products.find((p) => p?.slug === slug) : null;
      if (!item) {
        json(res, 404, { error: "slug_not_found" }, cors);
        return true;
      }
      json(res, 200, item, cors);
      return true;
    }

    json(res, 404, { error: "not_found" }, cors);
    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "payload_too_large") {
      json(res, 413, { error: "payload_too_large" }, cors);
      return true;
    }
    if (message.includes("JSON")) {
      json(res, 400, { error: "invalid_json" }, cors);
      return true;
    }
    json(res, 500, { error: "internal_error" }, cors);
    return true;
  }
}
