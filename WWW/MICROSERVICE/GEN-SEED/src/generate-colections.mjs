import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseArgs(argv) {
  const out = {};
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith("--")) continue;
    const [k, ...rest] = raw.slice(2).split("=");
    const v = rest.length ? rest.join("=") : "1";
    out[k] = v;
  }
  return out;
}

function hash32(input) {
  const s = String(input ?? "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rnd() {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function pickUnique(items, count, seedKey) {
  const rnd = mulberry32(hash32(seedKey));
  const idx = items.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = idx[i];
    idx[i] = idx[j];
    idx[j] = tmp;
  }
  return idx.slice(0, Math.min(count, idx.length)).map((i) => items[i]);
}

function listBannerFiles(bannersDir) {
  if (!fs.existsSync(bannersDir)) return [];
  const exts = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
  return fs
    .readdirSync(bannersDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((n) => exts.has(path.extname(n).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

function main() {
  const args = parseArgs(process.argv);
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const projectDir = path.resolve(__dirname, "..");
  const dataDir = path.resolve(projectDir, "data");

  const categoriasFile = path.resolve(dataDir, args.categoriasFile || "categorias.json");
  const produtosFile = path.resolve(dataDir, args.produtosFile || "produtos.json");
  const outFile = path.resolve(dataDir, args.outFile || "colections.json");
  const tenant = String(args.tenant || "adega-lopes");

  const bannersDir = path.resolve(
    projectDir,
    "..",
    "MOCK-END",
    "PROJETOS",
    "connect",
    "handlers",
    "mock",
    "assets",
    "images",
    "banners",
  );

  const assetsBaseUrl = String(args.assetsBaseUrl || "http://localhost:4000/assets/images");

  const categorias = readJson(categoriasFile);
  const produtos = readJson(produtosFile);
  assert(Array.isArray(categorias), "categorias.json inválido: esperado array");
  assert(Array.isArray(produtos), "produtos.json inválido: esperado array");

  const categoriasFilhoOuNeto = categorias.filter((c) => Number(c?.parentId) !== 0);
  assert(categoriasFilhoOuNeto.length >= 8, "categorias insuficientes para categorias_destaque (mín: 8)");
  assert(produtos.length >= 20, "produtos insuficientes para produtos_promocao (mín: 20)");

  const bannerFiles = listBannerFiles(bannersDir);
  const banners_1 = bannerFiles.map((file, idx) => ({
    id: idx + 1,
    image: `${assetsBaseUrl}/banners/${file}`,
    link: "",
  }));

  const categorias_destaque = pickUnique(categoriasFilhoOuNeto, 8, `home:categorias_destaque:${tenant}`);
  const produtos_maisvendidos_data = pickUnique(produtos, 12, `home:produtos_maisvendidos:${tenant}`);
  const produtos_promocao_data = pickUnique(produtos, 20, `home:produtos_promocao:${tenant}`);

  const out = {
    home: {
      banners_1,
      categorias_destaque,
      produtos_maisvendidos: {
        slug: "mais-vendidos",
        data: produtos_maisvendidos_data,
      },
      produtos_promocao: {
        slug: "promocao",
        data: produtos_promocao_data,
      },
    },
  };

  writeJson(outFile, out);
  console.log(
    JSON.stringify(
      {
        ok: true,
        outFile,
        banners: banners_1.length,
        categorias_destaque: categorias_destaque.length,
        produtos_maisvendidos: produtos_maisvendidos_data.length,
        produtos_promocao: produtos_promocao_data.length,
      },
      null,
      2,
    ),
  );
}

main();

