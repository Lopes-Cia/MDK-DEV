import fs from "node:fs";
import path from "node:path";

const CWD = process.cwd();
const ROOT = fs.existsSync(path.join(CWD, "adega-lopes")) ? CWD : path.resolve(CWD, "WWW", "MICROSERVICE", "MOCK-END");

function slugify(input) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateCatalog({ tenant, categories, products }) {
  const categoryIds = new Set(categories.map((c) => c.id));
  const productIds = new Set();
  const productSlugs = new Set();

  for (const c of categories) {
    assert(typeof c.id === "number", `[${tenant}] categoria.id deve ser number`);
    assert(typeof c.name === "string", `[${tenant}] categoria.name deve ser string`);
    assert(typeof c.slug === "string", `[${tenant}] categoria.slug deve ser string`);
    assert(typeof c.parentId === "number", `[${tenant}] categoria.parentId deve ser number`);
    assert(typeof c.order === "number", `[${tenant}] categoria.order deve ser number`);
    assert(c.parentId === 0 || categoryIds.has(c.parentId), `[${tenant}] categoria.parentId inválido (${c.parentId})`);
  }

  for (const p of products) {
    assert(typeof p.id === "number", `[${tenant}] produto.id deve ser number`);
    assert(!productIds.has(p.id), `[${tenant}] produto.id duplicado (${p.id})`);
    productIds.add(p.id);

    assert(typeof p.slug === "string", `[${tenant}] produto.slug deve ser string`);
    assert(!productSlugs.has(p.slug), `[${tenant}] produto.slug duplicado (${p.slug})`);
    productSlugs.add(p.slug);

    assert(categoryIds.has(p.categoryId), `[${tenant}] produto.categoryId inválido (${p.categoryId})`);
    assert(typeof p.stock === "number", `[${tenant}] produto.stock deve ser number`);
    assert(typeof p.inStock === "boolean", `[${tenant}] produto.inStock deve ser boolean`);
    assert((p.stock > 0) === p.inStock, `[${tenant}] inStock inconsistente (stock=${p.stock})`);
  }
}

function buildAdegaCategories() {
  return [
    { id: 10, name: "Bebidas", slug: "bebidas", parentId: 0, image: "/assets/categories/bebidas.webp", order: 10 },
    { id: 20, name: "Cervejas", slug: "cervejas", parentId: 10, image: "/assets/categories/cervejas.webp", order: 20 },
    { id: 30, name: "Lager", slug: "lager", parentId: 20, image: "/assets/categories/lager.webp", order: 30 },
    { id: 31, name: "IPA", slug: "ipa", parentId: 20, image: "/assets/categories/ipa.webp", order: 31 },

    { id: 40, name: "Destilados", slug: "destilados", parentId: 10, image: "/assets/categories/destilados.webp", order: 40 },
    { id: 50, name: "Vodka", slug: "vodka", parentId: 40, image: "/assets/categories/vodka.webp", order: 50 },
    { id: 51, name: "Gin", slug: "gin", parentId: 40, image: "/assets/categories/gin.webp", order: 51 },
    { id: 52, name: "Whisky", slug: "whisky", parentId: 40, image: "/assets/categories/whisky.webp", order: 52 },

    { id: 60, name: "Vinhos", slug: "vinhos", parentId: 10, image: "/assets/categories/vinhos.webp", order: 60 },
    { id: 70, name: "Tintos", slug: "tintos", parentId: 60, image: "/assets/categories/tintos.webp", order: 70 },
    { id: 71, name: "Brancos", slug: "brancos", parentId: 60, image: "/assets/categories/brancos.webp", order: 71 },

    { id: 80, name: "Não alcoólicas", slug: "nao-alcoolicas", parentId: 10, image: "/assets/categories/nao-alcoolicas.webp", order: 80 },
    { id: 90, name: "Energéticos", slug: "energeticos", parentId: 80, image: "/assets/categories/energeticos.webp", order: 90 },
    { id: 91, name: "Refrigerantes", slug: "refrigerantes", parentId: 80, image: "/assets/categories/refrigerantes.webp", order: 91 },

    { id: 110, name: "Conveniência", slug: "conveniencia", parentId: 0, image: "/assets/categories/conveniencia.webp", order: 110 },
    { id: 120, name: "Gelo", slug: "gelo", parentId: 110, image: "/assets/categories/gelo.webp", order: 120 },
    { id: 130, name: "Saco 2kg", slug: "saco-2kg", parentId: 120, image: "/assets/categories/saco-2kg.webp", order: 130 },
    { id: 140, name: "Snacks", slug: "snacks", parentId: 110, image: "/assets/categories/snacks.webp", order: 140 },
    { id: 150, name: "Salgadinhos", slug: "salgadinhos", parentId: 140, image: "/assets/categories/salgadinhos.webp", order: 150 },
    { id: 151, name: "Amendoim", slug: "amendoim", parentId: 140, image: "/assets/categories/amendoim.webp", order: 151 },
  ];
}

