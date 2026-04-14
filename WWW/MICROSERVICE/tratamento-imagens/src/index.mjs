import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "config", "config.master.json");
const CONFIG_DIR = path.dirname(CONFIG_PATH);
const IMAGES_ROOT = path.join(ROOT, "images");

const ERROR_CODES_V1 = {
  download: new Set([
    "download_timeout",
    "download_dns_error",
    "download_403",
    "download_404",
    "download_invalid_content_type",
    "download_payload_too_large",
  ]),
  input: new Set(["input_missing_imagem", "input_invalid_url", "input_invalid_badge_params"]),
  trim: new Set(["trim_no_foreground_detected", "trim_confidence_low", "trim_bbox_invalid", "trim_overcrop_detected"]),
  quality: new Set(["quality_below_medium", "quality_blur_detected"]),
  render: new Set(["full_render_failed", "resize_failed", "badge_render_failed"]),
  fallback: new Set(["fallback_applied", "fallback_render_failed", "fallback_source_not_found"]),
  storage: new Set(["storage_write_failed", "storage_read_failed", "manifest_write_failed"]),
  system: new Set(["unexpected_error"]),
};

function parseArgs(argv) {
  const output = {};
  for (const arg of argv.slice(2)) {
    if (!arg.startsWith("--")) continue;
    const [key, ...rest] = arg.slice(2).split("=");
    output[key] = rest.join("=") || true;
  }
  return output;
}

