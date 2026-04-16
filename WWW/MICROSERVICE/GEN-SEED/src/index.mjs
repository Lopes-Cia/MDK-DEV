import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function slugify(input) {
  return String(input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
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

function deepMerge(base, override) {
  if (override == null) return base;
  if (Array.isArray(base) || Array.isArray(override)) return override;
  if (typeof base !== "object" || typeof override !== "object") return override;
  const out = { ...base };
  for (const [k, v] of Object.entries(override)) {
    out[k] = deepMerge(base?.[k], v);
  }
  return out;
}

function asFiniteNumber(value, fallback) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeConfig(raw) {
  const cfg = deepMerge(
    {
      outputDir: "./data",
      categories: {
        rootsMin: 5,
        childrenMin: 3,
        childrenMax: 5,
        grandchildrenMin: 2,
        grandchildrenMax: 4,
      },
      products: { minTotal: 120 },
    },
    raw ?? {},
  );

  cfg.outputDir = typeof cfg.outputDir === "string" && cfg.outputDir.trim() ? cfg.outputDir : "./data";

  cfg.categories.rootsMin = asFiniteNumber(cfg.categories.rootsMin, 5);
  cfg.categories.childrenMin = asFiniteNumber(cfg.categories.childrenMin, 3);
  cfg.categories.childrenMax = asFiniteNumber(cfg.categories.childrenMax, 5);
  cfg.categories.grandchildrenMin = asFiniteNumber(cfg.categories.grandchildrenMin, 2);
  cfg.categories.grandchildrenMax = asFiniteNumber(cfg.categories.grandchildrenMax, 4);
  cfg.products.minTotal = asFiniteNumber(cfg.products.minTotal, 120);

  assert(cfg.categories.rootsMin >= 5, "config.categories.rootsMin deve ser >= 5");
  assert(cfg.categories.childrenMin >= 3, "config.categories.childrenMin deve ser >= 3");
  assert(cfg.categories.childrenMax <= 5, "config.categories.childrenMax deve ser <= 5");
  assert(cfg.categories.childrenMin <= cfg.categories.childrenMax, "config.categories.childrenMin deve ser <= childrenMax");
  assert(cfg.categories.grandchildrenMin >= 2, "config.categories.grandchildrenMin deve ser >= 2");
  assert(cfg.categories.grandchildrenMax <= 4, "config.categories.grandchildrenMax deve ser <= 4");
  assert(cfg.categories.grandchildrenMin <= cfg.categories.grandchildrenMax, "config.categories.grandchildrenMin deve ser <= grandchildrenMax");
  assert(cfg.products.minTotal >= 120, "config.products.minTotal deve ser >= 120");

  return cfg;
}

function readConfig({ projectDir, args }) {
  const configFile = args.config ? path.resolve(projectDir, args.config) : path.join(projectDir, "config.json");
  const raw = JSON.parse(fs.readFileSync(configFile, "utf8"));
  const cfg = normalizeConfig(raw);
  if (args.outputDir) cfg.outputDir = String(args.outputDir);
  return { configFile, config: cfg };
}

function clampPreferred({ min, max, preferred }) {
  return Math.min(max, Math.max(min, preferred));
}

function ensureUniqueSlug({ base, used, fallbackSuffix }) {
  const baseSlug = slugify(base);
  let s = baseSlug;
  if (!s) s = `item-${fallbackSuffix}`;
  if (!used.has(s)) return s;
  const candidate = `${s}-${fallbackSuffix}`;
  if (!used.has(candidate)) return candidate;
  let i = 2;
  while (used.has(`${candidate}-${i}`)) i += 1;
  return `${candidate}-${i}`;
}

function buildCategories({ config }) {
  const usedSlugs = new Set();
  const categories = [];
  const rootsBlueprint = [
    {
      name: "Bebidas",
      children: [
        { name: "Cervejas", grandchildren: ["Lager", "IPA", "Pilsen", "Artesanais"] },
        { name: "Chopp", grandchildren: ["Pilsen", "IPA", "Artesanal"] },
        { name: "Drinks prontos", grandchildren: ["Gin tônica", "Vodka ice", "Caipirinha"] },
        { name: "Sidras", grandchildren: ["Tradicional", "Premium", "Artesanal"] },
        { name: "Sem álcool", grandchildren: ["Lager", "IPA", "Pilsen"] },
      ],
    },
    {
      name: "Vinhos",
      children: [
        { name: "Tintos", grandchildren: ["Seco", "Suave", "Reserva", "Orgânico"] },
        { name: "Brancos", grandchildren: ["Seco", "Suave", "Frisante"] },
        { name: "Espumantes", grandchildren: ["Brut", "Moscatel", "Demi-sec"] },
        { name: "Rosés", grandchildren: ["Seco", "Suave", "Frisante"] },
        { name: "Fortificados", grandchildren: ["Porto", "Jerez"] },
      ],
    },
    {
      name: "Destilados",
      children: [
        { name: "Whisky", grandchildren: ["Blended", "Bourbon", "Single malt"] },
        { name: "Vodka", grandchildren: ["Tradicional", "Premium", "Saborizada"] },
        { name: "Gin", grandchildren: ["London Dry", "Aromatizado", "Navy Strength"] },
        { name: "Rum", grandchildren: ["Branco", "Dourado", "Envelhecido"] },
        { name: "Tequila", grandchildren: ["Blanco", "Reposado"] },
      ],
    },
    {
      name: "Não alcoólicas",
      children: [
        { name: "Energéticos", grandchildren: ["Tradicional", "Zero", "Sem açúcar"] },
        { name: "Refrigerantes", grandchildren: ["Cola", "Guaraná", "Citrus", "Tônica"] },
        { name: "Águas & Isotônicos", grandchildren: ["Água", "Com gás", "Isotônico"] },
        { name: "Sucos", grandchildren: ["Uva", "Laranja", "Maçã"] },
        { name: "Chás prontos", grandchildren: ["Pêssego", "Limão"] },
      ],
    },
    {
      name: "Conveniência",
      children: [
        { name: "Gelo", grandchildren: ["Saco 2kg", "Saco 5kg", "Gelo de coco"] },
        { name: "Snacks", grandchildren: ["Salgadinhos", "Amendoim", "Batata chips", "Mix de nuts"] },
        { name: "Acessórios", grandchildren: ["Copos", "Abridor", "Baldes"] },
        { name: "Tabacaria", grandchildren: ["Isqueiros", "Carvão", "Piteiras"] },
        { name: "Presentes", grandchildren: ["Kits", "Embalagens"] },
      ],
    },
    {
      name: "Ofertas",
      children: [
        { name: "Combos", grandchildren: ["Cerveja + Snack", "Destilado + Tônica"] },
        { name: "Queima de estoque", grandchildren: ["Últimas unidades", "Sem reposição"] },
        { name: "Promoções da semana", grandchildren: ["Top 10", "Até 30%"] },
      ],
    },
  ];

  const preferredChildrenCount = 4;
  const preferredGrandchildrenCount = 3;

  let nextId = 10;
  function addCategory({ name, parentId }) {
    const id = nextId++;
    const slugBase = ensureUniqueSlug({ base: name, used: usedSlugs, fallbackSuffix: id });
    usedSlugs.add(slugBase);
    const slug = `/categoria/${slugBase}`;
    const c = {
      id,
      name,
      slug,
      parentId,
      image: `/assets/categories/${slugBase}.webp`,
      order: id,
    };
    categories.push(c);
    return c;
  }

  const rootsCount = config.categories.rootsMin;
  const roots = [];
  for (let i = 0; i < rootsCount; i += 1) {
    const bp = rootsBlueprint[i] ?? { name: `Categoria ${i + 1}`, children: [] };
    roots.push(addCategory({ name: bp.name, parentId: 0 }));
  }

  for (let rIdx = 0; rIdx < roots.length; rIdx += 1) {
    const root = roots[rIdx];
    const bp = rootsBlueprint[rIdx] ?? { name: root.name, children: [] };
    const childCount = clampPreferred({
      min: config.categories.childrenMin,
      max: config.categories.childrenMax,
      preferred: preferredChildrenCount,
    });

    const children = [];
    for (let i = 0; i < childCount; i += 1) {
      const childBp = bp.children?.[i] ?? { name: `Subcategoria ${i + 1}`, grandchildren: [] };
      children.push(addCategory({ name: childBp.name, parentId: root.id }));
    }

    for (let cIdx = 0; cIdx < children.length; cIdx += 1) {
      const child = children[cIdx];
      const childBp = bp.children?.[cIdx] ?? { name: child.name, grandchildren: [] };
      const grandCount = clampPreferred({
        min: config.categories.grandchildrenMin,
        max: config.categories.grandchildrenMax,
        preferred: preferredGrandchildrenCount,
      });
      for (let i = 0; i < grandCount; i += 1) {
        const grandName = childBp.grandchildren?.[i] ?? `Linha ${i + 1}`;
        addCategory({ name: grandName, parentId: child.id });
      }
    }
  }

  return categories;
}

function buildMaps(categories) {
  const byId = new Map();
  const childrenByParentId = new Map();
  for (const c of categories) {
    byId.set(c.id, c);
    const list = childrenByParentId.get(c.parentId) ?? [];
    list.push(c);
    childrenByParentId.set(c.parentId, list);
  }
  return { byId, childrenByParentId };
}

function isGrandchildCategory({ categoryId, byId }) {
  const c = byId.get(categoryId);
  if (!c) return false;
  const parent = byId.get(c.parentId);
  if (!parent) return false;
  return parent.parentId !== 0;
}

function lineage({ categoryId, byId }) {
  const leaf = byId.get(categoryId);
  if (!leaf) return null;
  const child = byId.get(leaf.parentId);
  if (!child) return null;
  const root = byId.get(child.parentId);
  if (!root) return null;
  return { root, child, leaf };
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

function money(n) {
  return Number(Number(n).toFixed(2));
}

const PLACEHOLDER_IMAGE_URL = "http://localhost:4000/assets/images/semImagem.png";

function ensureUniqueBrandId({ name, usedIds }) {
  const base = hash32(String(name || ""));
  if (!usedIds.has(base)) return base;
  let i = 2;
  while (usedIds.has(hash32(`${name}#${i}`))) i += 1;
  return hash32(`${name}#${i}`);
}

function buildBrands({ products }) {
  const byName = new Map();
  for (const p of products) {
    const b = p?.brand;
    const name = String(b?.name || "").trim();
    if (!name) continue;
    if (byName.has(name)) continue;
    byName.set(name, {
      id: b.id,
      name: b.name,
      slug: b.slug,
      image: b.image,
    });
  }
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildProducts({ config, categories }) {
  const { byId } = buildMaps(categories);
  const leafCategories = categories.filter((c) => isGrandchildCategory({ categoryId: c.id, byId }));

  assert(leafCategories.length > 0, "não foi possível determinar categorias netas (3º nível)");

  const minTotal = config.products.minTotal;
  const base = Math.floor(minTotal / leafCategories.length);
  const remainder = minTotal % leafCategories.length;
  const perLeaf = leafCategories.map((c, idx) => ({ category: c, target: base + (idx < remainder ? 1 : 0) }));

  const products = [];
  const usedSlugs = new Set();
  let nextId = 1001;

  function nextStock({ sku, outOfStock }) {
    if (outOfStock) return 0;
    const rnd = mulberry32(hash32(sku));
    return 5 + Math.floor(rnd() * 180);
  }

  function nextPrice({ sku, basePrice }) {
    const rnd = mulberry32(hash32(`price:${sku}`));
    const factor = 0.92 + rnd() * 0.16;
    return money(basePrice * factor);
  }

  function pickCompareAtPrice({ sku, price }) {
    const h = hash32(`promo:${sku}`);
    if (h % 9 !== 0) return null;
    return money(price + Math.max(1, price * 0.15));
  }

  function ensureProductSlug({ name, brand, id }) {
    const baseSlug = slugify(name);
    let s = baseSlug;
    if (!s) s = `produto-${id}`;
    if (!usedSlugs.has(s)) return s;
    const withBrand = `${baseSlug}-${slugify(brand)}`;
    if (!usedSlugs.has(withBrand)) return withBrand;
    return `${withBrand}-${id}`;
  }

  function categoryFamilyObjects(categoryId) {
    const leaf = byId.get(categoryId);
    assert(leaf, `produto.categoryId inválido (${categoryId})`);
    const out = [];
    let cur = leaf;
    while (cur) {
      out.push({
        id: cur.id,
        name: cur.name,
        slug: cur.slug,
      });
      if (cur.parentId === 0) break;
      cur = byId.get(cur.parentId);
      assert(cur, `categoria.parentId inválido ao montar familia (${out[out.length - 1]?.id})`);
    }
    return out.reverse();
  }

  function addProduct({ name, brand, unitLabel, sizeLabel, priceBase, badges, image, categoryId }) {
    const id = nextId++;
    const brandName = String(brand || "").trim();
    const brandId = hash32(brandName);
    const brandSlugBase = slugify(brandName) || `brand-${brandId}`;
    const brandSlug = `/marca/${brandSlugBase}`;
    const brandObj = {
      id: brandId,
      name: brandName,
      slug: brandSlug,
      image: PLACEHOLDER_IMAGE_URL,
    };

    const sku = slugify(`${brandName}-${name}-${sizeLabel}`).toUpperCase();
    const slugBase = ensureProductSlug({ name, brand, id });
    usedSlugs.add(slugBase);
    const slug = `/produtos/${slugBase}`;

    const category = byId.get(categoryId);
    assert(category, `produto.categoryId inválido (${categoryId})`);
    const categoryFamilia = categoryFamilyObjects(categoryId);
    const categoryObj = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      familia: categoryFamilia,
    };

    const outOfStock = hash32(`stock0:${sku}`) % 17 === 0;
    const stock = nextStock({ sku, outOfStock });
    const inStock = stock > 0;
    const price = nextPrice({ sku, basePrice: priceBase });
    const compareAtPrice = pickCompareAtPrice({ sku, price });
    const finalBadges = compareAtPrice ? Array.from(new Set([...(badges ?? []), "promo"])) : badges ?? [];

    products.push({
      id,
      sku,
      name,
      slug,
      category: categoryObj,
      brand: brandObj,
      unitLabel,
      sizeLabel,
      price,
      compareAtPrice,
      badges: finalBadges,
      image: image ?? PLACEHOLDER_IMAGE_URL,
      stock,
      inStock,
    });
  }

  function variantsForLeaf({ rootName, childName, leafName }) {
    const image = PLACEHOLDER_IMAGE_URL;

    if (rootName === "Bebidas" && childName === "Cervejas") {
      const brands = ["Heineken", "Brahma", "Budweiser", "Stella Artois", "Skol", "Amstel", "Corona", "Spaten"];
      const sizes = ["269ml", "350ml", "473ml"];
      const out = [];
      for (const b of brands) {
        for (const s of sizes) {
          out.push({
            name: `${b} Lata ${s}`,
            brand: b,
            unitLabel: "lata",
            sizeLabel: s,
            priceBase: 4.49 + (leafName === "Artesanais" ? 3.5 : 0),
            badges: ["gelada"],
            image,
          });
        }
      }
      const packBrands = ["Heineken", "Brahma", "Budweiser", "Amstel", "Skol"];
      const packOptions = [
        { packSize: 6, size: "350ml", unitLabel: "pack", priceBase: 27.9, badge: "combo" },
        { packSize: 12, size: "350ml", unitLabel: "caixa", priceBase: 52.9, badge: "combo" },
      ];
      for (const brand of packBrands) {
        for (const opt of packOptions) {
          out.push({
            name: `${brand} ${opt.packSize}x ${opt.size}`,
            brand,
            unitLabel: opt.unitLabel,
            sizeLabel: `${opt.packSize}x ${opt.size}`,
            priceBase: opt.priceBase,
            badges: [opt.badge],
            image,
          });
        }
      }
      return out;
    }

    if (rootName === "Bebidas" && childName === "Chopp") {
      return [
        { name: "Chopp Pilsen 1L", brand: "Chopp", unitLabel: "growler", sizeLabel: "1L", priceBase: 22.9, badges: ["gelada"], image },
        { name: "Chopp Pilsen 2L", brand: "Chopp", unitLabel: "growler", sizeLabel: "2L", priceBase: 39.9, badges: ["gelada"], image },
        { name: "Chopp IPA 1L", brand: "Chopp", unitLabel: "growler", sizeLabel: "1L", priceBase: 26.9, badges: ["gelada"], image },
        { name: "Chopp IPA 2L", brand: "Chopp", unitLabel: "growler", sizeLabel: "2L", priceBase: 45.9, badges: ["gelada"], image },
      ];
    }

    if (rootName === "Bebidas" && childName === "Drinks prontos") {
      return [
        { name: "Gin Tônica Lata 269ml", brand: "Drinks", unitLabel: "lata", sizeLabel: "269ml", priceBase: 10.9, badges: ["gelada"], image },
        { name: "Vodka Ice Lata 269ml", brand: "Drinks", unitLabel: "lata", sizeLabel: "269ml", priceBase: 9.9, badges: ["gelada"], image },
        { name: "Caipirinha Lata 269ml", brand: "Drinks", unitLabel: "lata", sizeLabel: "269ml", priceBase: 11.9, badges: ["gelada"], image },
      ];
    }

    if (rootName === "Vinhos") {
      const sizeLabel = "750ml";
      if (childName === "Tintos") {
        const bases = [
          { name: "Vinho Tinto", brand: "Miolo", base: 69.9 },
          { name: "Vinho Tinto", brand: "Concha y Toro", base: 49.9 },
          { name: "Vinho Tinto", brand: "Casillero del Diablo", base: 79.9 },
          { name: "Vinho Tinto", brand: "Aurora", base: 39.9 },
        ];
        return bases.map((b) => ({
          name: `${b.name} ${leafName} ${sizeLabel}`,
          brand: b.brand,
          unitLabel: "garrafa",
          sizeLabel,
          priceBase: b.base + (leafName === "Reserva" ? 20 : 0),
          badges: [],
          image,
        }));
      }
      if (childName === "Brancos") {
        const bases = [
          { name: "Vinho Branco", brand: "Santa Helena", base: 44.9 },
          { name: "Vinho Branco", brand: "Aurora", base: 34.9 },
          { name: "Vinho Branco", brand: "Concha y Toro", base: 39.9 },
        ];
        return bases.map((b) => ({
          name: `${b.name} ${leafName} ${sizeLabel}`,
          brand: b.brand,
          unitLabel: "garrafa",
          sizeLabel,
          priceBase: b.base,
          badges: [],
          image,
        }));
      }
      if (childName === "Espumantes") {
        const bases = [
          { name: "Espumante", brand: "Chandon", base: 99.9 },
          { name: "Espumante", brand: "Casa Perini", base: 79.9 },
          { name: "Espumante", brand: "Aurora", base: 49.9 },
        ];
        return bases.map((b) => ({
          name: `${b.name} ${leafName} ${sizeLabel}`,
          brand: b.brand,
          unitLabel: "garrafa",
          sizeLabel,
          priceBase: b.base,
          badges: [],
          image,
        }));
      }
      return [
        { name: `Vinho ${childName} ${leafName} ${sizeLabel}`, brand: "Seleção", unitLabel: "garrafa", sizeLabel, priceBase: 49.9, badges: [], image },
      ];
    }

    if (rootName === "Destilados") {
      const sizeLabel = leafName === "Premium" ? "1L" : "750ml";
      if (childName === "Vodka") {
        const brands = ["Smirnoff", "Absolut", "Orloff", "Skyy"];
        return brands.map((b, idx) => ({
          name: `Vodka ${b} ${leafName} ${idx % 2 === 0 ? "1L" : "750ml"}`,
          brand: b,
          unitLabel: "garrafa",
          sizeLabel: idx % 2 === 0 ? "1L" : "750ml",
          priceBase: b === "Absolut" ? 109.9 : b === "Smirnoff" ? 59.9 : 44.9,
          badges: [],
          image,
        }));
      }
      if (childName === "Gin") {
        const brands = ["Tanqueray", "Beefeater", "Bombay Sapphire", "Gordon's"];
        return brands.map((b) => ({
          name: `Gin ${b} ${leafName} 750ml`,
          brand: b,
          unitLabel: "garrafa",
          sizeLabel: "750ml",
          priceBase: b === "Bombay Sapphire" ? 169.9 : b === "Tanqueray" ? 139.9 : 119.9,
          badges: [],
          image,
        }));
      }
      if (childName === "Whisky") {
        const brands = ["Johnnie Walker", "Ballantine's", "Jack Daniel's", "Jim Beam"];
        return brands.map((b) => ({
          name: `Whisky ${b} ${leafName} 1L`,
          brand: b,
          unitLabel: "garrafa",
          sizeLabel: "1L",
          priceBase: b === "Jack Daniel's" ? 179.9 : b === "Johnnie Walker" ? 139.9 : 119.9,
          badges: [],
          image,
        }));
      }
      return [
        { name: `${childName} ${leafName} ${sizeLabel}`, brand: childName, unitLabel: "garrafa", sizeLabel, priceBase: 89.9, badges: [], image },
      ];
    }

    if (rootName === "Não alcoólicas") {
      if (childName === "Energéticos") {
        const bases = [
          { name: "Red Bull", brand: "Red Bull", size: "250ml", base: 9.9 },
          { name: "Red Bull", brand: "Red Bull", size: "355ml", base: 12.9 },
          { name: "Monster", brand: "Monster", size: "473ml", base: 13.9 },
          { name: "TNT", brand: "TNT", size: "269ml", base: 7.9 },
          { name: "Fusion", brand: "Fusion", size: "269ml", base: 6.9 },
        ];
        return bases.map((b) => ({
          name: `${b.name} ${leafName} ${b.size}`,
          brand: b.brand,
          unitLabel: "lata",
          sizeLabel: b.size,
          priceBase: b.base,
          badges: ["gelada"],
          image,
        }));
      }
      if (childName === "Refrigerantes") {
        return [
          { name: `Coca-Cola ${leafName} Lata 350ml`, brand: "Coca-Cola", unitLabel: "lata", sizeLabel: "350ml", priceBase: 4.99, badges: ["gelada"], image },
          { name: `Guaraná ${leafName} Lata 350ml`, brand: "Guaraná", unitLabel: "lata", sizeLabel: "350ml", priceBase: 4.49, badges: ["gelada"], image },
          { name: `Coca-Cola ${leafName} 2L`, brand: "Coca-Cola", unitLabel: "garrafa", sizeLabel: "2L", priceBase: 10.99, badges: [], image },
          { name: `Guaraná ${leafName} 2L`, brand: "Guaraná", unitLabel: "garrafa", sizeLabel: "2L", priceBase: 9.99, badges: [], image },
        ];
      }
      if (childName === "Águas & Isotônicos") {
        return [
          { name: `Água Mineral ${leafName} 500ml`, brand: "Bonafont", unitLabel: "garrafa", sizeLabel: "500ml", priceBase: 2.49, badges: [], image },
          { name: `Água Mineral ${leafName} 1,5L`, brand: "Crystal", unitLabel: "garrafa", sizeLabel: "1,5L", priceBase: 3.99, badges: [], image },
          { name: `Isotônico ${leafName} 500ml`, brand: "Gatorade", unitLabel: "garrafa", sizeLabel: "500ml", priceBase: 6.99, badges: [], image },
        ];
      }
      return [
        { name: `${childName} ${leafName} 1L`, brand: "Seleção", unitLabel: "garrafa", sizeLabel: "1L", priceBase: 7.99, badges: [], image },
      ];
    }

    if (rootName === "Conveniência") {
      if (childName === "Gelo") {
        return [
          { name: "Gelo Saco 2kg", brand: "Gelo", unitLabel: "saco", sizeLabel: "2kg", priceBase: 8.9, badges: [], image },
          { name: "Gelo Saco 5kg", brand: "Gelo", unitLabel: "saco", sizeLabel: "5kg", priceBase: 17.9, badges: [], image },
        ];
      }
      if (childName === "Snacks") {
        return [
          { name: "Amendoim Torrado 150g", brand: "Snack", unitLabel: "pacote", sizeLabel: "150g", priceBase: 6.9, badges: [], image },
          { name: "Amendoim Torrado 500g", brand: "Snack", unitLabel: "pacote", sizeLabel: "500g", priceBase: 16.9, badges: [], image },
          { name: "Batata Chips 120g", brand: "Elma Chips", unitLabel: "pacote", sizeLabel: "120g", priceBase: 11.9, badges: [], image },
          { name: "Doritos 140g", brand: "Elma Chips", unitLabel: "pacote", sizeLabel: "140g", priceBase: 12.9, badges: [], image },
          { name: "Salgadinho Queijo 90g", brand: "Snack", unitLabel: "pacote", sizeLabel: "90g", priceBase: 7.9, badges: [], image },
          { name: "Mix de Nuts 200g", brand: "Snack", unitLabel: "pacote", sizeLabel: "200g", priceBase: 18.9, badges: [], image },
        ];
      }
      if (childName === "Acessórios") {
        return [
          { name: "Abridor de Garrafas", brand: "Acessórios", unitLabel: "unidade", sizeLabel: "1 un", priceBase: 9.9, badges: [], image },
          { name: "Copo Long Drink", brand: "Acessórios", unitLabel: "unidade", sizeLabel: "1 un", priceBase: 12.9, badges: [], image },
          { name: "Balde de Gelo", brand: "Acessórios", unitLabel: "unidade", sizeLabel: "1 un", priceBase: 24.9, badges: [], image },
        ];
      }
      return [
        { name: `${childName} ${leafName}`, brand: "Conveniência", unitLabel: "unidade", sizeLabel: "1 un", priceBase: 9.9, badges: [], image },
      ];
    }

    return [{ name: `${rootName} ${childName} ${leafName}`, brand: "Seleção", unitLabel: "unidade", sizeLabel: "1 un", priceBase: 19.9, badges: [], image }];
  }

  for (const { category, target } of perLeaf) {
    const l = lineage({ categoryId: category.id, byId });
    assert(l, `categoria neta inválida: ${category.id}`);
    const variants = variantsForLeaf({ rootName: l.root.name, childName: l.child.name, leafName: l.leaf.name });
    for (let i = 0; i < target; i += 1) {
      const v = variants[i % variants.length];
      const extra = i >= variants.length ? ` ${Math.floor(i / variants.length) + 2}` : "";
      addProduct({
        name: `${v.name}${extra}`.trim(),
        brand: v.brand,
        unitLabel: v.unitLabel,
        sizeLabel: v.sizeLabel,
        priceBase: v.priceBase,
        badges: v.badges,
        image: v.image,
        categoryId: category.id,
      });
    }
  }

  return products;
}

function validateSeed({ config, categories, products, brands }) {
  const { byId, childrenByParentId } = buildMaps(categories);

  const categorySlugs = new Set();
  for (const c of categories) {
    assert(typeof c.id === "number" && Number.isFinite(c.id), "categoria.id deve ser number");
    assert(typeof c.parentId === "number" && Number.isFinite(c.parentId), `categoria.parentId inválido (id=${c.id})`);
    assert(typeof c.slug === "string" && c.slug.length > 0, `categoria.slug inválido (id=${c.id})`);
    assert(c.slug.startsWith("/categoria/"), `categoria.slug deve começar com /categoria/ (id=${c.id})`);
    assert(!categorySlugs.has(c.slug), `categoria.slug duplicado (${c.slug})`);
    categorySlugs.add(c.slug);
    assert(c.parentId === 0 || byId.has(c.parentId), `categoria.parentId inválido (${c.parentId})`);
  }

  const roots = childrenByParentId.get(0) ?? [];
  assert(roots.length >= config.categories.rootsMin, `menos de ${config.categories.rootsMin} raízes`);

  for (const root of roots) {
    const children = childrenByParentId.get(root.id) ?? [];
    assert(
      children.length >= config.categories.childrenMin && children.length <= config.categories.childrenMax,
      `raiz ${root.id} com filhos fora do intervalo (${children.length})`,
    );
    for (const child of children) {
      const grands = childrenByParentId.get(child.id) ?? [];
      assert(
        grands.length >= config.categories.grandchildrenMin && grands.length <= config.categories.grandchildrenMax,
        `filho ${child.id} com netos fora do intervalo (${grands.length})`,
      );
    }
  }

  assert(products.length >= config.products.minTotal, `menos de ${config.products.minTotal} produtos`);

  const brandsById = new Map();
  const brandsByName = new Map();
  for (const b of brands ?? []) {
    assert(typeof b.id === "number" && Number.isFinite(b.id), "brand.id deve ser number");
    assert(typeof b.name === "string" && b.name.length > 0, "brand.name deve ser string");
    assert(typeof b.slug === "string" && b.slug.length > 0, "brand.slug deve ser string");
    assert(b.slug.startsWith("/marca/"), "brand.slug deve começar com /marca/");
    assert(typeof b.image === "string" && b.image.length > 0, "brand.image deve ser string");
    assert(!brandsById.has(b.id), `brand.id duplicado (${b.id})`);
    assert(!brandsByName.has(b.name), `brand.name duplicado (${b.name})`);
    brandsById.set(b.id, b);
    brandsByName.set(b.name, b);
  }

  const productIds = new Set();
  const productSlugs = new Set();
  for (const p of products) {
    assert(typeof p.id === "number" && Number.isFinite(p.id), "produto.id deve ser number");
    assert(!productIds.has(p.id), `produto.id duplicado (${p.id})`);
    productIds.add(p.id);

    assert(typeof p.slug === "string" && p.slug.length > 0, "produto.slug deve ser string");
    assert(p.slug.startsWith("/produtos/"), `produto.slug deve começar com /produtos/ (id=${p.id})`);
    assert(!productSlugs.has(p.slug), `produto.slug duplicado (${p.slug})`);
    productSlugs.add(p.slug);

    assert(typeof p.category === "object" && p.category, `produto.category inválido (id=${p.id})`);
    assert(typeof p.category.id === "number" && Number.isFinite(p.category.id), `produto.category.id inválido (id=${p.id})`);
    assert(byId.has(p.category.id), `produto.category.id inválido (${p.category.id})`);
    assert(isGrandchildCategory({ categoryId: p.category.id, byId }), `produto.category.id não é categoria neta (${p.category.id})`);
    assert(typeof p.category.name === "string" && p.category.name.length > 0, `produto.category.name inválido (id=${p.id})`);
    assert(typeof p.category.slug === "string" && p.category.slug.length > 0, `produto.category.slug inválido (id=${p.id})`);
    assert(p.category.slug.startsWith("/categoria/"), `produto.category.slug deve começar com /categoria/ (id=${p.id})`);
    assert(byId.get(p.category.id)?.name === p.category.name, `produto.category.name não confere (id=${p.id})`);
    assert(byId.get(p.category.id)?.slug === p.category.slug, `produto.category.slug não confere (id=${p.id})`);
    assert(Array.isArray(p.category.familia) && p.category.familia.length > 0, `produto.category.familia inválido (id=${p.id})`);
    assert(p.category.familia[p.category.familia.length - 1]?.id === p.category.id, `produto.category.familia não termina na categoria (id=${p.id})`);
    for (const item of p.category.familia) {
      assert(typeof item?.id === "number" && Number.isFinite(item.id), `produto.categoryFamilia.id inválido (id=${p.id})`);
      assert(typeof item?.name === "string" && item.name.length > 0, `produto.categoryFamilia.name inválido (id=${p.id})`);
      assert(typeof item?.slug === "string" && item.slug.length > 0, `produto.categoryFamilia.slug inválido (id=${p.id})`);
      assert(item.slug.startsWith("/categoria/"), `produto.categoryFamilia.slug deve começar com /categoria/ (id=${p.id})`);
      assert(byId.get(item.id)?.name === item.name, `produto.categoryFamilia.name não confere (id=${p.id})`);
      assert(byId.get(item.id)?.slug === item.slug, `produto.categoryFamilia.slug não confere (id=${p.id})`);
    }
    assert(typeof p.brand === "object" && p.brand, `produto.brand inválido (id=${p.id})`);
    assert(typeof p.brand.id === "number" && Number.isFinite(p.brand.id), `produto.brand.id inválido (id=${p.id})`);
    assert(typeof p.brand.name === "string" && p.brand.name.length > 0, `produto.brand.name inválido (id=${p.id})`);
    assert(typeof p.brand.slug === "string" && p.brand.slug.length > 0, `produto.brand.slug inválido (id=${p.id})`);
    assert(p.brand.slug.startsWith("/marca/"), `produto.brand.slug deve começar com /marca/ (id=${p.id})`);
    assert(typeof p.brand.image === "string" && p.brand.image.length > 0, `produto.brand.image inválido (id=${p.id})`);
    assert(brandsById.has(p.brand.id), `produto.brand.id não existe em brands.json (id=${p.id})`);
    assert(brandsByName.has(p.brand.name), `produto.brand.name não existe em brands.json (id=${p.id})`);
    assert(typeof p.stock === "number" && Number.isFinite(p.stock), "produto.stock deve ser number");
    assert(typeof p.inStock === "boolean", "produto.inStock deve ser boolean");
    assert((p.stock > 0) === p.inStock, `inStock inconsistente (id=${p.id}, stock=${p.stock})`);
  }
}

function main() {
  const args = parseArgs(process.argv);
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const projectDir = path.resolve(__dirname, "..");

  const { configFile, config } = readConfig({ projectDir, args });
  const outputDir = path.resolve(projectDir, config.outputDir);

  const categories = buildCategories({ config });
  const products = buildProducts({ config, categories });
  const brands = buildBrands({ products });
  validateSeed({ config, categories, products, brands });

  ensureDir(outputDir);
  const categoriasFile = path.join(outputDir, "categorias.json");
  const produtosFile = path.join(outputDir, "produtos.json");
  const brandsFile = path.join(outputDir, "brands.json");
  writeJson(categoriasFile, categories);
  writeJson(produtosFile, products);
  writeJson(brandsFile, brands);

  const { byId, childrenByParentId } = buildMaps(categories);
  const roots = (childrenByParentId.get(0) ?? []).length;
  const leafCount = categories.filter((c) => isGrandchildCategory({ categoryId: c.id, byId })).length;

  console.log(
    JSON.stringify(
      {
        ok: true,
        configFile,
        outputDir,
        summary: {
          categorias: categories.length,
          raizes: roots,
          categoriasNetas: leafCount,
          produtos: products.length,
        },
      },
      null,
      2,
    ),
  );
}

main();
