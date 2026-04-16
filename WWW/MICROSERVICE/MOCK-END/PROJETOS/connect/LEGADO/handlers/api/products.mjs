import { json } from "../../../../lib/response.mjs";
import {
  buildSearchWithIdIntegradora as buildSearchWithIdIntegradoraShared,
  proxyToIntegration as proxyToIntegrationShared,
} from "../../../../lib/integration-proxy.mjs";

function ensureGet(req, res, cors) {
  if (String(req.method ?? "").toUpperCase() === "GET") return true;
  json(res, 405, { error: "method_not_allowed" }, cors);
  return false;
}

async function buildSearchWithIdIntegradora(ctx) {
  return buildSearchWithIdIntegradoraShared(ctx);
}

async function proxyToIntegration(req, res, ctx, upstreamPath, searchOverride = null) {
  return proxyToIntegrationShared(req, res, ctx, upstreamPath, searchOverride);
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
