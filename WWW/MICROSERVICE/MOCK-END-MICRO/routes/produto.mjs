import path from "node:path";
import { pathToFileURL } from "node:url";

import { json } from "../lib/response.mjs";

function routeMatch(route, method, pathname) {
  if (!route) return null;
  if (String(route.method ?? "").toUpperCase() !== String(method ?? "").toUpperCase()) {
    return null;
  }
  const uri = String(route.uri ?? "");
  if (!uri) return null;
  if (uri.endsWith("*")) {
    const base = uri.slice(0, -1);
    if (!pathname.startsWith(base)) return null;
    const splat = pathname.slice(base.length).replace(/^\/+/, "");
    return { params: splat ? { splat } : {} };
  }

  if (!uri.includes(":")) return pathname === uri ? { params: {} } : null;

  const uriParts = uri.split("/").filter(Boolean);
  const pathParts = String(pathname ?? "").split("/").filter(Boolean);
  if (uriParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < uriParts.length; i++) {
    const expected = uriParts[i];
    const actual = pathParts[i];
    if (expected.startsWith(":")) {
      const key = expected.slice(1);
      if (!key) return null;
      params[key] = actual;
      continue;
    }
    if (expected !== actual) return null;
  }

  return { params };
}

async function notImplemented(res, cors) {
  json(res, 501, { success: false, message: "not_implemented" }, cors);
}

const ROUTES_CACHE = new Map();
async function loadProjectRoutes(projectDir) {
  if (ROUTES_CACHE.has(projectDir)) return ROUTES_CACHE.get(projectDir);
  const filePath = path.join(projectDir, "routes.mjs");
  try {
    const mod = await import(pathToFileURL(filePath).href);
    const routes = Array.isArray(mod?.routes) ? mod.routes : null;
    const out = routes ? { filePath, routes } : null;
    if (out) ROUTES_CACHE.set(projectDir, out);
    return out;
  } catch {
    return null;
  }
}

const HANDLER_MODULE_CACHE = new Map();
function resolveHandlerPath(projectDir, handlerClass) {
  const raw = String(handlerClass ?? "").trim().replace(/^\/+/, "");
  if (!raw) return null;
  const parts = raw.split("/").filter(Boolean);
  if (!parts.length) return null;
  if (parts.some((p) => p === "." || p === "..")) return null;
  return path.join(projectDir, "handlers", ...parts) + ".mjs";
}

async function loadHandlerModule(projectDir, handlerClass) {
  const filePath = resolveHandlerPath(projectDir, handlerClass);
  if (!filePath) return null;
  if (HANDLER_MODULE_CACHE.has(filePath)) return HANDLER_MODULE_CACHE.get(filePath);
  try {
    const mod = await import(pathToFileURL(filePath).href);
    if (mod) HANDLER_MODULE_CACHE.set(filePath, mod);
    return mod ?? null;
  } catch {
    return null;
  }
}

export async function handleProduto(req, res, ctx) {
  const { cors, pathname, rootDir } = ctx;
  const produtoName = String(ctx?.produtoName ?? "connect").trim();
  const projectDir = path.join(rootDir, "PRODUTO", produtoName);

  if (!pathname.startsWith("/connect/")) return false;
  const upstreamPath = pathname.slice("/connect".length) || "/";

  const projectRoutes = await loadProjectRoutes(projectDir);
  const routes = Array.isArray(projectRoutes?.routes) ? projectRoutes.routes : null;
  if (!routes) return false;

  let route = null;
  let params = {};
  for (const r of routes) {
    const m = routeMatch(r, req.method, upstreamPath);
    if (!m) continue;
    route = r;
    params = m.params ?? {};
    break;
  }
  if (!route) {
    json(res, 404, { error: "not_found" }, cors);
    return true;
  }

  const handlerClass = String(route?.handler_class ?? "");
  const handlerFunction = String(route?.handler_function ?? "");
  if (!handlerClass || !handlerFunction) {
    await notImplemented(res, cors);
    return true;
  }

  const mod = await loadHandlerModule(projectDir, handlerClass);
  const handlers = mod?.handlers && typeof mod.handlers === "object" ? mod.handlers : null;
  const fn = handlers?.[handlerFunction];
  if (typeof fn !== "function") {
    await notImplemented(res, cors);
    return true;
  }

  await fn(req, res, {
    ...ctx,
    projectDir,
    routeParams: params,
    pathname: upstreamPath,
  });
  return true;
}
