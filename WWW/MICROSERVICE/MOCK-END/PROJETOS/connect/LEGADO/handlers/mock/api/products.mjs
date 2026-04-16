import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveProjectEnv } from "../../../../../lib/env.mjs";
import { json } from "../../../../../lib/response.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, "all_products.json");

let productsCache = null;

async function loadProducts() {
  if (productsCache) return productsCache;
  let raw = "[]";
  try {
    raw = await fs.readFile(DATA_FILE, "utf8");
  } catch (err) {
    process.stderr.write(
      `[mock-end] mock/products não conseguiu ler arquivo (${DATA_FILE}): ${String(err?.message ?? err)}\n`
    );
  }

  let parsed = [];
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `[mock-end] mock/products JSON inválido (${DATA_FILE}): ${String(err?.message ?? err)}\n`
    );
    parsed = [];
  }

  productsCache = Array.isArray(parsed) ? parsed : [];
  return productsCache;
}

async function getIdIntegradora(ctx) {
  const qp = new URLSearchParams(ctx.url?.search ?? "");
  const fromQuery = qp.get("idIntegradora");
  if (fromQuery) {
    const n = Number.parseInt(fromQuery, 10);
    if (Number.isFinite(n)) return n;
  }

  const projectDir = ctx.projectDir ?? null;
  if (!projectDir) return null;

  const env = await resolveProjectEnv({ projectDir, fallback: {} });
  const fallbackId = String(env.IDINTEGRADORA ?? env.ID_INTEGRADORA ?? "").trim();
  if (!fallbackId) return null;

  const n = Number.parseInt(fallbackId, 10);
  return Number.isFinite(n) ? n : null;
}

function ensureGet(req, res, cors) {
  if (String(req.method ?? "").toUpperCase() === "GET") return true;
  json(res, 405, { error: "method_not_allowed" }, cors);
  return false;
}

async function list(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const idIntegradora = await getIdIntegradora(ctx);
  const all = await loadProducts();
  const data =
    idIntegradora == null ? all : all.filter((p) => Number(p?.idIntegradora) === idIntegradora);

  json(res, 200, { success: true, data, total: data.length }, cors);
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

  const idIntegradora = await getIdIntegradora(ctx);
  const all = await loadProducts();
  const found = all.find((p) => {
    if (Number(p?.codProd) !== codProd) return false;
    if (idIntegradora == null) return true;
    return Number(p?.idIntegradora) === idIntegradora;
  });

  if (!found) {
    json(res, 404, { success: false, message: "not_found" }, cors);
    return;
  }

  json(res, 200, { success: true, data: found }, cors);
}

export const handlers = {
  list,
  detail,
};
