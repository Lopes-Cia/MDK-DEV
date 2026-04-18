import { resolveProjectEnv } from "../../../../lib/env.mjs";
import { json } from "../../../../lib/response.mjs";
import {
  buildProxyRequestHeaders,
  filterUpstreamHeaders,
  normalizeJoin,
} from "../../../../lib/upstream-proxy.mjs";

function ensureGet(req, res, cors) {
  if (String(req.method ?? "").toUpperCase() === "GET") return true;
  json(res, 405, { error: "method_not_allowed" }, cors);
  return false;
}

async function buildSearchWithIdIntegradora(ctx) {
  const projectDir = ctx.projectDir ?? null;
  const qp = new URLSearchParams(ctx.url?.search ?? "");
  if (projectDir && !qp.get("idIntegradora")) {
    const env = await resolveProjectEnv({ projectDir, fallback: {} });
    const fallbackId = String(env.IDINTEGRADORA ?? env.ID_INTEGRADORA ?? "").trim();
    if (fallbackId) qp.set("idIntegradora", fallbackId);
  }
  return qp;
}

async function proxyToIntegration(req, res, ctx, upstreamPath, searchOverride = null) {
  const cors = ctx.cors ?? {};
  const projectDir = ctx.projectDir ?? null;
  if (!projectDir) {
    json(res, 500, { error: "proxy_not_configured", env: "INTEGRATION_URL_API" }, cors);
    return;
  }

  const env = await resolveProjectEnv({ projectDir, fallback: {} });
  const baseUrl = String(env.INTEGRATION_URL_API ?? "").trim().replace(/\/+$/, "");
  if (!baseUrl) {
    json(res, 500, { error: "proxy_not_configured", env: "INTEGRATION_URL_API" }, cors);
    return;
  }

  const search = typeof searchOverride === "string" ? searchOverride : ctx.url?.search ?? "";
  const targetUrl = normalizeJoin(baseUrl, upstreamPath, search);
  const method = String(req.method ?? "GET").toUpperCase();
  const headers = buildProxyRequestHeaders(req);

  let upstream;
  try {
    upstream = await fetch(targetUrl, { method, headers, redirect: "follow" });
  } catch (err) {
    process.stderr.write(
      `[mock-end] INTEGRATION proxy falhou (${method} ${targetUrl}): ${String(err?.message ?? err)}\n`
    );
    json(res, 502, { error: "bad_gateway" }, cors);
    return;
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  const responseHeaders = filterUpstreamHeaders(upstream.headers, cors);
  res.writeHead(upstream.status, responseHeaders);
  res.end(buf);
}

async function list(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const qp = await buildSearchWithIdIntegradora(ctx);
  const searchOverride = qp.toString() ? `?${qp.toString()}` : "";

  await proxyToIntegration(
    req,
    res,
    ctx,
    "/Servidor/webservice/integration/getListProdutoLoja",
    searchOverride
  );
}

async function detail(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const codProdRaw = String(ctx?.routeParams?.codProd ?? "").trim();
  const codProd = Number.parseInt(codProdRaw, 10);
  if (!Number.isFinite(codProd)) {
    json(res, 400, { success: false, message: "codProd must be a valid number" }, cors);
    return;
  }

  const qp = await buildSearchWithIdIntegradora(ctx);
  qp.set("codProd", String(codProd));
  const searchOverride = qp.toString() ? `?${qp.toString()}` : "";

  await proxyToIntegration(
    req,
    res,
    ctx,
    "/Servidor/webservice/integration/getProdutoLoja",
    searchOverride
  );
}

export const handlers = {
  list,
  detail,
};