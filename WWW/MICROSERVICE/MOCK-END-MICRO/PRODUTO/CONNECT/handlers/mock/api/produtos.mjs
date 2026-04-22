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

function maskAuthorization(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "(empty)";
  if (raw.length <= 16) return `${raw.slice(0, 4)}...(${raw.length})`;
  return `${raw.slice(0, 8)}...${raw.slice(-4)} (${raw.length})`;
}

const controller = new ProdutosController();

async function categorias(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const authMasked = maskAuthorization(req?.headers?.authorization);
  process.stdout.write(`[mock-end][produtos][categorias] authorization=${authMasked}\n`);

  const data = await controller.categorias();
  json(res, 200, { success: true, data }, cors);
}

async function categoriaById(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const idCategoria = parseIntParam(ctx?.routeParams?.idCategoria);
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

async function categoriaBySlug(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const slug = String(ctx?.routeParams?.slug ?? ctx?.routeParams?.splat ?? "").trim();
  if (!slug) {
    json(res, 400, { error: "slug is required" }, cors);
    return;
  }

  const found = await controller.categoriaBySlug(slug);
  if (!found) {
    json(res, 404, { error: "not_found" }, cors);
    return;
  }

  json(res, 200, { success: true, data: found }, cors);
}

async function produtosByCategoria(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const idCategoria = parseIntParam(ctx?.routeParams?.idCategoria);
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

  const idProduto = parseIntParam(ctx?.routeParams?.idProduto);
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

  const slug = String(ctx?.routeParams?.slug ?? "").trim();
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

async function brands(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const data = await controller.brands();
  json(res, 200, { success: true, data }, cors);
}

async function brandById(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const idBrand = parseIntParam(ctx?.routeParams?.idBrand);
  if (idBrand == null) {
    json(res, 400, { error: "idBrand must be a valid number" }, cors);
    return;
  }

  const qp = new URLSearchParams(ctx.url?.search ?? "");
  const page = parseIntParam(qp.get("page")) ?? 1;
  const pageSize = parseIntParam(qp.get("pageSize")) ?? 24;
  if (page < 1) {
    json(res, 400, { error: "page must be >= 1" }, cors);
    return;
  }
  if (pageSize < 1 || pageSize > 100) {
    json(res, 400, { error: "pageSize must be between 1 and 100" }, cors);
    return;
  }

  const result = await controller.brandById(idBrand, { page, pageSize });
  if (!result) {
    json(res, 404, { error: "not_found" }, cors);
    return;
  }

  json(res, 200, { success: true, data: result }, cors);
}

export const handlers = {
  categorias,
  categoriaById,
  categoriaBySlug,
  produtosByCategoria,
  produtoById,
  produtoBySlug,
  brands,
  brandById,
};
