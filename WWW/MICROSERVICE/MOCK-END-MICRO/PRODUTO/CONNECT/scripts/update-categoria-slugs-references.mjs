import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd());

const categoriasPath = path.join(
  ROOT,
  "WWW",
  "MICROSERVICE",
  "MOCK-END",
  "PROJETOS",
  "connect",
  "handlers",
  "mock",
  "categorias.json"
);

const produtosPath = path.join(
  ROOT,
  "WWW",
  "MICROSERVICE",
  "MOCK-END",
  "PROJETOS",
  "connect",
  "handlers",
  "mock",
  "produtos.json"
);

const colectionsPath = path.join(
  ROOT,
  "WWW",
  "MICROSERVICE",
  "MOCK-END",
  "PROJETOS",
  "connect",
  "handlers",
  "mock",
  "colections.json"
);

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeJson(filePath, value) {
  const out = `${JSON.stringify(value, null, 2)}\n`;
  await fs.writeFile(filePath, out, "utf8");
}

function toInt(value) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function buildCategoriaSlugIndex(categorias) {
  const map = new Map();
  for (const c of categorias) {
    const id = toInt(c?.id);
    if (id == null) continue;
    const slug = String(c?.slug ?? "").trim();
    if (!slug) continue;
    map.set(id, slug);
  }
  return map;
}

function updateSlugsRecursively(value, slugByCategoriaId) {
  if (Array.isArray(value)) {
    for (const item of value) updateSlugsRecursively(item, slugByCategoriaId);
    return;
  }

  if (!value || typeof value !== "object") return;

  const record = value;
  const id = toInt(record.id);
  if (id != null && typeof record.slug === "string" && slugByCategoriaId.has(id)) {
    const currentSlug = String(record.slug ?? "");
    if (currentSlug.startsWith("/categoria/")) {
      record.slug = slugByCategoriaId.get(id);
    }
  }

  for (const key of Object.keys(record)) {
    updateSlugsRecursively(record[key], slugByCategoriaId);
  }
}

async function main() {
  const categorias = await readJson(categoriasPath);
  if (!Array.isArray(categorias)) {
    throw new Error("categorias.json deve ser um array");
  }

  const slugByCategoriaId = buildCategoriaSlugIndex(categorias);

  const produtos = await readJson(produtosPath);
  updateSlugsRecursively(produtos, slugByCategoriaId);
  await writeJson(produtosPath, produtos);

  const colections = await readJson(colectionsPath);
  updateSlugsRecursively(colections, slugByCategoriaId);
  await writeJson(colectionsPath, colections);
}

main().catch((err) => {
  process.stderr.write(`[update-categoria-slugs-references] ${String(err?.stack ?? err)}\n`);
  process.exitCode = 1;
});

