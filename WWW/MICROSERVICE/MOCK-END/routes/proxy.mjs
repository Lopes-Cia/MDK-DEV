import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { readRequestBinary } from "../lib/body.mjs";
import { resolveProjectEnv } from "../lib/env.mjs";
import { json } from "../lib/response.mjs";

// Proxy por base (AUTH e INTEGRATION).
// - Exige .env dentro de PROJETOS/<base> (sem fallback do modelo antigo).
// - Remove hop-by-hop headers e repassa Set-Cookie.
// - "redirect: follow" ao falar com upstream.
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

function resolveProxyBaseUrl(env, envKey) {
  const raw = String(env?.[envKey] ?? "").trim();
  if (!raw) return null;
  try {
    return new URL(raw).toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function buildProxyRequestHeaders(req) {
  const out = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null) continue;
    const key = String(k).toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(key)) continue;
    if (key === "origin" || key === "referer") continue;
    if (key === "accept-encoding") continue;
    out[k] = v;
  }
  out["accept-encoding"] = "identity";
  return out;
}

function normalizeJoin(baseUrl, pathname, search) {
  const base = String(baseUrl).replace(/\/+$/, "");
  const pathPart = String(pathname ?? "").startsWith("/")
    ? String(pathname ?? "")
    : `/${String(pathname ?? "")}`;
  const query = String(search ?? "");
  return `${base}${pathPart}${query}`;
}

async function proxyToUpstream(req, res, cors, targetUrl) {
  const method = String(req.method ?? "GET").toUpperCase();
  const headers = buildProxyRequestHeaders(req);

  let body;
  if (method !== "GET" && method !== "HEAD") {
    try {
      body = await readRequestBinary(req);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (message === "payload_too_large") {
        json(res, 413, { error: "payload_too_large" }, cors);
        return;
      }
      json(res, 400, { error: "invalid_body" }, cors);
      return;
    }
  }

  let upstream;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "follow",
    });
  } catch (err) {
    process.stderr.write(
      `[mock-end] Proxy falhou (${method} ${targetUrl}): ${String(err?.message ?? err)}\n`
    );
    json(res, 502, { error: "bad_gateway" }, cors);
    return;
  }

  const upstreamHeaders = {};
  let setCookies = [];
  for (const [k, v] of upstream.headers) {
    const key = String(k).toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(key)) continue;
    if (key === "set-cookie") continue;
    upstreamHeaders[k] = v;
  }

  if (typeof upstream.headers.getSetCookie === "function") {
    setCookies = upstream.headers.getSetCookie();
  } else {
    const single = upstream.headers.get("set-cookie");
    if (single) setCookies = [single];
  }

  const finalHeaders = {
    ...upstreamHeaders,
    ...cors,
  };
  if (setCookies.length) finalHeaders["Set-Cookie"] = setCookies;

  const buf = Buffer.from(await upstream.arrayBuffer());
  res.writeHead(upstream.status, finalHeaders);
  res.end(buf);
}

function matchProxyTarget(pathname) {
  const p = String(pathname ?? "");

  // Bases suportadas:
  // - /ApiLopes/webservice/api/*  -> AUTH_BASE_URL
  // - /connect/*                 -> INTEGRATION_URL_API
  const AUTH_BASE_PREFIX = "/ApiLopes/webservice/api";
  const INTEGRATION_BASE_PREFIX = "/connect";

  if (p === AUTH_BASE_PREFIX || p.startsWith(`${AUTH_BASE_PREFIX}/`)) {
    const remainder = p.slice(AUTH_BASE_PREFIX.length) || "/";
    return { envKey: "AUTH_BASE_URL", upstreamPath: remainder };
  }

  if (p === INTEGRATION_BASE_PREFIX || p.startsWith(`${INTEGRATION_BASE_PREFIX}/`)) {
    const remainder = p.slice(INTEGRATION_BASE_PREFIX.length) || "/";
    return { envKey: "INTEGRATION_URL_API", upstreamPath: remainder };
  }

  return null;
}

