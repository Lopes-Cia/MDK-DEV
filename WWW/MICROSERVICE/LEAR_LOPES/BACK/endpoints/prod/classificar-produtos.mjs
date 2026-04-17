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

function tokenSet(text) {
  const t = normalizeText(text);
  const parts = t.split(/[^a-z0-9]+/g).filter(Boolean);
  return new Set(parts);
}

function termMatches({ normText, tokens }, term) {
  const tr = normalizeText(term);
  if (!tr) return false;
  if (tr.includes(" ")) return normText.includes(tr);
  return tokens.has(tr);
}

function scoreRule(rule, ctx) {
  const any = Array.isArray(rule?.any) ? rule.any : [];
  const all = Array.isArray(rule?.all) ? rule.all : [];
  const none = Array.isArray(rule?.none) ? rule.none : [];

  for (const t of none) if (termMatches(ctx, t)) return { ok: false, score: -1 };

  let allMatches = 0;
  for (const t of all) {
    if (!termMatches(ctx, t)) return { ok: false, score: -1 };
    allMatches += 1;
  }

  let anyMatches = 0;
  for (const t of any) if (termMatches(ctx, t)) anyMatches += 1;
  if (any.length > 0 && anyMatches === 0) return { ok: false, score: -1 };

  return { ok: true, score: allMatches * 10 + anyMatches };
}

function bestMatchInTree(nodes, ctx, pathAcc = []) {
  const list = Array.isArray(nodes) ? nodes : [];

  let best = null;
  for (const node of list) {
    const s = scoreRule(node, ctx);
    if (!s.ok) continue;

    const currentPath = [...pathAcc, { id: node.id, name: node.name, score: s.score }];
    const childBest = bestMatchInTree(node.children, ctx, currentPath);
    const candidate = childBest ?? { path: currentPath, score: currentPath.reduce((a, b) => a + b.score, 0) };

    if (!best) {
      best = candidate;
      continue;
    }

    const bestDepth = best.path.length;
    const candDepth = candidate.path.length;
    if (candDepth > bestDepth) {
      best = candidate;
      continue;
    }
    if (candDepth === bestDepth && candidate.score > best.score) {
      best = candidate;
    }
  }

  return best;
}

function detectBrand(brandRules, ctx) {
  const rules = Array.isArray(brandRules) ? brandRules : [];

  let best = null;
  for (const r of rules) {
    const s = scoreRule(r, ctx);
    if (!s.ok) continue;
    if (!best || s.score > best.score) best = { id: r.id, name: r.name, score: s.score };
  }
  return best ? { id: best.id, name: best.name } : null;
}

function parseDecimal(s) {
  const raw = safeString(s).replace(",", ".");
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function detectPackaging(normText) {
  const out = { packType: null, packQty: null, unitType: null, volume: null };

  const mCaixa = normText.match(/caixa\s+com\s+(\d+)\s+unidades/);
  if (mCaixa) {
    out.packType = "caixa";
    out.packQty = Number(mCaixa[1]);
  } else if (normText.includes("multipack")) {
    out.packType = "multipack";
  } else {
    out.packType = "unit";
  }

  if (normText.includes("long neck")) out.unitType = "long_neck";
  else if (normText.includes("lata")) out.unitType = "lata";
  else if (normText.includes("frasco")) out.unitType = "frasco";
  else if (normText.includes("envelope")) out.unitType = "envelope";

  const vol = normText.match(/(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg)\b/);
  if (vol) {
    const qty = parseDecimal(vol[1]);
    const unit = vol[2];
    if (qty != null) out.volume = { qty, unit };
  }

  return out;
}

function toPCatJson(rules) {
  function mapNode(n) {
    const any = Array.isArray(n?.any) ? n.any : [];
    const all = Array.isArray(n?.all) ? n.all : [];
    const none = Array.isArray(n?.none) ? n.none : [];
    const children = Array.isArray(n?.children) ? n.children.map(mapNode) : [];
    return { id: n.id, name: n.name, match: { any, all, none }, children };
  }
  const taxonomy = Array.isArray(rules?.categoryTree) ? rules.categoryTree.map(mapNode) : [];
  return { version: safeString(rules?.version) || 1, taxonomy };
}

function toPMarcaJson(rules) {
  const brands = Array.isArray(rules?.brandRules)
    ? rules.brandRules.map((b) => ({ id: b.id, name: b.name, match: { any: b.any ?? [], all: b.all ?? [], none: b.none ?? [] } }))
    : [];
  return { version: safeString(rules?.version) || 1, brands };
}

async function main() {
  const inArg = getArgValue("--in");
  const outArg = getArgValue("--out");
  const rulesArg = getArgValue("--rules");
  const outCatArg = getArgValue("--out-cat");
  const outMarcaArg = getArgValue("--out-marca");

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
  const rulesPath = resolveCliPath(rulesArg, "classifier-rules.json");
  const outCatPath = resolveCliPath(outCatArg, "p_cat.json");
  const outMarcaPath = resolveCliPath(outMarcaArg, "p_marca.json");

  const rulesRaw = await fs.readFile(rulesPath, "utf8");
  const rules = JSON.parse(rulesRaw);

  const raw = await fs.readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed) ? parsed : [];

  const textFields = Array.isArray(rules?.textFields) ? rules.textFields : ["descricaoEcomerce", "descricaoErp"];

  const out = items.map((it) => {
    const joined = textFields.map((k) => safeString(it?.[k])).filter(Boolean).join(" ");
    const norm = normalizeText(joined);
    const ctx = { normText: norm, tokens: tokenSet(norm) };

    const brand = detectBrand(rules?.brandRules, ctx);
    const cat = bestMatchInTree(rules?.categoryTree, ctx);
    const packaging = detectPackaging(norm);

    return {
      codProd: it?.codProd ?? null,
      productId: it?.productId ?? null,
      nome: it?.descricaoEcomerce ?? null,
      marca: brand,
      categoria: cat ? { path: cat.path.map((p) => ({ id: p.id, name: p.name })) } : null,
      embalagem: packaging,
      origem: it
    };
  });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");

  await fs.writeFile(outCatPath, `${JSON.stringify(toPCatJson(rules), null, 2)}\n`, "utf8");
  await fs.writeFile(outMarcaPath, `${JSON.stringify(toPMarcaJson(rules), null, 2)}\n`, "utf8");

  process.stdout.write(
    `${JSON.stringify(
      { ok: true, inputPath, outputPath, rulesPath, outputs: { p_cat: outCatPath, p_marca: outMarcaPath }, count: out.length },
      null,
      2
    )}\n`
  );
}

main().catch((err) => {
  process.stderr.write(`${safeString(err?.message ?? err)}\n`);
  process.exitCode = 1;
});
