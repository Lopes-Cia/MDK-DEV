import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { json } from "../../../../../lib/response.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, "..", "categorias.json");

let categoriasCache = null;

async function loadCategorias() {
  if (categoriasCache) return categoriasCache;

  let raw = "[]";
  try {
    raw = await fs.readFile(DATA_FILE, "utf8");
  } catch (err) {
    process.stderr.write(
      `[mock-end] mock/prod não conseguiu ler arquivo (${DATA_FILE}): ${String(err?.message ?? err)}\n`
    );
  }

  let parsed = [];
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `[mock-end] mock/prod JSON inválido (${DATA_FILE}): ${String(err?.message ?? err)}\n`
    );
    parsed = [];
  }

  categoriasCache = Array.isArray(parsed) ? parsed : [];
  return categoriasCache;
}

function ensureGet(req, res, cors) {
  if (String(req.method ?? "").toUpperCase() === "GET") return true;
  json(res, 405, { error: "method_not_allowed" }, cors);
  return false;
}

async function categoria(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const data = await loadCategorias();
  json(res, 200, data, cors);
}

export const handlers = {
  categoria,
};

