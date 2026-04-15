import { json } from "../../../../../lib/response.mjs";

import { ProdutosController } from "./ProdutosController.mjs";

function ensureGet(req, res, cors) {
  if (String(req.method ?? "").toUpperCase() === "GET") return true;
  json(res, 405, { error: "method_not_allowed" }, cors);
  return false;
}

function parseIntParam(value) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function parsePathParam(ctx, prefix) {
  const raw = String(ctx?.upstreamPath ?? ctx?.url?.pathname ?? "");
  const idx = raw.indexOf(prefix);
  if (idx < 0) return "";
  return raw.slice(idx + prefix.length).replace(/^\/+/, "");
}

const controller = new ProdutosController();

async function categorias(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const data = await controller.categorias();
  json(res, 200, { success: true, data }, cors);
}

async function categoriaById(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const idFromPath = parsePathParam(
    ctx,
    "/Servidor/webservice/integration/produtos/categorias"
  );
  const idCategoria = parseIntParam(ctx?.routeParams?.idCategoria ?? idFromPath);
  if (idCategoria == null) {
    json(res, 400, { error: "idCategoria must be a valid number" }, cors);
    return;
  }

  const found = await controller.categoriaById(idCategoria);
  if (!found) {
    json(res, 404, { error: "not_found" }, cors);
    return;
  }

  json(res, 200, { success: true, data: found }, cors);
}

async function produtosByCategoria(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const idFromPath = parsePathParam(
    ctx,
    "/Servidor/webservice/integration/produtos/by-categoria"
  );
  const idCategoria = parseIntParam(ctx?.routeParams?.idCategoria ?? idFromPath);
  if (idCategoria == null) {
    json(res, 400, { error: "idCategoria must be a valid number" }, cors);
    return;
  }

  const qp = new URLSearchParams(ctx.url?.search ?? "");
  const includeDescendants = parseIntParam(qp.get("includeDescendants")) ?? 1;
  const page = parseIntParam(qp.get("page")) ?? 1;
  const pageSize = parseIntParam(qp.get("pageSize")) ?? 24;

  if (includeDescendants !== 0 && includeDescendants !== 1) {
    json(res, 400, { error: "includeDescendants must be 0 or 1" }, cors);
    return;
  }
  if (page < 1) {
    json(res, 400, { error: "page must be >= 1" }, cors);
    return;
  }
  if (pageSize < 1 || pageSize > 100) {
    json(res, 400, { error: "pageSize must be between 1 and 100" }, cors);
    return;
  }

  const result = await controller.produtosByCategoria(idCategoria, {
    includeDescendants,
    page,
    pageSize,
  });
  if (!result) {
    json(res, 404, { error: "not_found" }, cors);
    return;
  }

  json(res, 200, { success: true, ...result }, cors);
}

async function produtoById(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const idFromPath = parsePathParam(
    ctx,
    "/Servidor/webservice/integration/produtos/by-id"
  );
  const idProduto = parseIntParam(ctx?.routeParams?.idProduto ?? idFromPath);
  if (idProduto == null) {
    json(res, 400, { error: "idProduto must be a valid number" }, cors);
    return;
  }

  const found = await controller.produtoById(idProduto);
  if (!found) {
    json(res, 404, { error: "not_found" }, cors);
    return;
  }

  json(res, 200, { success: true, data: found }, cors);
}

async function produtoBySlug(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const slugFromPath = parsePathParam(
    ctx,
    "/Servidor/webservice/integration/produtos/by-slug"
  );
  const slug = String(ctx?.routeParams?.slug ?? slugFromPath ?? "").trim();
  if (!slug) {
    json(res, 400, { error: "slug is required" }, cors);
    return;
  }

  const found = await controller.produtoBySlug(slug);
  if (!found) {
    json(res, 404, { error: "not_found" }, cors);
    return;
  }

  json(res, 200, { success: true, data: found }, cors);
}

export const handlers = {
  categorias,
  categoriaById,
  produtosByCategoria,
  produtoById,
  produtoBySlug,
};