function buildMerceariaCategories() {
  return [
    { id: 10, name: "Alimentos", slug: "alimentos", parentId: 0, image: "/assets/categories/alimentos.webp", order: 10 },
    { id: 20, name: "Essenciais", slug: "essenciais", parentId: 10, image: "/assets/categories/essenciais.webp", order: 20 },
    { id: 30, name: "Arroz", slug: "arroz", parentId: 20, image: "/assets/categories/arroz.webp", order: 30 },
    { id: 31, name: "Feijão", slug: "feijao", parentId: 20, image: "/assets/categories/feijao.webp", order: 31 },
    { id: 32, name: "Açúcar", slug: "acucar", parentId: 20, image: "/assets/categories/acucar.webp", order: 32 },
    { id: 33, name: "Óleo", slug: "oleo", parentId: 20, image: "/assets/categories/oleo.webp", order: 33 },
    { id: 34, name: "Macarrão", slug: "macarrao", parentId: 20, image: "/assets/categories/macarrao.webp", order: 34 },
    { id: 35, name: "Farinhas", slug: "farinhas", parentId: 20, image: "/assets/categories/farinhas.webp", order: 35 },
    { id: 36, name: "Sal & Temperos", slug: "sal-e-temperos", parentId: 20, image: "/assets/categories/sal-e-temperos.webp", order: 36 },

    { id: 40, name: "Café da manhã", slug: "cafe-da-manha", parentId: 10, image: "/assets/categories/cafe-da-manha.webp", order: 40 },
    { id: 50, name: "Pães", slug: "paes", parentId: 40, image: "/assets/categories/paes.webp", order: 50 },
    { id: 51, name: "Cafés", slug: "cafes", parentId: 40, image: "/assets/categories/cafes.webp", order: 51 },
    { id: 52, name: "Achocolatados", slug: "achocolatados", parentId: 40, image: "/assets/categories/achocolatados.webp", order: 52 },
    { id: 53, name: "Biscoitos", slug: "biscoitos", parentId: 40, image: "/assets/categories/biscoitos.webp", order: 53 },
    { id: 54, name: "Cereais", slug: "cereais", parentId: 40, image: "/assets/categories/cereais.webp", order: 54 },

    { id: 60, name: "Laticínios", slug: "laticinios", parentId: 10, image: "/assets/categories/laticinios.webp", order: 60 },
    { id: 70, name: "Leites", slug: "leites", parentId: 60, image: "/assets/categories/leites.webp", order: 70 },
    { id: 71, name: "Queijos", slug: "queijos", parentId: 60, image: "/assets/categories/queijos.webp", order: 71 },
    { id: 72, name: "Iogurtes", slug: "iogurtes", parentId: 60, image: "/assets/categories/iogurtes.webp", order: 72 },
    { id: 73, name: "Manteigas", slug: "manteigas", parentId: 60, image: "/assets/categories/manteigas.webp", order: 73 },
    { id: 74, name: "Requeijão", slug: "requeijao", parentId: 60, image: "/assets/categories/requeijao.webp", order: 74 },

    { id: 80, name: "Congelados", slug: "congelados", parentId: 10, image: "/assets/categories/congelados.webp", order: 80 },
    { id: 90, name: "Prontos", slug: "prontos", parentId: 80, image: "/assets/categories/prontos.webp", order: 90 },
    { id: 91, name: "Carnes", slug: "carnes", parentId: 80, image: "/assets/categories/carnes.webp", order: 91 },
    { id: 92, name: "Pães de queijo", slug: "paes-de-queijo", parentId: 80, image: "/assets/categories/paes-de-queijo.webp", order: 92 },
    { id: 93, name: "Batatas", slug: "batatas", parentId: 80, image: "/assets/categories/batatas.webp", order: 93 },

    { id: 100, name: "Bebidas (não alcoólicas)", slug: "bebidas-nao-alcoolicas", parentId: 10, image: "/assets/categories/bebidas-nao-alcoolicas.webp", order: 100 },
    { id: 110, name: "Águas", slug: "aguas", parentId: 100, image: "/assets/categories/aguas.webp", order: 110 },
    { id: 111, name: "Sucos", slug: "sucos", parentId: 100, image: "/assets/categories/sucos.webp", order: 111 },

    { id: 200, name: "Casa & Cuidados", slug: "casa-e-cuidados", parentId: 0, image: "/assets/categories/casa-e-cuidados.webp", order: 200 },
    { id: 210, name: "Limpeza", slug: "limpeza", parentId: 200, image: "/assets/categories/limpeza.webp", order: 210 },
    { id: 220, name: "Cozinha", slug: "cozinha", parentId: 210, image: "/assets/categories/cozinha.webp", order: 220 },
    { id: 221, name: "Lavanderia", slug: "lavanderia", parentId: 210, image: "/assets/categories/lavanderia.webp", order: 221 },

    { id: 230, name: "Higiene", slug: "higiene", parentId: 200, image: "/assets/categories/higiene.webp", order: 230 },
    { id: 240, name: "Papel higiênico", slug: "papel-higienico", parentId: 230, image: "/assets/categories/papel-higienico.webp", order: 240 },
    { id: 241, name: "Sabonetes", slug: "sabonetes", parentId: 230, image: "/assets/categories/sabonetes.webp", order: 241 },
    { id: 242, name: "Shampoo", slug: "shampoo", parentId: 230, image: "/assets/categories/shampoo.webp", order: 242 },
    { id: 243, name: "Creme dental", slug: "creme-dental", parentId: 230, image: "/assets/categories/creme-dental.webp", order: 243 },
    { id: 244, name: "Desodorantes", slug: "desodorantes", parentId: 230, image: "/assets/categories/desodorantes.webp", order: 244 },
  ];
}

