import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { json } from "../lib/response.mjs";
import { handleProxy } from "./proxy.mjs";
import { handleConnect } from "./connect.mjs";
import { handleStorageImages } from "./storage-images.mjs";

// Roteador principal do microservice.
// - Define qual "projeto/base" está ativo (ctx.projectDir).
// - Carrega o catálogo de rotas do projeto (PROJETOS/<base>/routes.mjs).
// - Encaminha para proxy (upstream) e para rotas internas do Connect (/api/*).
const PROJECT_ROUTES_CACHE = new Map();

async function loadProjectRoutes(ctx) {
  const projectDir = ctx?.projectDir;
  if (!projectDir) return null;
  if (PROJECT_ROUTES_CACHE.has(projectDir)) return PROJECT_ROUTES_CACHE.get(projectDir);

  const filePath = path.join(projectDir, "routes.mjs");
  try {
    await fs.access(filePath);
  } catch {
    return null;
  }

  try {
    const mod = await import(pathToFileURL(filePath).href);
    const routes = Array.isArray(mod?.routes) ? mod.routes : null;
    const out = routes ? { filePath, routes } : null;
    if (out) PROJECT_ROUTES_CACHE.set(projectDir, out);
    return out;
  } catch {
    return null;
  }
}

export async function handleRoutes(req, res, ctx) {
  const { cors, pathname } = ctx;

  // Storage seguro para assets de imagens (usado pelo TRATAMENTO-IMAGENS).
  // Mantém acesso restrito por tenant e proteção contra traversal.
  const handledStorage = await handleStorageImages(req, res, ctx);
  if (handledStorage) return true;

  // Rotas internas do Connect são atendidas pelo projeto "connect".
  // As rotas são declaradas em PROJETOS/connect/routes.mjs e executadas via handlers.
  if (!ctx.projectDir && pathname.startsWith("/api/")) {
    ctx.projectDir = path.join(ctx.rootDir, "PROJETOS", "connect");
  }

  const projectRoutes = await loadProjectRoutes(ctx);
  ctx.projectRoutesFile = projectRoutes?.filePath ?? null;
  ctx.projectRoutes = projectRoutes?.routes ?? null;

  // Proxy por base (AUTH/INTEGRATION).
  const handledProxy = await handleProxy(req, res, ctx);
  if (handledProxy) return true;

  // Rotas internas (/api/*), guiadas por PROJETOS/connect/routes.mjs.
  const handledConnect = await handleConnect(req, res, ctx);
  if (handledConnect) return true;

  if (pathname === "/health") {
    json(res, 200, { ok: true }, cors);
    return true;
  }

  return false;
}
