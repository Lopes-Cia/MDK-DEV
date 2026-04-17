import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function safeString(value) {
  return String(value ?? "").trim();
}

function normalizeText(value) {
  return safeString(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  const s = normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return s || "item";
}

function toIntOrZero(value) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

async function readJson(filePath, fallbackValue) {
  let raw = "";
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return fallbackValue;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function getArgValue(name) {
  const prefix = `${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  if (!found) return "";
  return found.slice(prefix.length).trim();
}

function capitalizeWords(value) {
  return safeString(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function detectCategoryLevelsFromName(name) {
  const t = normalizeText(name);
  let pai = "Outros";
  let keyword = "";
  if (t.includes("cerveja")) {
    pai = "Cervejas";
    keyword = "cerveja";
  } else if (t.includes("chopp")) {
    pai = "Chopp";
    keyword = "chopp";
  } else if (t.includes("refrigerante")) {
    pai = "Refrigerantes";
    keyword = "refrigerante";
  } else if (t.includes("isotonico") || t.includes("isotônico")) {
    pai = "Isotônicos";
    keyword = t.includes("isotônico") ? "isotônico" : "isotonico";
  }

  const blacklist = new Set([
    "lata",
    "long",
    "neck",
    "frasco",
    "envelope",
    "caixa",
    "multipack",
    "com",
    "unidades",
    "ml",
    "l",
    "g",
    "kg",
  ]);

  let neto = "";
  if (keyword) {
    const parts = t.split(/\s+/).filter(Boolean);
    const idx = parts.indexOf(keyword);
    if (idx >= 0) {
      for (let i = idx + 1; i < Math.min(parts.length, idx + 6); i += 1) {
        const cand = parts[i];
        if (!cand || blacklist.has(cand)) continue;
        if (/^\d/.test(cand)) continue;
        neto = capitalizeWords(cand);
        break;
      }
    }
  }

  return { pai, neto };
}

function ensureFallback0(list, fallback) {
  const items = Array.isArray(list) ? list : [];
  const idx = items.findIndex((x) => toIntOrZero(x?.id) === 0);
  if (idx === 0) return items;
  if (idx > 0) {
    const copy = items.slice();
    const [found] = copy.splice(idx, 1);
    return [found, ...copy];
  }
  return [fallback, ...items];
}

function buildBrandKey(name) {
  return normalizeText(name);
}

function buildCategoryKey(parentId, name) {
  return `${toIntOrZero(parentId)}::${normalizeText(name)}`;
}

function extractBrandCandidateFromName(productName) {
  const t = normalizeText(productName);
  if (!t) return "";

  const patterns = [
    "stella artois",
    "michelob ultra",
    "guarana antarctica",
    "guaraná antarctica",
    "skol beats",
    "tixan ype",
    "tixan ypê",
    "bak ype",
    "bak ypê",
  ];
  for (const p of patterns) {
    const pn = normalizeText(p);
    if (pn && t.includes(pn)) return capitalizeWords(p);
  }

  const stop = new Set([
    "cerveja",
    "chopp",
    "refrigerante",
    "isotonico",
    "isotonico",
    "agua",
    "lata",
    "long",
    "neck",
    "frasco",
    "envelope",
    "caixa",
    "multipack",
    "com",
    "unidades",
    "ml",
    "l",
    "g",
    "kg",
    "zero",
    "pilsen",
    "puro",
    "malte",
  ]);

  const parts = t.split(/\s+/).filter(Boolean);
  const firstKeywordIdx = parts.findIndex((w) => ["cerveja", "refrigerante", "isotonico", "isotônico", "chopp"].includes(w));
  const start = firstKeywordIdx >= 0 ? firstKeywordIdx + 1 : 0;

  for (let i = start; i < parts.length; i += 1) {
    const w = parts[i];
    if (!w || stop.has(w)) continue;
    if (/^\d/.test(w)) continue;
    if (w.length < 2) continue;

    if (w === "ype" || w === "ypê" || w === "ype") return "Ypê";
    if (w === "pepsi") return "Pepsi";
    if (w === "trident") return "Trident";

    return capitalizeWords(w);
  }

  return "";
}

function findExistingBrandIdByNameInProduct(brandNameById, productName) {
  const t = normalizeText(productName);
  if (!t) return 0;

  let best = { id: 0, len: 0 };
  for (const [id, brandName] of brandNameById.entries()) {
    if (id === 0) continue;
    const bn = normalizeText(brandName);
    if (!bn) continue;
    if (t.includes(bn) && bn.length > best.len) best = { id, len: bn.length };
  }
  return best.id;
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  function resolveCliPath(cliValue, fallbackFromHere) {
    const v = safeString(cliValue);
    if (!v) return path.resolve(__dirname, fallbackFromHere);
    if (path.isAbsolute(v)) return v;
    return path.resolve(process.cwd(), v);
  }

  const produtosPath = resolveCliPath(getArgValue("--produtos"), "./OUT/produtos.json");
  const brandsPath = resolveCliPath(getArgValue("--brands"), "./OUT/brands.json");
  const categoriasPath = resolveCliPath(getArgValue("--categorias"), "./OUT/categorias.json");

  const produtosRaw = await readJson(produtosPath, []);
  const produtos = Array.isArray(produtosRaw) ? produtosRaw : [];

  const brandsRaw = await readJson(brandsPath, []);
  const brandsFallback = {
    id: 0,
    name: "No Brand",
    slug: "/marca/no-brand",
    image: "http://localhost:4000/assets/images/semImagem.png",
  };
  const brands = ensureFallback0(Array.isArray(brandsRaw) ? brandsRaw : [], brandsFallback);

  const categoriasRaw = await readJson(categoriasPath, []);
  const categoriasFallback = {
    id: 0,
    name: "sem categoria",
    slug: "/categoria/sem-categoria",
    parentId: 0,
    image: "http://localhost:4000/assets/images/semImagem.png",
    order: 0,
  };
  const categorias = ensureFallback0(Array.isArray(categoriasRaw) ? categoriasRaw : [], categoriasFallback);

  const brandByNameKey = new Map();
  const brandNameById = new Map();
  let maxBrandId = 0;
  for (const b of brands) {
    const id = toIntOrZero(b?.id);
    if (id > maxBrandId) maxBrandId = id;
    const key = buildBrandKey(b?.name);
    if (key) brandByNameKey.set(key, id);
    const name = safeString(b?.name);
    if (name) brandNameById.set(id, name);
  }

  for (const p of produtos) {
    const bId = toIntOrZero(p?.brand?.id);
    if (bId !== 0) continue;
    const name = safeString(p?.name);
    if (!name) continue;
    const existingId = findExistingBrandIdByNameInProduct(brandNameById, name);
    if (existingId) continue;

    const candidate = extractBrandCandidateFromName(name);
    const candKey = buildBrandKey(candidate);
    if (!candKey) continue;
    if (brandByNameKey.has(candKey)) continue;

    maxBrandId += 1;
    const id = maxBrandId;
    brands.push({
      id,
      name: candidate,
      slug: `/marca/${slugify(candidate)}`,
      image: "http://localhost:4000/assets/images/semImagem.png",
    });
    brandByNameKey.set(candKey, id);
    brandNameById.set(id, candidate);
  }

  const catByKey = new Map();
  let maxCatId = 0;
  const catSlugById = new Map();
  for (const c of categorias) {
    const id = toIntOrZero(c?.id);
    if (id > maxCatId) maxCatId = id;
    const parentId = toIntOrZero(c?.parentId);
    const key = buildCategoryKey(parentId, c?.name);
    const nameKey = normalizeText(c?.name);
    if (nameKey) catByKey.set(key, id);
    const slug = safeString(c?.slug);
    if (slug) catSlugById.set(id, slug);
  }

  function ensureCategoria(name, parentId) {
    const normName = normalizeText(name);
    if (!normName) return 0;
    const key = buildCategoryKey(parentId, name);
    if (catByKey.has(key)) return catByKey.get(key);
    maxCatId += 1;
    const id = maxCatId;
    const slugBase = slugify(name || `categoria-${id}`);
    const slug =
      parentId === 0
        ? `/categoria/${slugBase}`
        : `${catSlugById.get(toIntOrZero(parentId)) || "/categoria"}/${slugBase}`;
    const order = id;
    categorias.push({
      id,
      name,
      slug,
      parentId,
      image: "http://localhost:4000/assets/images/semImagem.png",
      order,
    });
    catByKey.set(key, id);
    catSlugById.set(id, slug);
    return id;
  }

  for (const p of produtos) {
    const catId = toIntOrZero(p?.category?.id);
    if (catId !== 0) continue;
    const name = safeString(p?.name);
    if (!name) continue;
    const levels = detectCategoryLevelsFromName(name);
    const idPai = ensureCategoria(levels.pai, 0);
    if (levels.neto) ensureCategoria(levels.neto, idPai);
  }

  await writeJson(brandsPath, brands);
  await writeJson(categoriasPath, categorias);

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        inputs: { produtosPath, brandsPath, categoriasPath },
        counts: { produtos: produtos.length, brands: brands.length, categorias: categorias.length },
      },
      null,
      2
    )}\n`
  );
}

main().catch((err) => {
  process.stderr.write(`${safeString(err?.message ?? err)}\n`);
  process.exitCode = 1;
});