function routeMatches(route, method, pathname) {
  if (!route) return false;
  if (String(route.method ?? "").toUpperCase() !== String(method ?? "").toUpperCase()) {
    return false;
  }
  const uri = String(route.uri ?? "");
  if (!uri) return false;
  if (uri.endsWith("*")) return pathname.startsWith(uri.slice(0, -1));
  return pathname === uri;
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

export async function handleProxy(req, res, ctx) {
  const { cors, url, pathname, rootDir, projectDir, basePrefix } = ctx;
  const match = matchProxyTarget(pathname);
  if (!match) return false;

  // O projectDir normalmente vem de lib/project.mjs.
  // Para o proxy por base, ele precisa apontar para PROJETOS/<base> correspondente.
  const effectiveProjectDir =
    projectDir ??
    (basePrefix
      ? path.join(rootDir, "PROJETOS", ...String(basePrefix).split("/").filter(Boolean))
      : null);

  if (!effectiveProjectDir) {
    json(res, 500, { error: "proxy_not_configured", env: match.envKey }, cors);
    return true;
  }

  try {
    await fs.access(path.join(effectiveProjectDir, ".env"));
  } catch {
    json(res, 500, { error: "proxy_not_configured", env: match.envKey }, cors);
    return true;
  }

  const env = await resolveProjectEnv({
    projectDir: effectiveProjectDir,
    fallback: {},
  });

  const upstreamBaseUrl = resolveProxyBaseUrl(env, match.envKey);
  if (!upstreamBaseUrl) {
    json(res, 500, { error: "proxy_not_configured", env: match.envKey }, cors);
    return true;
  }

  const targetUrl = normalizeJoin(upstreamBaseUrl, match.upstreamPath, url.search);

  if (match.envKey === "AUTH_BASE_URL") {
    // AUTH base usa o mesmo modelo claro de roteamento: routes.mjs + handlers.
    // O match é feito contra o "upstreamPath" (ex.: /tokenService).
    const routes = Array.isArray(ctx.projectRoutes) ? ctx.projectRoutes : null;
    const route = routes?.find((r) => routeMatches(r, req.method, match.upstreamPath)) ?? null;
    if (!route) {
      json(res, 404, { error: "not_found" }, cors);
      return true;
    }

    const mode = String(route?.execution?.mode ?? "original");
    if (mode !== "original") {
      json(res, 501, { success: false, message: "not_implemented" }, cors);
      return true;
    }

    const handlerClass = String(route?.handler_class ?? "");
    const handlerFunction = String(route?.handler_function ?? "");
    if (!handlerClass || !handlerFunction) {
      json(res, 501, { success: false, message: "not_implemented" }, cors);
      return true;
    }

    const mod = await loadHandlerModule(effectiveProjectDir, handlerClass);
    const handlers = mod?.handlers && typeof mod.handlers === "object" ? mod.handlers : null;
    const fn = handlers?.[handlerFunction];
    if (typeof fn !== "function") {
      json(res, 501, { success: false, message: "not_implemented" }, cors);
      return true;
    }

    ctx.projectEnv = env;
    await fn(req, res, ctx);
    return true;
  }

  // INTEGRATION base ("/connect/*"):
  // - Por padrão continua sendo proxy cego para o upstream (compatível com hoje).
  // - Se existir rota declarada em PROJETOS/connect/routes.mjs para o upstreamPath,
  //   usa o execution.mode para escolher entre handler original/mock/hybrid.
  const isIntegrationPrefix = match.upstreamPath.startsWith("/Servidor/webservice/integration/");
  const routes = Array.isArray(ctx.projectRoutes) ? ctx.projectRoutes : null;
  const route =
    isIntegrationPrefix && routes
      ? routes.find((r) => routeMatches(r, req.method, match.upstreamPath)) ?? null
      : null;

  if (!route) {
    await proxyToUpstream(req, res, cors, targetUrl);
    return true;
  }

  const authMode = String(route?.auth?.mode ?? "").trim().toLowerCase();
  if (authMode === "required") {
    const authHeader = String(req?.headers?.authorization ?? "").trim();
    if (!authHeader) {
      json(res, 401, { success: false, message: "unauthorized" }, cors);
      return true;
    }
  }

  const mode = String(route?.execution?.mode ?? "original");
  const handlerClassBase = String(route?.handler_class ?? "");
  const handlerFunction = String(route?.handler_function ?? "");
  if (!handlerClassBase || !handlerFunction) {
    json(res, 501, { success: false, message: "not_implemented" }, cors);
    return true;
  }

  let handlerClassToUse = null;
  if (mode === "original") {
    handlerClassToUse = handlerClassBase;
  } else if (mode === "mock" || mode === "hybrid") {
    handlerClassToUse = `mock/${handlerClassBase}`;
  } else {
    json(res, 501, { success: false, message: "not_implemented" }, cors);
    return true;
  }

  // Disponibiliza no ctx o targetUrl do upstream para o handler "original" (se usado).
  ctx.projectEnv = env;
  ctx.upstreamTargetUrl = targetUrl;

  // Hybrid (por enquanto): dispara a chamada original (GET) em background e responde com o mock.
  if (mode === "hybrid") {
    const method = String(req.method ?? "GET").toUpperCase();
    if (method === "GET") {
      const headers = buildProxyRequestHeaders(req);
      fetch(targetUrl, { method, headers, redirect: "follow" }).catch(() => null);
    }
  }

  const mod = await loadHandlerModule(effectiveProjectDir, handlerClassToUse);
  const handlers = mod?.handlers && typeof mod.handlers === "object" ? mod.handlers : null;
  const fn = handlers?.[handlerFunction];
  if (typeof fn !== "function") {
    json(res, 501, { success: false, message: "not_implemented" }, cors);
    return true;
  }

  await fn(req, res, ctx);
  return true;
}
