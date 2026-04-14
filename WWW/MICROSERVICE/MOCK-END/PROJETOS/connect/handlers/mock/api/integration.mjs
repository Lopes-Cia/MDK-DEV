import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { json } from "../../../../../lib/response.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, "all_products.json");

let productsCache = null;

async function loadProducts() {
  if (productsCache) return productsCache;
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw);
  productsCache = Array.isArray(parsed) ? parsed : [];
  return productsCache;
}

async function listProdutoLoja(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const qp = new URLSearchParams(ctx.url?.search ?? "");
  const idIntegradora = Number.parseInt(qp.get("idIntegradora"), 10);

  const all = await loadProducts();
  const out = Number.isFinite(idIntegradora)
    ? all.filter((p) => Number(p?.idIntegradora) === idIntegradora)
    : all;

  json(res, 200, out, cors);
}

async function produtoLoja(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const qp = new URLSearchParams(ctx.url?.search ?? "");
  const idIntegradora = Number.parseInt(qp.get("idIntegradora"), 10);
  const codProd = Number.parseInt(qp.get("codProd"), 10);

  if (!Number.isFinite(codProd)) {
    json(res, 400, { error: "codProd query param is required" }, cors);
    return;
  }

  const all = await loadProducts();
  const found = all.find((p) => {
    if (Number(p?.codProd) !== codProd) return false;
    if (Number.isFinite(idIntegradora)) return Number(p?.idIntegradora) === idIntegradora;
    return true;
  });

  if (!found) {
    json(res, 404, { error: "not_found" }, cors);
    return;
  }

  json(res, 200, found, cors);
}

export const handlers = {
  listProdutoLoja,
  produtoLoja,
};

