import { json } from "../../../../../lib/response.mjs";
import { normalizeJoin, proxyToUpstream } from "../../../../../lib/upstream-proxy.mjs";

async function proxyAuth(req, res, ctx, upstreamPath) {
  const cors = ctx.cors ?? {};
  const env = ctx.projectEnv ?? {};
  const baseUrl = String(env.AUTH_BASE_URL ?? "").trim();
  if (!baseUrl) {
    json(res, 500, { error: "proxy_not_configured", env: "AUTH_BASE_URL" }, cors);
    return;
  }
  const targetUrl = normalizeJoin(baseUrl, upstreamPath, ctx.url?.search ?? "");
  await proxyToUpstream(req, res, cors, targetUrl);
}

async function tokenService(req, res, ctx) {
  await proxyAuth(req, res, ctx, "/tokenService");
}

async function postAutenteicaAplicativo(req, res, ctx) {
  await proxyAuth(req, res, ctx, "/postAutenteicaAplicativo");
}

async function enviarToken(req, res, ctx) {
  await proxyAuth(req, res, ctx, "/enviarToken");
}

async function verificarTokenSistema(req, res, ctx) {
  await proxyAuth(req, res, ctx, "/verificarTokenSistema");
}

async function getOperadorSistemaForId(req, res, ctx) {
  await proxyAuth(req, res, ctx, "/getOperadorSistemaForId");
}

export const handlers = {
  tokenService,
  postAutenteicaAplicativo,
  enviarToken,
  verificarTokenSistema,
  getOperadorSistemaForId,
};
