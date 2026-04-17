import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function safeString(value) {
  return String(value ?? "").trim();
}

function getArgValue(name) {
  const prefix = `${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  if (!found) return "";
  return found.slice(prefix.length).trim();
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
  return s || "produto";
}

function toNumberOrNull(value) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function toIntOrNull(value) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function formatSizeLabel(qty, unit) {
  if (qty == null) return "";
  const u = safeString(unit).toLowerCase();
  const q = Number.isFinite(qty) ? qty : null;
  if (q == null) return "";

  const isInt = Number.isInteger(q);
  const qStr = isInt ? String(q) : String(q).replace(/\.0+$/, "");
  if (u === "ml") return `${qStr}ml`;
  if (u === "l") return `${qStr}L`;
  if (u === "g") return `${qStr}g`;
  if (u === "kg") return `${qStr}kg`;
  return `${qStr}${u}`;
}

function detectSizeLabel(text) {
  const t = normalizeText(text);
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg)\b/);
  if (!m) return "";
  const raw = safeString(m[1]).replace(",", ".");
  const qty = Number(raw);
  if (!Number.isFinite(qty)) return "";
  return formatSizeLabel(qty, m[2]);
}

function detectUnitLabel(text, codVol) {
  const t = normalizeText(text);
  if (t.includes("long neck")) return "long neck";
  if (t.includes("growler")) return "growler";
  if (t.includes("lata")) return "lata";
  if (t.includes("frasco")) return "frasco";
  if (t.includes("envelope")) return "envelope";
  if (t.includes("caixa")) return "caixa";
  const cv = normalizeText(codVol);
  return cv || "un";
}

function detectBadges(text) {
  const t = normalizeText(text);
  const bebida =
    t.includes("cerveja") ||
    t.includes("chopp") ||
    t.includes("refrigerante") ||
    t.includes("isotonico") ||
    t.includes("isotonico");
  return bebida ? ["gelada"] : [];
}

async function main() {
  const inArg = getArgValue("--in");
  const outArg = getArgValue("--out");

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  function resolveCliPath(cliValue, fallbackPathFromScriptDir) {
    const v = safeString(cliValue);
    if (!v) return path.resolve(__dirname, fallbackPathFromScriptDir);
    if (path.isAbsolute(v)) return v;
    return path.resolve(process.cwd(), v);
  }

  const inputPath = resolveCliPath(inArg, "j1.json");
  const outputPath = resolveCliPath(outArg, "produtos_classificados.json");

  const raw = await fs.readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed) ? parsed : [];

  const brandFallback = {
    id: 0,
    name: "No Brand",
    slug: "/marca/no-brand",
    image: "http://localhost:4000/assets/images/semImagem.png",
  };

  const out = items.map((it) => {
    const id = toIntOrNull(it?.codProd) ?? 0;

    const name = safeString(it?.descricaoEcomerce) || safeString(it?.descricaoErp) || `Produto ${id}`;
    const baseSlug = slugify(name);
    const slug = `/produtos/${baseSlug}-${id}`;

    const unitLabel = detectUnitLabel(name, it?.codVol);
    const sizeLabel = detectSizeLabel(name);

    const ean = safeString(it?.ean);
    const sku = ean && ean.toLowerCase() !== "null" ? `${ean}-${id}` : `${baseSlug}-${id}`;

    const price = toNumberOrNull(it?.preco);
    const stock = toIntOrNull(it?.qtEstoque) ?? 0;

    const categoryId = toIntOrNull(it?.categoriaPrinciapal) ?? 0;
    const categoryFallback = {
      id: categoryId,
      name: "sem categoria",
      slug: "/categoria/sem-categoria",
      familia: [{ id: categoryId, name: "sem categoria", slug: "/categoria/sem-categoria" }],
    };

    const image = safeString(it?.imagem) || "http://localhost:4000/assets/images/semImagem.png";

    return {
      id,
      sku,
      name,
      slug,
      unitLabel,
      sizeLabel,
      price,
      compareAtPrice: null,
      badges: detectBadges(name),
      image,
      stock,
      inStock: stock > 0,
      category: categoryFallback,
      brand: brandFallback,
    };
  });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");

  process.stdout.write(`${JSON.stringify({ ok: true, inputPath, outputPath, count: out.length }, null, 2)}\n`);
}

main().catch((err) => {
  process.stderr.write(`${safeString(err?.message ?? err)}\n`);
  process.exitCode = 1;
});