function buildAdegaProducts({ targetCount }) {
  const products = [];
  let id = 1001;

  const placeholderImage = "/assets/products/placeholder.webp";

  const beerBrands = [
    { brand: "Heineken", family: "Lager" },
    { brand: "Brahma", family: "Lager" },
    { brand: "Budweiser", family: "Lager" },
    { brand: "Stella Artois", family: "Lager" },
    { brand: "Skol", family: "Lager" },
    { brand: "Amstel", family: "Lager" },
    { brand: "Corona", family: "Lager" },
  ];

  const beerSizes = ["269ml", "350ml", "473ml"];

  for (const b of beerBrands) {
    for (const size of beerSizes) {
      const name = `${b.brand} Lata ${size}`;
      products.push({
        id: id++,
        sku: `${slugify(b.brand).toUpperCase()}-LATA-${size.replace("ml", "")}`,
        name,
        slug: slugify(name),
        categoryId: b.family === "IPA" ? 31 : 30,
        brand: b.brand,
        unitLabel: "lata",
        sizeLabel: size,
        price: Number((4.49 + Math.random() * 4.5).toFixed(2)),
        compareAtPrice: null,
        badges: ["gelada"],
        image: placeholderImage,
        stock: 40 + Math.floor(Math.random() * 160),
        inStock: true,
      });
    }
  }

  const packBrands = ["Heineken", "Brahma", "Budweiser", "Amstel", "Skol"];
  const packOptions = [
    { packSize: 6, size: "350ml", unitLabel: "pack", priceBase: 27.9 },
    { packSize: 12, size: "350ml", unitLabel: "caixa", priceBase: 52.9 },
  ];
  for (const brand of packBrands) {
    for (const opt of packOptions) {
      const name = `${brand} ${opt.packSize}x ${opt.size}`;
      products.push({
        id: id++,
        sku: `${slugify(brand).toUpperCase()}-${opt.packSize}X-${opt.size.replace("ml", "")}`,
        name,
        slug: slugify(name),
        categoryId: 30,
        brand,
        unitLabel: opt.unitLabel,
        sizeLabel: `${opt.packSize}x ${opt.size}`,
        price: Number((opt.priceBase + Math.random() * 10).toFixed(2)),
        compareAtPrice: null,
        badges: ["combo"],
        image: placeholderImage,
        stock: 10 + Math.floor(Math.random() * 90),
        inStock: true,
      });
    }
  }

  const spirits = [
    { name: "Vodka Absolut 1L", brand: "Absolut", categoryId: 50, price: 99.9 },
    { name: "Vodka Smirnoff 998ml", brand: "Smirnoff", categoryId: 50, price: 49.9 },
    { name: "Vodka Orloff 1L", brand: "Orloff", categoryId: 50, price: 39.9 },
    { name: "Gin Tanqueray 750ml", brand: "Tanqueray", categoryId: 51, price: 129.9 },
    { name: "Gin Beefeater 750ml", brand: "Beefeater", categoryId: 51, price: 119.9 },
    { name: "Gin Bombay Sapphire 750ml", brand: "Bombay Sapphire", categoryId: 51, price: 159.9 },
    { name: "Whisky Johnnie Walker Red 1L", brand: "Johnnie Walker", categoryId: 52, price: 119.9 },
    { name: "Whisky Ballantine's 1L", brand: "Ballantine's", categoryId: 52, price: 109.9 },
    { name: "Whisky Jack Daniel's 1L", brand: "Jack Daniel's", categoryId: 52, price: 169.9 },
  ];

  for (const s of spirits) {
    products.push({
      id: id++,
      sku: slugify(s.name).toUpperCase(),
      name: s.name,
      slug: slugify(s.name),
      categoryId: s.categoryId,
      brand: s.brand,
      unitLabel: "garrafa",
      sizeLabel: s.name.match(/(\d+(ml|l))/i)?.[0]?.toLowerCase() ?? "750ml",
      price: Number((s.price + Math.random() * 10).toFixed(2)),
      compareAtPrice: null,
      badges: [],
      image: placeholderImage,
      stock: 5 + Math.floor(Math.random() * 35),
      inStock: true,
    });
  }

  const wines = [
    { name: "Vinho Tinto Seco 750ml", brand: "Casillero del Diablo", categoryId: 70, price: 79.9 },
    { name: "Vinho Tinto Suave 750ml", brand: "Concha y Toro", categoryId: 70, price: 39.9 },
    { name: "Vinho Tinto Reserva 750ml", brand: "Miolo", categoryId: 70, price: 69.9 },
    { name: "Vinho Branco Seco 750ml", brand: "Santa Helena", categoryId: 71, price: 44.9 },
    { name: "Vinho Branco Suave 750ml", brand: "Aurora", categoryId: 71, price: 34.9 },
    { name: "Vinho Rosé 750ml", brand: "Miolo", categoryId: 71, price: 54.9 },
  ];

  for (const w of wines) {
    products.push({
      id: id++,
      sku: slugify(w.name).toUpperCase(),
      name: w.name,
      slug: slugify(w.name),
      categoryId: w.categoryId,
      brand: w.brand,
      unitLabel: "garrafa",
      sizeLabel: "750ml",
      price: Number((w.price + Math.random() * 8).toFixed(2)),
      compareAtPrice: null,
      badges: [],
      image: placeholderImage,
      stock: 8 + Math.floor(Math.random() * 40),
      inStock: true,
    });
  }

  const energy = [
    { name: "Red Bull 250ml", brand: "Red Bull", sizeLabel: "250ml", price: 9.9 },
    { name: "Red Bull 355ml", brand: "Red Bull", sizeLabel: "355ml", price: 12.9 },
    { name: "Monster 473ml", brand: "Monster", sizeLabel: "473ml", price: 13.9 },
    { name: "TNT 269ml", brand: "TNT", sizeLabel: "269ml", price: 7.9 },
    { name: "Fusion 269ml", brand: "Fusion", sizeLabel: "269ml", price: 6.9 },
  ];

  for (const e of energy) {
    products.push({
      id: id++,
      sku: slugify(e.name).toUpperCase(),
      name: e.name,
      slug: slugify(e.name),
      categoryId: 90,
      brand: e.brand,
      unitLabel: "lata",
      sizeLabel: e.sizeLabel,
      price: Number((e.price + Math.random() * 2).toFixed(2)),
      compareAtPrice: null,
      badges: [],
      image: placeholderImage,
      stock: 20 + Math.floor(Math.random() * 120),
      inStock: true,
    });
  }

  const sodas = [
    { name: "Coca-Cola Lata 350ml", brand: "Coca-Cola", sizeLabel: "350ml", price: 4.99 },
    { name: "Coca-Cola Zero Lata 350ml", brand: "Coca-Cola", sizeLabel: "350ml", price: 4.99 },
    { name: "Guaraná Lata 350ml", brand: "Guaraná", sizeLabel: "350ml", price: 4.49 },
    { name: "Fanta Laranja Lata 350ml", brand: "Fanta", sizeLabel: "350ml", price: 4.49 },
    { name: "Sprite Lata 350ml", brand: "Sprite", sizeLabel: "350ml", price: 4.49 },
    { name: "Coca-Cola 2L", brand: "Coca-Cola", sizeLabel: "2L", price: 10.99 },
    { name: "Guaraná 2L", brand: "Guaraná", sizeLabel: "2L", price: 9.99 },
  ];

  for (const r of sodas) {
    products.push({
      id: id++,
      sku: slugify(r.name).toUpperCase(),
      name: r.name,
      slug: slugify(r.name),
      categoryId: 91,
      brand: r.brand,
      unitLabel: r.sizeLabel === "2L" ? "garrafa" : "lata",
      sizeLabel: r.sizeLabel,
      price: Number((r.price + Math.random() * 1.5).toFixed(2)),
      compareAtPrice: null,
      badges: [],
      image: placeholderImage,
      stock: 25 + Math.floor(Math.random() * 160),
      inStock: true,
    });
  }

  const convenience = [
    { name: "Gelo Saco 2kg", brand: "Gelo", unitLabel: "saco", sizeLabel: "2kg", price: 8.9, categoryId: 130 },
    { name: "Amendoim Torrado 150g", brand: "Snack", unitLabel: "pacote", sizeLabel: "150g", price: 6.9, categoryId: 151 },
    { name: "Amendoim Torrado 500g", brand: "Snack", unitLabel: "pacote", sizeLabel: "500g", price: 16.9, categoryId: 151 },
    { name: "Batata Chips 120g", brand: "Elma Chips", unitLabel: "pacote", sizeLabel: "120g", price: 11.9, categoryId: 150 },
    { name: "Doritos 140g", brand: "Elma Chips", unitLabel: "pacote", sizeLabel: "140g", price: 12.9, categoryId: 150 },
    { name: "Salgadinho Queijo 90g", brand: "Snack", unitLabel: "pacote", sizeLabel: "90g", price: 7.9, categoryId: 150 },
  ];

  for (const c of convenience) {
    products.push({
      id: id++,
      sku: slugify(c.name).toUpperCase(),
      name: c.name,
      slug: slugify(c.name),
      categoryId: c.categoryId,
      brand: c.brand,
      unitLabel: c.unitLabel,
      sizeLabel: c.sizeLabel,
      price: Number((c.price + Math.random() * 1.5).toFixed(2)),
      compareAtPrice: null,
      badges: [],
      image: placeholderImage,
      stock: 15 + Math.floor(Math.random() * 120),
      inStock: true,
    });
  }

  const outOfStockIndexes = [2, 7, 15];
  for (const idx of outOfStockIndexes) {
    if (products[idx]) {
      products[idx].stock = 0;
      products[idx].inStock = false;
    }
  }

  const promoIndexes = [0, 10, 25];
  for (const idx of promoIndexes) {
    if (products[idx]) {
      const p = products[idx];
      p.compareAtPrice = Number((p.price + Math.max(1, p.price * 0.15)).toFixed(2));
      p.badges = Array.from(new Set([...(p.badges ?? []), "promo"]));
    }
  }

  return products.slice(0, targetCount);
}

