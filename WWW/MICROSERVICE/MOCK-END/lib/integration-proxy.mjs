import { resolveProjectEnv } from "./env.mjs";
import { json } from "./response.mjs";
import { normalizeJoin, proxyToUpstream } from "./upstream-proxy.mjs";

export async function buildSearchWithIdIntegradora(ctx) {
  const projectDir = ctx.projectDir ?? null;
  const qp = new URLSearchParams(ctx.url?.search ?? "");
  if (projectDir && !qp.get("idIntegradora")) {
    const env = await resolveProjectEnv({ projectDir, fallback: {} });
    const fallbackId = String(env.IDINTEGRADORA ?? env.ID_INTEGRADORA ?? "").trim();
    if (fallbackId) qp.set("idIntegradora", fallbackId);
  }
  return qp;
}

export async function proxyToIntegration(req, res, ctx, upstreamPath, searchOverride = null) {
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
  await proxyToUpstream(req, res, cors, targetUrl);
}