function createSeededRng(seed) {
  let value = Number(seed) || 42;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function seedFromString(input) {
  const hex = crypto.createHash("sha256").update(String(input ?? "")).digest("hex").slice(0, 8);
  return parseInt(hex, 16);
}

function pickRandomProducts(products, count, seed) {
  const rng = createSeededRng(seed);
  const cloned = [...products];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned.slice(0, Math.min(count, cloned.length));
}

function slugify(input) {
  return String(input ?? "produto")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "produto";
}

function hashHex(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function correlationId() {
  return crypto.randomUUID();
}

function isoNowCompact() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function resolveConfigPath(inputPath) {
  if (typeof inputPath !== "string" || inputPath.trim() === "") return inputPath;
  if (path.isAbsolute(inputPath)) return inputPath;
  return path.resolve(CONFIG_DIR, inputPath);
}

function resolveOutputDirs(productId) {
  return {
    original: path.join(IMAGES_ROOT, "original", productId),
    trim: path.join(IMAGES_ROOT, "trim", productId),
    full: path.join(IMAGES_ROOT, "full", productId),
    derived: path.join(IMAGES_ROOT, "derived", productId),
    rejected: path.join(IMAGES_ROOT, "rejected", productId),
    fallbackRoot: path.join(IMAGES_ROOT, "fallback"),
    manifestRoot: path.join(IMAGES_ROOT, "manifestos", productId),
  };
}

async function loadJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function resolveProductId(product) {
  return String(product.id_produto ?? product.skuId ?? product.ean ?? product.codProd ?? product.productId ?? "sem-id");
}

function resolveImagesFromProduct(product) {
  const all = [];
  if (product.imagem) all.push(String(product.imagem));
  if (Array.isArray(product.imagens)) {
    for (const img of product.imagens) {
      if (img) all.push(String(img));
    }
  }
  return all;
}

function resolveMode(configMaster, inputLote, cliModo) {
  if (cliModo === "teste" || cliModo === "full") return cliModo;
  const inputMode = inputLote?.modo_execucao;
  if (inputMode === "teste" || inputMode === "full") return inputMode;
  return configMaster.modo_execucao.tipo_default;
}

async function fetchImage(url, timeoutMs) {
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    if (String(error?.name).includes("Timeout")) {
      throw new Error("download_timeout");
    }
    if (String(error?.cause?.code ?? "").includes("ENOTFOUND")) {
      throw new Error("download_dns_error");
    }
    throw new Error("unexpected_error");
  }

  if (res.status === 403) throw new Error("download_403");
  if (res.status === 404) throw new Error("download_404");
  if (!res.ok) throw new Error("unexpected_error");

  const contentType = String(res.headers.get("content-type") ?? "");
  if (!contentType.startsWith("image/")) throw new Error("download_invalid_content_type");

  const arr = await res.arrayBuffer();
  const buffer = Buffer.from(arr);
  const maxBytes = 20 * 1024 * 1024;
  if (buffer.byteLength > maxBytes) throw new Error("download_payload_too_large");
  return { buffer, contentType };
}

async function trimImage(buffer, trimConfig) {
  const metadata = await sharp(buffer).metadata();
  const originalWidth = metadata.width ?? 0;
  const originalHeight = metadata.height ?? 0;
  const originalArea = originalWidth * originalHeight;

  const threshold = Number(trimConfig?.alpha?.pixel_vazio_ate ?? 10);
  let trimmed;
  try {
    trimmed = await sharp(buffer)
      .trim({ threshold: Number.isFinite(threshold) ? threshold : 10 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new Error("trim_bbox_invalid");
  }
  const trimWidth = trimmed.info.width ?? 0;
  const trimHeight = trimmed.info.height ?? 0;
  if (!trimWidth || !trimHeight) throw new Error("trim_no_foreground_detected");

  const trimArea = trimWidth * trimHeight;
  const ratio = originalArea ? trimArea / originalArea : 0;
  const didTrim = Boolean(
    (trimWidth && originalWidth && trimWidth !== originalWidth) ||
    (trimHeight && originalHeight && trimHeight !== originalHeight) ||
    (trimmed.info.trimOffsetLeft ?? 0) > 0 ||
    (trimmed.info.trimOffsetTop ?? 0) > 0
  );
  const valid = trimWidth >= trimConfig.validacao.min_lado_trim_px &&
    trimHeight >= trimConfig.validacao.min_lado_trim_px &&
    trimArea >= trimConfig.validacao.min_area_trim_px2 &&
    ratio >= trimConfig.validacao.min_area_trim_pct_vs_original &&
    (!didTrim || ratio <= trimConfig.validacao.max_area_trim_pct_vs_original);

  if (!valid) throw new Error("quality_below_medium");

  return {
    buffer: trimmed.data,
    width: trimWidth,
    height: trimHeight,
    bbox: {
      x: trimmed.info.trimOffsetLeft ?? 0,
      y: trimmed.info.trimOffsetTop ?? 0,
      w: trimWidth,
      h: trimHeight,
    },
  };
}

function pickMasterSize(trimInfo, fichaTamanho) {
  const ordered = [...fichaTamanho.tamanhos].sort((a, b) => b.largura * b.altura - a.largura * a.altura);
  for (const size of ordered) {
    if (trimInfo.width >= size.largura && trimInfo.height >= size.altura) {
      return size;
    }
  }
  return fichaTamanho.tamanhos.find((t) => t.chave === "medium") ?? fichaTamanho.tamanhos[0];
}

function rectPath(x, y, w, h, { tl = 0, tr = 0, br = 0, bl = 0 }) {
  const r = {
    tl: Math.max(0, Math.min(tl, Math.min(w, h) / 2)),
    tr: Math.max(0, Math.min(tr, Math.min(w, h) / 2)),
    br: Math.max(0, Math.min(br, Math.min(w, h) / 2)),
    bl: Math.max(0, Math.min(bl, Math.min(w, h) / 2)),
  };
  const x0 = x;
  const y0 = y;
  const x1 = x + w;
  const y1 = y + h;
  return [
    `M ${x0 + r.tl} ${y0}`,
    `H ${x1 - r.tr}`,
    r.tr ? `A ${r.tr} ${r.tr} 0 0 1 ${x1} ${y0 + r.tr}` : `L ${x1} ${y0}`,
    `V ${y1 - r.br}`,
    r.br ? `A ${r.br} ${r.br} 0 0 1 ${x1 - r.br} ${y1}` : `L ${x1} ${y1}`,
    `H ${x0 + r.bl}`,
    r.bl ? `A ${r.bl} ${r.bl} 0 0 1 ${x0} ${y1 - r.bl}` : `L ${x0} ${y1}`,
    `V ${y0 + r.tl}`,
    r.tl ? `A ${r.tl} ${r.tl} 0 0 1 ${x0 + r.tl} ${y0}` : `L ${x0} ${y0}`,
    "Z",
  ].join(" ");
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function makeBadgeSvg({ width, height, orientation, badgeData }) {
  const cor1 = badgeData?.cor1 || "#E10600";
  const cor2 = badgeData?.cor2 || "#F2C300";
  const txt1 = String(badgeData?.txt1 || "OFERTA").toUpperCase();
  const txt2 = String(badgeData?.txt2 || "");
  const txt3 = String(badgeData?.txt3 || "");
  const gap = Math.max(6, Math.round(Math.min(width, height) * 0.04));
  const radius = Math.max(12, Math.round(Math.min(width, height) * 0.18));
  const words = txt1.split(" ").filter(Boolean);
  const splitTwoLines = () => {
    if (words.length <= 1) return { l1: txt1, l2: "" };
    let best = { i: 1, score: Number.POSITIVE_INFINITY };
    for (let i = 1; i < words.length; i += 1) {
      const a = words.slice(0, i).join(" ");
      const b = words.slice(i).join(" ");
      const score = Math.abs(a.length - b.length);
      if (score < best.score) best = { i, score };
    }
    return { l1: words.slice(0, best.i).join(" "), l2: words.slice(best.i).join(" ") };
  };
  const t = splitTwoLines();

  if (orientation === "horizontal_topo") {
    const leftWidth = Math.round(width * 0.72);
    const redW = Math.max(0, leftWidth - Math.floor(gap / 2));
    const yellowX = redW + gap;
    const yellowW = Math.max(0, width - yellowX);

    const redPath = rectPath(0, 0, redW, height, { br: radius });
    const yellowPath = rectPath(yellowX, 0, yellowW, height, { tr: radius });

    const txt1Size = clamp(Math.round(height * 0.36), 18, 64);
    const txt2Size = clamp(Math.round(height * 0.44), 18, 72);
    const txt3Size = clamp(Math.round(height * 0.22), 12, 36);
    const redTextX = Math.round(redW * 0.5);
    const redTextY = Math.round(height * 0.55);
    const yellowTextX = yellowX + Math.round(yellowW * 0.5);

    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <path d="${redPath}" fill="${cor1}" />
  <path d="${yellowPath}" fill="${cor2}" />
  <text x="${redTextX}" y="${redTextY}" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-size="${txt1Size}" font-family="Arial" font-weight="900">
    <tspan x="${redTextX}" dy="${t.l2 ? -Math.round(txt1Size * 0.55) : 0}" textLength="${Math.max(0, redW * 0.9)}" lengthAdjust="spacingAndGlyphs">${t.l1}</tspan>
    ${t.l2 ? `<tspan x="${redTextX}" dy="${Math.round(txt1Size * 1.05)}" textLength="${Math.max(0, redW * 0.9)}" lengthAdjust="spacingAndGlyphs">${t.l2}</tspan>` : ""}
  </text>
  <text x="${yellowTextX}" y="${Math.round(height * 0.56)}" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-size="${txt2Size}" font-family="Arial" font-weight="900">${txt2}</text>
  <text x="${yellowTextX}" y="${Math.round(height * 0.82)}" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-size="${txt3Size}" font-family="Arial" font-weight="800">${txt3}</text>
</svg>`;
  }

  const topHeight = Math.round(height * 0.76);
  const redH = Math.max(0, topHeight - Math.floor(gap / 2));
  const yellowY = redH + gap;
  const yellowH = Math.max(0, height - yellowY);

  const redPath = rectPath(0, 0, width, redH, { br: radius });
  const yellowPath = rectPath(0, yellowY, width, yellowH, { tr: radius });

  const xMid = Math.round(width * 0.5);
  const txt1Size = clamp(Math.round(width * 0.42), 18, 72);
  const txt2Size = clamp(Math.round(yellowH * 0.52), 18, 72);
  const txt3Size = clamp(Math.round(yellowH * 0.26), 12, 36);

  const rotCx = xMid;
  const rotCy = Math.round(redH * 0.5);

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <path d="${redPath}" fill="${cor1}" />
  <path d="${yellowPath}" fill="${cor2}" />
  <text x="${rotCx}" y="${rotCy}" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-size="${txt1Size}" font-family="Arial" font-weight="900" transform="rotate(-90 ${rotCx} ${rotCy})">
    <tspan x="${rotCx}" dy="${t.l2 ? -Math.round(txt1Size * 0.55) : 0}" textLength="${Math.max(0, redH * 0.9)}" lengthAdjust="spacingAndGlyphs">${t.l1}</tspan>
    ${t.l2 ? `<tspan x="${rotCx}" dy="${Math.round(txt1Size * 1.05)}" textLength="${Math.max(0, redH * 0.9)}" lengthAdjust="spacingAndGlyphs">${t.l2}</tspan>` : ""}
  </text>
  <text x="${xMid}" y="${yellowY + Math.round(yellowH * 0.48)}" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-size="${txt2Size}" font-family="Arial" font-weight="900">${txt2}</text>
  <text x="${xMid}" y="${yellowY + Math.round(yellowH * 0.8)}" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-size="${txt3Size}" font-family="Arial" font-weight="800">${txt3}</text>
</svg>`;
}

async function renderFullFromTrim({ trimBuffer, trimInfo, masterSize, configMaster, applyBadge, badgeData, allowUpscale = false }) {
  const bleed = Number(configMaster.ficha_tamanho.acabamento.sangria.padrao_pct || 0.08);
  const orientation = trimInfo.width > trimInfo.height ? "horizontal_topo" : "vertical_esquerda";

  const canvas = sharp({
    create: {
      width: masterSize.largura,
      height: masterSize.altura,
      channels: 4,
      background: configMaster.background.value || "#FFFFFF",
    },
  });

  let availableX = 0;
  let availableY = 0;
  let availableW = masterSize.largura;
  let availableH = masterSize.altura;
  const composites = [];
  if (applyBadge) {
    if (orientation === "vertical_esquerda") {
      const badgeWidth = Math.round(masterSize.largura * 0.2);
      const svg = makeBadgeSvg({ width: badgeWidth, height: masterSize.altura, orientation, badgeData });
      composites.push({ input: Buffer.from(svg), left: 0, top: 0 });
      availableX = badgeWidth;
      availableW = masterSize.largura - badgeWidth;
    } else {
      const badgeHeight = Math.round(masterSize.altura * 0.2);
      const svg = makeBadgeSvg({ width: masterSize.largura, height: badgeHeight, orientation, badgeData });
      composites.push({ input: Buffer.from(svg), left: 0, top: 0 });
      availableY = badgeHeight;
      availableH = masterSize.altura - badgeHeight;
    }
  }

  const targetW = Math.round(availableW * (1 - bleed * 2));
  const targetH = Math.round(availableH * (1 - bleed * 2));
  const productLayer = await sharp(trimBuffer)
    .resize(targetW, targetH, { fit: "inside", withoutEnlargement: !allowUpscale })
    .toBuffer({ resolveWithObject: true });
  const left = availableX + Math.max(0, Math.round((availableW - productLayer.info.width) / 2));
  const top = availableY + Math.max(0, Math.round((availableH - productLayer.info.height) / 2));
  composites.push({ input: productLayer.data, left, top });

  return canvas.composite(composites).webp({ quality: configMaster.format.quality }).toBuffer();
}

async function saveManifest(productId, manifest, correlation) {
  const manifestRoot = path.join(IMAGES_ROOT, "manifestos", productId);
  const latestPath = path.join(manifestRoot, "latest.json");
  const runsPath = path.join(manifestRoot, "runs", `${isoNowCompact()}-${correlation}.json`);
  await writeJson(latestPath, manifest);
  await writeJson(runsPath, manifest);
}

async function applyFallback({ configMaster, imageIndex, reasonCode, onlyBadge, tempDir }) {
  const fallbackPath = resolveConfigPath(configMaster.fallback_imagem.arquivo_fallback_local);
  let buffer;
  try {
    buffer = await fs.readFile(fallbackPath);
  } catch {
    throw new Error("fallback_source_not_found");
  }
  const metadata = await sharp(buffer).metadata();
  const trimInfo = {
    buffer,
    width: Number(metadata.width ?? 0),
    height: Number(metadata.height ?? 0),
    bbox: { x: 0, y: 0, w: Number(metadata.width ?? 0), h: Number(metadata.height ?? 0) },
  };
  const masterSize =
    configMaster.ficha_tamanho.tamanhos.find((t) => t.chave === "full") ??
    pickMasterSize(trimInfo, configMaster.ficha_tamanho);
  const fullBuffer = await renderFullFromTrim({
    trimBuffer: trimInfo.buffer,
    trimInfo,
    masterSize,
    configMaster,
    applyBadge: false,
    badgeData: null,
    allowUpscale: true,
  });

  const hash12 = hashHex(buffer).slice(0, 12);
  const fallbackRoot = path.join(IMAGES_ROOT, "fallback");
  let fallbackFullPath = null;
  const tempPath = onlyBadge && tempDir ? path.join(tempDir, `sem-imagem-${hash12}-full.webp`) : null;
  if (onlyBadge) {
    if (tempPath) await fs.writeFile(tempPath, fullBuffer);
  } else {
    await ensureDir(path.join(fallbackRoot, "source"));
    await ensureDir(path.join(fallbackRoot, "trim"));
    await ensureDir(path.join(fallbackRoot, "full"));
    await ensureDir(path.join(fallbackRoot, "derived"));
    await fs.copyFile(fallbackPath, path.join(fallbackRoot, "source", "semImagem.png"));
    await fs.writeFile(path.join(fallbackRoot, "trim", `sem-imagem-${hash12}.webp`), trimInfo.buffer);
    fallbackFullPath = path.join(fallbackRoot, "full", `sem-imagem-${hash12}-full.webp`);
    await fs.writeFile(fallbackFullPath, fullBuffer);
  }

  const outputs = [];
  if (onlyBadge) {
    outputs.push({
      size: "full",
      status: "ok",
      path_relativo: tempPath ? path.relative(ROOT, tempPath) : "temp/unknown",
    });
  } else {
    for (const size of configMaster.ficha_tamanho.tamanhos) {
      const dir = path.join(fallbackRoot, "derived", size.chave);
      await ensureDir(dir);
      const outPath = path.join(dir, `sem-imagem-${hash12}-${size.chave}.webp`);
      await sharp(fullBuffer).resize(size.largura, size.altura, { fit: "contain", withoutEnlargement: true }).webp({ quality: configMaster.format.quality }).toFile(outPath);
      outputs.push({ size: size.chave, status: "ok", path_relativo: path.relative(IMAGES_ROOT, outPath) });
    }
  }

  return {
    usedFallback: true,
    imageResult: {
      indice: imageIndex,
      tipo: imageIndex === 0 ? "principal" : "secundaria",
      source: { url: "fallback://semImagem.png", status_download: "ok" },
      trim: { status: "ok", bbox: trimInfo.bbox, dimensao_saida: { w: trimInfo.width, h: trimInfo.height } },
      badge: { aplicado: false, variante: "nao_aplica", parametros: {} },
      outputs,
      status_final: "ok",
      fallback_motivo: reasonCode,
    },
  };
}

function getBadgeData(product) {
  const raw = `${product?.descricaoErp ?? ""} ${product?.descricaoEcomerce ?? ""} ${product?.descricao ?? ""}`;
  const s = String(raw)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

  function guessBrand() {
    const tokens = s.split(" ").filter(Boolean);
    const idx = tokens.findIndex((t) => t === "CERV" || t === "CERVEJA");
    if (idx < 0) return null;
    const stop = new Set([
      "LT",
      "LN",
      "LATA",
      "LONG",
      "NECK",
      "GFA",
      "GARRAFA",
      "CX",
      "C/12",
      "C/18",
      "C/24",
      "C/6",
      "C/8",
      "SH",
      "MULT",
      "SLEEK",
      "ML",
      "L",
      "UN",
      "UNIDADES",
      "PACK",
      "CAIXA",
      "COM",
      "DE",
      "UNIDADE",
    ]);
    const brand = [];
    for (let i = idx + 1; i < tokens.length && brand.length < 2; i += 1) {
      const t = tokens[i];
      if (!t) break;
      if (stop.has(t)) break;
      if (/^\d+$/.test(t)) break;
      if (/^\d+(?:[.,]\d+)?(ML|L)$/.test(t)) break;
      brand.push(t);
    }
    if (!brand.length) return null;
    return brand.join(" ");
  }

  const styles = [
    { key: "DUPLO MALTE", rx: /\bDUPLO\s+MALTE\b/ },
    { key: "PURO MALTE", rx: /\bPURO\s+MALTE\b/ },
    { key: "PILSEN", rx: /\bPILSEN\b/ },
    { key: "CHOPP", rx: /\bCHOPP\b/ },
    { key: "ORIGINAL", rx: /\bORIGINAL\b/ },
    { key: "IPA", rx: /\bIPA\b/ },
    { key: "LAGER", rx: /\bLAGER\b/ },
  ];
  const style = styles.find((x) => x.rx.test(s))?.key ?? null;
  const brand = guessBrand();
  const baseTxt1 = style ? `CERVEJA ${style}` : (brand ? `CERVEJA ${brand}` : (/\bCERV\b|\bCERVEJA\b/.test(s) ? "CERVEJA" : "OFERTA"));

  let txt2 = "";
  let txt3 = "";
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*(ML|L)\b/);
  if (m) {
    const n = Number(String(m[1]).replace(",", "."));
    const unit = String(m[2] ?? "").toUpperCase();
    if (Number.isFinite(n)) {
      if (unit === "L" && n > 0 && n <= 10) {
        txt2 = String(Math.round(n * 1000));
        txt3 = "ml";
      } else if (unit === "ML") {
        txt2 = String(Math.round(n));
        txt3 = "ml";
      }
    }
  }

  const badge = product?.badge ?? {};
  return {
    txt1: badge.txt1 ?? baseTxt1,
    txt2: badge.txt2 ?? txt2,
    txt3: badge.txt3 ?? txt3,
    cor1: badge.cor1 ?? "#E10600",
    cor2: badge.cor2 ?? "#F2C300",
  };
}

async function processProduct(product, configMaster, correlation, runtime) {
  const idProduto = resolveProductId(product);
  const dirs = resolveOutputDirs(idProduto);
  const tempDir = runtime?.onlyBadge && runtime?.tempRoot ? path.join(runtime.tempRoot, idProduto) : null;
  if (runtime?.onlyBadge) {
    if (tempDir) await ensureDir(tempDir);
  } else {
    await Promise.all(Object.values(dirs).map((d) => ensureDir(d)));
  }

  const startedAt = new Date();
  const imagesAll = resolveImagesFromProduct(product);
  const images = runtime?.onlyBadge ? imagesAll.slice(0, 1) : imagesAll;
  const manifest = {
    version: 1,
    produto: {
      id_produto: idProduto,
      skuId: product?.skuId ?? null,
      ean: product?.ean ?? null,
      descricao: product?.descricaoEcomerce ?? product?.descricaoErp ?? null,
    },
    execucao: {
      correlation_id: correlation,
      inicio_em: startedAt.toISOString(),
      fim_em: null,
      duracao_ms: null,
      status_geral: "ok",
    },
    resumo: {
      total_imagens_entrada: images.length,
      total_imagens_processadas: 0,
      total_sucesso: 0,
      total_falha: 0,
      falhas_criticas: 0,
    },
    config_aplicada: {
      ficha_tamanho_version: configMaster.ficha_tamanho.version,
      trim_config_version: configMaster.trim_config.version,
      badge_config_version: configMaster.badge_config.version,
      output_naming_version: 1,
    },
    imagens: [],
    erros: [],
  };

  for (let i = 0; i < images.length; i += 1) {
    const imageUrl = images[i];
    try {
      if (!imageUrl) throw new Error("input_missing_imagem");
      const { buffer, contentType } = await fetchImage(imageUrl, configMaster.timeouts.download_ms);
      const ext = contentType.split("/")[1]?.split(";")[0] || "img";
      const fullHash = hashHex(buffer);
      const hash12 = fullHash.slice(0, 12);
      const slug = slugify(product.descricaoEcomerce ?? product.descricaoErp ?? idProduto);

      const trimInfo = await trimImage(buffer, configMaster.trim_config);
      const masterSize = runtime?.onlyBadge
        ? (configMaster.ficha_tamanho.tamanhos.find((t) => t.chave === "medium") ?? pickMasterSize(trimInfo, configMaster.ficha_tamanho))
        : pickMasterSize(trimInfo, configMaster.ficha_tamanho);
      const canBadge = i === 0 && configMaster.badge_config.ativo && (runtime?.onlyBadge ? true : masterSize.badge_permitido);
      const fullBuffer = await renderFullFromTrim({
        trimBuffer: trimInfo.buffer,
        trimInfo,
        masterSize,
        configMaster,
        applyBadge: canBadge,
        badgeData: getBadgeData(product),
        allowUpscale: Boolean(runtime?.onlyBadge),
      });

      const fullPath = runtime?.onlyBadge && tempDir
        ? path.join(tempDir, `${slug}-${hash12}.webp`)
        : path.join(dirs.full, `${slug}-${hash12}.webp`);
      await fs.writeFile(fullPath, fullBuffer);

      const outputs = [];
      if (!runtime?.onlyBadge) {
        const originalPath = path.join(dirs.original, `${fullHash}.${ext}`);
        await fs.writeFile(originalPath, buffer);
        const trimPath = path.join(dirs.trim, `${hash12}.webp`);
        await sharp(trimInfo.buffer).webp({ quality: configMaster.format.quality }).toFile(trimPath);
        for (const size of configMaster.ficha_tamanho.tamanhos) {
          const sizeDir = path.join(dirs.derived, size.chave);
          await ensureDir(sizeDir);
          const outPath = path.join(sizeDir, `${slug}-${hash12}-${size.chave}.webp`);
          await sharp(fullBuffer).resize(size.largura, size.altura, { fit: "contain", withoutEnlargement: true }).webp({ quality: configMaster.format.quality }).toFile(outPath);
          outputs.push({
            size: size.chave,
            status: "ok",
            dimensao: { w: size.largura, h: size.altura },
            path_relativo: path.relative(IMAGES_ROOT, outPath),
            bytes: (await fs.stat(outPath)).size,
            hash_sha256: hashHex(await fs.readFile(outPath)),
          });
        }
      } else {
        outputs.push({
          size: "full",
          status: "ok",
          dimensao: { w: masterSize.largura, h: masterSize.altura },
          path_relativo: path.relative(ROOT, fullPath),
          bytes: (await fs.stat(fullPath)).size,
          hash_sha256: hashHex(await fs.readFile(fullPath)),
        });
      }

      manifest.imagens.push({
        indice: i,
        tipo: i === 0 ? "principal" : "secundaria",
        source: {
          url: imageUrl,
          status_download: "ok",
          http_status: 200,
          content_type: contentType,
          bytes: buffer.byteLength,
          hash_original_sha256: fullHash,
        },
        trim: {
          status: "ok",
          bbox: trimInfo.bbox,
          dimensao_saida: { w: trimInfo.width, h: trimInfo.height },
        },
        badge: {
          aplicado: canBadge,
          variante: canBadge ? (trimInfo.width > trimInfo.height ? "horizontal_topo" : "vertical_esquerda") : "nao_aplica",
          parametros: canBadge ? getBadgeData(product) : {},
        },
        outputs,
        status_final: "ok",
      });
      manifest.resumo.total_sucesso += 1;
      manifest.resumo.total_imagens_processadas += 1;
      if (runtime?.onlyBadge && runtime?.badgeReport) {
        runtime.badgeReport.push({
          id_produto: idProduto,
          indice: i,
          url: imageUrl,
          badge_aplicado: canBadge,
          badge_variante: canBadge ? (trimInfo.width > trimInfo.height ? "horizontal_topo" : "vertical_esquerda") : "nao_aplica",
          badge_parametros: canBadge ? getBadgeData(product) : {},
          output: path.relative(ROOT, fullPath),
        });
      }
    } catch (error) {
      const code = String(error?.message ?? "unexpected_error");
      const canFallback = configMaster.fallback_imagem.ativo && configMaster.fallback_imagem.aplicar_quando.includes(code);
      if (canFallback) {
        try {
          const fallbackResult = await applyFallback({
            configMaster,
            imageIndex: i,
            reasonCode: code,
            onlyBadge: Boolean(runtime?.onlyBadge),
            tempDir,
          });
          manifest.imagens.push(fallbackResult.imageResult);
          manifest.erros.push({
            codigo: "fallback_applied",
            mensagem: `Fallback aplicado por ${code}`,
            imagem_indice: i,
            etapa: "fallback",
            critico: false,
          });
          manifest.resumo.total_sucesso += 1;
          manifest.resumo.total_imagens_processadas += 1;
          if (runtime?.onlyBadge && runtime?.badgeReport) {
            runtime.badgeReport.push({
              id_produto: idProduto,
              indice: i,
              url: "fallback://semImagem.png",
              badge_aplicado: false,
              badge_variante: "nao_aplica",
              badge_parametros: {},
              output: fallbackResult.imageResult.outputs?.[0]?.path_relativo ?? null,
              fallback_motivo: code,
            });
          }
          continue;
        } catch (fallbackError) {
          const fallbackCode = String(fallbackError?.message ?? "fallback_render_failed");
          manifest.erros.push({
            codigo: fallbackCode,
            mensagem: "Falha ao processar fallback",
            imagem_indice: i,
            etapa: "fallback",
            critico: true,
          });
        }
      }

      manifest.imagens.push({
        indice: i,
        tipo: i === 0 ? "principal" : "secundaria",
        source: { url: imageUrl, status_download: "erro" },
        trim: { status: "erro", motivo_erro: code },
        badge: { aplicado: false, variante: "nao_aplica", parametros: {} },
        outputs: [],
        status_final: "erro",
      });
      manifest.erros.push({
        codigo: code,
        mensagem: `Falha no pipeline: ${code}`,
        imagem_indice: i,
        etapa: ERROR_CODES_V1.download.has(code) ? "download" : "processamento",
        critico: true,
      });
      manifest.resumo.total_falha += 1;
      manifest.resumo.falhas_criticas += 1;

      if (!runtime?.onlyBadge) {
        await writeJson(path.join(dirs.rejected, `${Date.now()}-${i}.json`), {
          codigo: code,
          imagem: imageUrl,
        });
      }
      process.stdout.write(`[erro] produto=${idProduto} indice=${i} codigo=${code}\n`);
    }
  }

  if (manifest.resumo.total_falha > 0 && manifest.resumo.total_sucesso > 0) manifest.execucao.status_geral = "parcial";
  if (manifest.resumo.total_sucesso === 0) manifest.execucao.status_geral = "erro";
  const endedAt = new Date();
  manifest.execucao.fim_em = endedAt.toISOString();
  manifest.execucao.duracao_ms = endedAt.getTime() - startedAt.getTime();

  if (!runtime?.onlyBadge) await saveManifest(idProduto, manifest, correlation);
  return {
    id_produto: idProduto,
    path_manifesto: runtime?.onlyBadge ? null : path.join("manifestos", idProduto, "latest.json"),
    status_geral: manifest.execucao.status_geral,
    fallback_usado: manifest.erros.some((e) => e.codigo === "fallback_applied"),
  };
}

async function resolveProductsToProcess(configMaster, inputLote, modo, runtime, correlation, args) {
  if (Array.isArray(inputLote?.produtos) && inputLote.produtos.length > 0) {
    return inputLote.produtos;
  }

  const sourcePath = resolveConfigPath(configMaster.modo_execucao[modo].source_json);
  const all = await loadJson(sourcePath);
  if (!Array.isArray(all)) throw new Error("unexpected_error");
  if (modo === "teste") {
    const configCount = Number(configMaster.modo_execucao.teste.selecionar_produtos_aleatorios || 3);
    const requestedCount = Number(args?.count ?? configCount);
    const n = Number.isFinite(requestedCount) && requestedCount > 0 ? Math.floor(requestedCount) : configCount;
    const base = runtime?.onlyBadge
      ? all.filter((p) => {
          const a = String(p?.descricaoErp ?? "");
          const b = String(p?.descricaoEcomerce ?? "");
          return /(^|\b)CERV(\b|$)|CERVEJA/i.test(a) || /CERVEJA/i.test(b);
        })
      : all;
    const seed =
      args?.seed !== undefined
        ? Number(args.seed)
        : runtime?.onlyBadge
          ? seedFromString(correlation)
          : Number(configMaster.modo_execucao.teste.seed_opcional || 42);
    return pickRandomProducts(base.length ? base : all, n, seed);
  }
  return all;
}

async function main() {
  const args = parseArgs(process.argv);
  const configRoot = await loadJson(CONFIG_PATH);
  const configMaster = configRoot.config_master;
  const inputLoteRaw = args["input-lote"] ? await loadJson(path.resolve(String(args["input-lote"]))) : null;
  const inputLote = inputLoteRaw?.input_lote ?? null;
  const modo = resolveMode(configMaster, inputLote, args.modo);
  if (modo !== "teste" && modo !== "full") throw new Error("unexpected_error");
  const runtime = { onlyBadge: args["only-badge"] === true || args["only-badge"] === "1", tempRoot: null, badgeReport: null };

  const correlation = correlationId();
  if (runtime.onlyBadge) {
    runtime.tempRoot = path.join(ROOT, "temp", correlation);
    runtime.badgeReport = [];
    await ensureDir(runtime.tempRoot);
    process.stdout.write(`[badge] output=${runtime.tempRoot}\n`)
  } else {
    await ensureDir(IMAGES_ROOT);
    for (const fixedDir of ["original", "trim", "full", "derived", "fallback", "manifestos", "rejected"]) {
      await ensureDir(path.join(IMAGES_ROOT, fixedDir));
    }
  }
  const produtos = await resolveProductsToProcess(configMaster, inputLote, modo, runtime, correlation, args);
  const manifestos = [];
  for (const produto of produtos) {
    const result = await processProduct(produto, configMaster, correlation, runtime);
    manifestos.push(result);
  }

  const resumo = {
    produtos_total: manifestos.length,
    produtos_ok: manifestos.filter((m) => m.status_geral === "ok").length,
    produtos_parcial: manifestos.filter((m) => m.status_geral === "parcial").length,
    produtos_erro: manifestos.filter((m) => m.status_geral === "erro").length,
  };
  const status = resumo.produtos_erro > 0 ? (resumo.produtos_ok > 0 || resumo.produtos_parcial > 0 ? "parcial" : "erro") : "ok";
  const outputLote = {
    output_lote: {
      correlation_id: correlation,
      modo_execucao: modo,
      status,
      resumo,
      manifestos,
    },
  };
  if (runtime.onlyBadge && runtime.tempRoot && runtime.badgeReport) {
    await writeJson(path.join(runtime.tempRoot, "report.json"), { correlation_id: correlation, itens: runtime.badgeReport });
  } else {
    await writeJson(path.join(IMAGES_ROOT, "logs", `${isoNowCompact()}-${correlation}.json`), outputLote);
  }
  process.stdout.write(`${JSON.stringify(outputLote, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`[fatal] ${String(error?.message ?? error)}\n`);
  process.exitCode = 1;
});