function buildMerceariaProducts({ targetCount }) {
  const products = [];
  let id = 2001;
  const placeholderImage = "/assets/products/placeholder.webp";
  const slugs = new Set();

  function add({ name, brand, categoryId, unitLabel, sizeLabel, price, badges }) {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    if (slugs.has(slug)) slug = `${baseSlug}-${slugify(brand)}`;
    if (slugs.has(slug)) slug = `${baseSlug}-${slugify(brand)}-${id}`;
    slugs.add(slug);
    products.push({
      id: id++,
      sku: slugify(`${brand}-${name}`).toUpperCase(),
      name,
      slug,
      categoryId,
      brand,
      unitLabel,
      sizeLabel,
      price: Number(price.toFixed(2)),
      compareAtPrice: null,
      badges: badges ?? [],
      image: placeholderImage,
      stock: 10 + Math.floor(Math.random() * 190),
      inStock: true,
    });
  }

  const riceBrands = ["Tio João", "Camil", "Prato Fino"];
  const riceSizes = ["1kg", "5kg"];
  for (const b of riceBrands) {
    for (const s of riceSizes) {
      add({ name: `Arroz ${b} ${s}`, brand: b, categoryId: 30, unitLabel: "pacote", sizeLabel: s, price: s === "5kg" ? 34.9 : 8.9, badges: ["essencial"] });
    }
  }

  const beanBrands = ["Kicaldo", "Camil", "Broto Legal"];
  for (const b of beanBrands) {
    add({ name: `Feijão Carioca ${b} 1kg`, brand: b, categoryId: 31, unitLabel: "pacote", sizeLabel: "1kg", price: 9.9, badges: ["essencial"] });
    add({ name: `Feijão Preto ${b} 1kg`, brand: b, categoryId: 31, unitLabel: "pacote", sizeLabel: "1kg", price: 10.9, badges: ["essencial"] });
  }

  add({ name: "Açúcar Refinado 1kg", brand: "União", categoryId: 32, unitLabel: "pacote", sizeLabel: "1kg", price: 6.9, badges: ["essencial"] });
  add({ name: "Açúcar Cristal 1kg", brand: "Caravelas", categoryId: 32, unitLabel: "pacote", sizeLabel: "1kg", price: 5.9, badges: ["essencial"] });

  add({ name: "Óleo de Soja 900ml", brand: "Liza", categoryId: 33, unitLabel: "garrafa", sizeLabel: "900ml", price: 9.9, badges: ["essencial"] });
  add({ name: "Óleo de Soja 900ml", brand: "Soya", categoryId: 33, unitLabel: "garrafa", sizeLabel: "900ml", price: 9.5, badges: ["essencial"] });

  const pastas = [
    { brand: "Adria", type: "Espaguete", price: 6.9 },
    { brand: "Renata", type: "Penne", price: 7.9 },
    { brand: "Barilla", type: "Espaguete", price: 12.9 },
    { brand: "Barilla", type: "Penne", price: 12.9 },
    { brand: "Adria", type: "Parafuso", price: 6.9 },
    { brand: "Renata", type: "Parafuso", price: 7.9 },
  ];
  for (const m of pastas) {
    add({ name: `Macarrão ${m.type} ${m.brand} 500g`, brand: m.brand, categoryId: 34, unitLabel: "pacote", sizeLabel: "500g", price: m.price, badges: ["essencial"] });
  }

  const flours = [
    { brand: "Dona Benta", name: "Farinha de Trigo", size: "1kg", price: 7.9 },
    { brand: "Renata", name: "Farinha de Trigo", size: "1kg", price: 6.9 },
    { brand: "Yoki", name: "Farinha de Mandioca", size: "500g", price: 6.9 },
  ];
  for (const f of flours) {
    add({ name: `${f.name} ${f.brand} ${f.size}`, brand: f.brand, categoryId: 35, unitLabel: "pacote", sizeLabel: f.size, price: f.price, badges: ["essencial"] });
  }

  const seasonings = [
    { brand: "Cisne", name: "Sal Refinado", size: "1kg", price: 3.49 },
    { brand: "Lebre", name: "Sal Refinado", size: "1kg", price: 2.99 },
    { brand: "Kitano", name: "Orégano", size: "10g", price: 2.99 },
    { brand: "Kitano", name: "Pimenta-do-reino", size: "20g", price: 6.49 },
  ];
  for (const s of seasonings) {
    add({ name: `${s.name} ${s.brand} ${s.size}`, brand: s.brand, categoryId: 36, unitLabel: "unidade", sizeLabel: s.size, price: s.price, badges: [] });
  }

  const breads = [
    { name: "Pão de Forma Tradicional", brand: "Wickbold", size: "500g", price: 11.9 },
    { name: "Pão de Forma Integral", brand: "Wickbold", size: "500g", price: 12.9 },
    { name: "Pão de Forma Tradicional", brand: "Pullman", size: "500g", price: 10.9 },
    { name: "Pão de Forma Integral", brand: "Pullman", size: "500g", price: 11.9 },
  ];
  for (const p of breads) {
    add({ name: `${p.name} ${p.size}`, brand: p.brand, categoryId: 50, unitLabel: "pacote", sizeLabel: p.size, price: p.price, badges: [] });
  }

  const coffees = ["3 Corações", "Melitta", "Pilão"];
  for (const b of coffees) {
    add({ name: `Café Torrado e Moído ${b} 500g`, brand: b, categoryId: 51, unitLabel: "pacote", sizeLabel: "500g", price: 18.9, badges: ["mais-vendido"] });
  }

  const chocos = [
    { brand: "Nescau", size: "400g", price: 12.9 },
    { brand: "Toddy", size: "400g", price: 11.9 },
  ];
  for (const c of chocos) {
    add({ name: `Achocolatado ${c.brand} ${c.size}`, brand: c.brand, categoryId: 52, unitLabel: "lata", sizeLabel: c.size, price: c.price, badges: [] });
  }

  const cookies = [
    { brand: "Oreo", name: "Biscoito Recheado", size: "90g", price: 4.99 },
    { brand: "Trakinas", name: "Biscoito Recheado", size: "126g", price: 4.49 },
    { brand: "Passatempo", name: "Biscoito Recheado", size: "130g", price: 4.59 },
    { brand: "Club Social", name: "Biscoito Salgado", size: "144g", price: 6.99 },
    { brand: "Bauducco", name: "Biscoito Wafer", size: "140g", price: 6.49 },
    { brand: "Piraquê", name: "Biscoito Maizena", size: "200g", price: 6.99 },
    { brand: "Marilan", name: "Biscoito Cream Cracker", size: "200g", price: 5.99 },
    { brand: "Nestlé", name: "Biscoito Bono", size: "90g", price: 4.79 },
  ];
  for (const b of cookies) {
    add({ name: `${b.name} ${b.brand} ${b.size}`, brand: b.brand, categoryId: 53, unitLabel: "pacote", sizeLabel: b.size, price: b.price, badges: [] });
  }

  const cereals = [
    { brand: "Nescau", name: "Cereal Matinal", size: "250g", price: 12.9 },
    { brand: "Sucrilhos", name: "Cereal Matinal", size: "240g", price: 13.9 },
    { brand: "Granola", name: "Granola Tradicional", size: "300g", price: 14.9 },
    { brand: "Quaker", name: "Aveia em Flocos", size: "170g", price: 7.9 },
  ];
  for (const c of cereals) {
    add({ name: `${c.name} ${c.brand} ${c.size}`, brand: c.brand, categoryId: 54, unitLabel: "pacote", sizeLabel: c.size, price: c.price, badges: [] });
  }

  const milks = [
    { brand: "Italac", price: 5.49 },
    { brand: "Piracanjuba", price: 5.99 },
    { brand: "Parmalat", price: 5.79 },
  ];
  for (const m of milks) {
    add({ name: `Leite UHT Integral ${m.brand} 1L`, brand: m.brand, categoryId: 70, unitLabel: "caixa", sizeLabel: "1L", price: m.price, badges: ["essencial"] });
    add({ name: `Leite UHT Desnatado ${m.brand} 1L`, brand: m.brand, categoryId: 70, unitLabel: "caixa", sizeLabel: "1L", price: m.price + 0.2, badges: [] });
  }

  const yogurts = [
    { brand: "Nestlé", flavor: "Morango", price: 3.49 },
    { brand: "Vigor", flavor: "Natural", price: 3.29 },
    { brand: "Danone", flavor: "Morango", price: 3.59 },
    { brand: "Danone", flavor: "Banana", price: 3.59 },
  ];
  for (const y of yogurts) {
    add({ name: `Iogurte ${y.brand} ${y.flavor} 170g`, brand: y.brand, categoryId: 72, unitLabel: "unidade", sizeLabel: "170g", price: y.price, badges: [] });
  }

  const cheeses = [
    { brand: "Tirolez", name: "Queijo Muçarela Fatiado", size: "300g", price: 16.9 },
    { brand: "Sadia", name: "Queijo Prato Fatiado", size: "300g", price: 17.9 },
  ];
  for (const c of cheeses) {
    add({ name: `${c.name} ${c.size}`, brand: c.brand, categoryId: 71, unitLabel: "pacote", sizeLabel: c.size, price: c.price, badges: [] });
  }

  const butters = [
    { brand: "Aviação", name: "Manteiga", size: "200g", price: 13.9 },
    { brand: "Itambé", name: "Manteiga", size: "200g", price: 12.9 },
    { brand: "Qualy", name: "Manteiga", size: "200g", price: 11.9 },
    { brand: "Vigor", name: "Manteiga", size: "200g", price: 12.9 },
  ];
  for (const b of butters) {
    add({ name: `${b.name} ${b.brand} ${b.size}`, brand: b.brand, categoryId: 73, unitLabel: "unidade", sizeLabel: b.size, price: b.price, badges: [] });
  }

  const requeijoes = [
    { brand: "Catupiry", size: "250g", price: 14.9 },
    { brand: "Vigor", size: "200g", price: 10.9 },
    { brand: "Danone", size: "200g", price: 11.9 },
    { brand: "Nestlé", size: "200g", price: 10.9 },
  ];
  for (const r of requeijoes) {
    add({ name: `Requeijão Cremoso ${r.brand} ${r.size}`, brand: r.brand, categoryId: 74, unitLabel: "unidade", sizeLabel: r.size, price: r.price, badges: [] });
  }

  const frozen = [
    { brand: "Sadia", name: "Nuggets", size: "300g", price: 12.9 },
    { brand: "Perdigão", name: "Nuggets", size: "300g", price: 11.9 },
    { brand: "Sadia", name: "Pizza Mussarela", size: "460g", price: 19.9 },
    { brand: "Perdigão", name: "Pizza Calabresa", size: "460g", price: 18.9 },
    { brand: "Seara", name: "Peito de Frango", size: "1kg", price: 23.9 },
    { brand: "Seara", name: "Coxa e Sobrecoxa", size: "1kg", price: 19.9 },
  ];
  for (const f of frozen) {
    const categoryId = f.name.includes("Frango") || f.name.includes("Coxa") ? 91 : 90;
    add({ name: `${f.name} ${f.size}`, brand: f.brand, categoryId, unitLabel: "pacote", sizeLabel: f.size, price: f.price, badges: [] });
  }

  const frozenExtras = [
    { brand: "Forno de Minas", name: "Pão de Queijo", size: "1kg", price: 24.9, categoryId: 92 },
    { brand: "Sadia", name: "Pão de Queijo", size: "1kg", price: 22.9, categoryId: 92 },
    { brand: "McCain", name: "Batata Frita", size: "400g", price: 16.9, categoryId: 93 },
    { brand: "Bem Brasil", name: "Batata Frita", size: "400g", price: 14.9, categoryId: 93 },
  ];
  for (const f of frozenExtras) {
    add({ name: `${f.name} ${f.brand} ${f.size}`, brand: f.brand, categoryId: f.categoryId, unitLabel: "pacote", sizeLabel: f.size, price: f.price, badges: [] });
  }

  const cleaning = [
    { brand: "Ypê", name: "Detergente Neutro", size: "500ml", price: 2.99, categoryId: 220 },
    { brand: "Limpol", name: "Detergente Neutro", size: "500ml", price: 3.19, categoryId: 220 },
    { brand: "Veja", name: "Desinfetante", size: "2L", price: 11.9, categoryId: 220 },
    { brand: "Pinho Sol", name: "Desinfetante", size: "2L", price: 12.9, categoryId: 220 },
    { brand: "OMO", name: "Sabão em Pó", size: "1kg", price: 16.9, categoryId: 221 },
    { brand: "Tixan", name: "Sabão em Pó", size: "1kg", price: 14.9, categoryId: 221 },
    { brand: "Downy", name: "Amaciante", size: "2L", price: 19.9, categoryId: 221 },
    { brand: "Comfort", name: "Amaciante", size: "2L", price: 18.9, categoryId: 221 },
  ];
  for (const c of cleaning) {
    add({ name: `${c.name} ${c.size}`, brand: c.brand, categoryId: c.categoryId, unitLabel: c.size === "2L" ? "garrafa" : "unidade", sizeLabel: c.size, price: c.price, badges: [] });
  }

  const hygiene = [
    { brand: "Neve", name: "Papel Higiênico", size: "12 rolos", price: 24.9, categoryId: 240 },
    { brand: "Personal", name: "Papel Higiênico", size: "12 rolos", price: 21.9, categoryId: 240 },
    { brand: "Dove", name: "Sabonete", size: "90g", price: 4.99, categoryId: 241 },
    { brand: "Lux", name: "Sabonete", size: "85g", price: 2.99, categoryId: 241 },
    { brand: "Nivea", name: "Sabonete", size: "90g", price: 3.99, categoryId: 241 },
    { brand: "Pantene", name: "Shampoo", size: "400ml", price: 19.9, categoryId: 242 },
    { brand: "Elseve", name: "Shampoo", size: "400ml", price: 18.9, categoryId: 242 },
    { brand: "Colgate", name: "Creme Dental", size: "90g", price: 6.49, categoryId: 243 },
    { brand: "Oral-B", name: "Creme Dental", size: "70g", price: 7.49, categoryId: 243 },
    { brand: "Rexona", name: "Desodorante Aerosol", size: "150ml", price: 14.9, categoryId: 244 },
    { brand: "Nivea", name: "Desodorante Aerosol", size: "150ml", price: 13.9, categoryId: 244 },
  ];
  for (const h of hygiene) {
    add({ name: `${h.name} ${h.brand} ${h.size}`, brand: h.brand, categoryId: h.categoryId, unitLabel: h.size.includes("rolos") ? "pacote" : "unidade", sizeLabel: h.size, price: h.price, badges: [] });
  }

  const drinks = [
    { brand: "Crystal", name: "Água Mineral", size: "1,5L", price: 3.99, categoryId: 110 },
    { brand: "Bonafont", name: "Água Mineral", size: "500ml", price: 2.49, categoryId: 110 },
    { brand: "Del Valle", name: "Suco", size: "1L", price: 8.99, categoryId: 111 },
    { brand: "Maguary", name: "Suco", size: "1L", price: 7.99, categoryId: 111 },
  ];
  for (const d of drinks) {
    add({ name: `${d.name} ${d.brand} ${d.size}`, brand: d.brand, categoryId: d.categoryId, unitLabel: "garrafa", sizeLabel: d.size, price: d.price, badges: [] });
  }

  const outOfStockIndexes = [5, 18, 40];
  for (const idx of outOfStockIndexes) {
    if (products[idx]) {
      products[idx].stock = 0;
      products[idx].inStock = false;
    }
  }

  const promoIndexes = [1, 12, 33];
  for (const idx of promoIndexes) {
    if (products[idx]) {
      const p = products[idx];
      p.compareAtPrice = Number((p.price + Math.max(1, p.price * 0.15)).toFixed(2));
      p.badges = Array.from(new Set([...(p.badges ?? []), "promo"]));
    }
  }

  return products.slice(0, targetCount);
}

function main() {
  const tenants = [
    {
      tenant: "adega-lopes",
      categories: buildAdegaCategories(),
      products: buildAdegaProducts({ targetCount: 70 }),
    },
    {
      tenant: "mercearia-lopes",
      categories: buildMerceariaCategories(),
      products: buildMerceariaProducts({ targetCount: 100 }),
    },
  ];

  for (const t of tenants) {
    validateCatalog(t);
    const baseDir = path.join(ROOT, t.tenant, "CATALOGO");
    ensureDir(baseDir);
    writeJson(path.join(baseDir, "categorias.json"), t.categories);
    writeJson(path.join(baseDir, "produtos.json"), t.products);
  }

  const summary = tenants.map((t) => ({ tenant: t.tenant, categorias: t.categories.length, produtos: t.products.length }));
  console.log(JSON.stringify({ ok: true, summary }, null, 2));
}

main();
