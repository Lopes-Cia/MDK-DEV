import path from "node:path";
import { pathToFileURL } from "node:url";

import { json } from "../lib/response.mjs";

// Dispatcher de rotas internas do Connect (/api/*).
// Ele lê as rotas declarativas em PROJETOS/connect/routes.mjs e executa handlers
// em PROJETOS/connect/handlers/<handler_class>.mjs (handlers[handler_function]).
function routeMatch(route, method, pathname) {
  if (!route) return null;
  if (String(route.method ?? "").toUpperCase() !== String(method ?? "").toUpperCase()) {
    return null;
  }
  const uri = String(route.uri ?? "");
  if (!uri) return null;
  if (uri.endsWith("*")) return pathname.startsWith(uri.slice(0, -1)) ? { params: {} } : null;

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

const HANDLER_MODULE_CACHE = new Map();

function resolveHandlerPath(projectDir, handlerClass) {
  // Evita traversal e mantém o "handler_class" como caminho relativo simples.
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

export async function handleConnect(req, res, ctx) {
  const { cors, pathname } = ctx;
  const routes = Array.isArray(ctx.projectRoutes) ? ctx.projectRoutes : null;
  if (!routes) return false;

  // O match é feito contra o pathname original (/api/...).
  let route = null;
  let params = {};
  for (const r of routes) {
    const m = routeMatch(r, req.method, pathname);
    if (!m) continue;
    route = r;
    params = m.params ?? {};
    break;
  }
  if (!route) return false;
  ctx.routeParams = params;

  // No momento só "original" é executado. "mock/hybrid" voltam 501.
  const mode = String(route?.execution?.mode ?? "original");
  if (mode !== "original") {
    await notImplemented(res, cors);
    return true;
  }

  const handlerClass = String(route?.handler_class ?? "");
  const handlerFunction = String(route?.handler_function ?? "");
  if (!handlerClass || !handlerFunction) {
    await notImplemented(res, cors);
    return true;
  }

  const projectDir = ctx.projectDir;
  if (!projectDir) {
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

  await fn(req, res, ctx);
  return true;
}
