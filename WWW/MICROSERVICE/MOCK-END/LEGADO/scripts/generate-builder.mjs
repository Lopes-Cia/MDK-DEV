import fs from "node:fs/promises";
import path from "node:path";

const CWD = process.cwd();

async function listTenants(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const candidates = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const tenants = [];
  for (const name of candidates) {
    try {
      const catalogDir = path.join(rootDir, name, "CATALOGO");
      await fs.access(path.join(catalogDir, "categorias.json"));
      await fs.access(path.join(catalogDir, "produtos.json"));
      tenants.push(name);
    } catch {
      continue;
    }
  }
  return tenants;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function selectedTheme(theme) {
  const selectedId = theme?.selected;
  const opt = (theme?.options ?? []).find((o) => o?.id === selectedId);
  return opt ?? null;
}

function enabledBlocksForSegment(segment) {
  const common = [
    "Header",
    "Footer",
    "Hero",
    "PromoBanner",
    "CategoryGrid",
    "ProductCard",
    "ProductGrid",
    "ProductCarousel",
    "SearchBar",
    "FiltersPanel",
    "CepMockForm",
    "Breadcrumbs",
    "CartDrawer",
    "CartPage",
  ];

  if (segment === "adega") {
    return Array.from(new Set([...common, "ComboCarousel", "BadgesBar"]));
  }

  return Array.from(new Set([...common, "EssentialsShelf", "RebuyShelf"]));
}

function defaultPages({ tenantId, segment }) {
  const basePages = [
    { urlPath: "/", kind: "home" },
    { urlPath: "/categoria/[slug]", kind: "category" },
    { urlPath: "/produto/[slug]", kind: "product" },
    { urlPath: "/carrinho", kind: "cart" },
  ];

  const homeLayout =
    segment === "adega"
      ? [
          { type: "Hero", props: { titleKey: "pages.home.title", subtitleKey: "pages.home.subtitle" } },
          { type: "PromoBanner", props: { variant: "hot" } },
          { type: "ComboCarousel", props: { title: "Combos", source: "catalogo" } },
          { type: "ProductCarousel", props: { title: "Mais vendidos", source: "catalogo" } },
          { type: "CategoryGrid", props: { title: "Categorias", source: "catalogo" } },
          { type: "CepMockForm", props: { labelKey: "components.cepMock.label" } },
        ]
      : [
          { type: "Hero", props: { titleKey: "pages.home.title", subtitleKey: "pages.home.subtitle" } },
          { type: "EssentialsShelf", props: { title: "Essenciais", source: "catalogo" } },
          { type: "RebuyShelf", props: { title: "Recompras", source: "catalogo" } },
          { type: "ProductGrid", props: { title: "Promoções", source: "catalogo" } },
          { type: "CategoryGrid", props: { title: "Categorias", source: "catalogo" } },
          { type: "CepMockForm", props: { labelKey: "components.cepMock.label" } },
        ];

  const pageLayouts = {
    home: homeLayout,
    category: [
      { type: "Breadcrumbs", props: {} },
      { type: "SearchBar", props: { placeholderKey: "components.search.placeholder" } },
      { type: "FiltersPanel", props: { titleKey: "components.filters.title" } },
      { type: "ProductGrid", props: { source: "catalogo" } },
    ],
    product: [{ type: "ProductCard", props: { addToCartKey: "pages.product.addToCart" } }],
    cart: [{ type: "CartPage", props: { titleKey: "pages.cart.title", checkoutKey: "pages.cart.checkoutCta" } }],
  };

  return basePages.map((p) => ({ ...p, layout: pageLayouts[p.kind] ?? [] }));
}

function presets({ segment }) {
  const common = {
    "/": ["Hero", "CategoryGrid", "ProductGrid", "ProductCarousel", "CepMockForm", "Footer"],
    "/categoria/[slug]": ["Breadcrumbs", "SearchBar", "FiltersPanel", "ProductGrid"],
    "/produto/[slug]": ["Breadcrumbs", "ProductCard"],
    "/carrinho": ["CartPage"],
  };
  if (segment === "adega") {
    common["/"] = ["Hero", "PromoBanner", "ComboCarousel", "ProductCarousel", "CategoryGrid", "CepMockForm", "Footer"];
  }
  if (segment === "mercearia") {
    common["/"] = ["Hero", "EssentialsShelf", "RebuyShelf", "ProductGrid", "CategoryGrid", "CepMockForm", "Footer"];
  }
  return common;
}

async function main() {
  const tenants = await listTenants(CWD);
  const results = [];

  for (const tenant of tenants) {
    const context = await readJson(path.join(CWD, tenant, "CONTEXTO", "contexto.json"));
    const copy = await readJson(path.join(CWD, tenant, "COPY", "copy.json"));
    const theme = await readJson(path.join(CWD, tenant, "THEMA", "theme.json"));
    const selTheme = selectedTheme(theme);

    const outDir = path.join(CWD, tenant, "BUILDER");
    const outPages = path.join(outDir, "pages.json");
    const outBlocks = path.join(outDir, "enabledBlocks.json");
    const outPresets = path.join(outDir, "presets.json");

    const segment = context?.segment ?? "unknown";
    const pages = defaultPages({ tenantId: tenant, segment });
    const blocks = enabledBlocksForSegment(segment);
    const presetData = presets({ segment });

    await writeJson(outPages, {
      tenantId: tenant,
      themeSelected: selTheme?.id ?? theme?.selected ?? null,
      copyRef: copy?.tenantId ?? tenant,
      pages,
    });

    await writeJson(outBlocks, { tenantId: tenant, blocks });
    await writeJson(outPresets, { tenantId: tenant, presets: presetData });

    results.push({ tenant, pages: pages.length, blocks: blocks.length });
  }

  process.stdout.write(JSON.stringify({ ok: true, results }, null, 2) + "\n");
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + "\n");
  process.exit(1);
});
