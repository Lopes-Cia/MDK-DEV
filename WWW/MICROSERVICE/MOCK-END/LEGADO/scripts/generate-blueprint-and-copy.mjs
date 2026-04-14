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

async function writeText(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, data, "utf8");
}

function titleForTenant(context) {
  return context?.tenantName ?? context?.tenantId ?? "TENANT";
}

function copyForTenant(context) {
  const isAdega = context?.segment === "adega";
  const homeSubtitle = isAdega ? "Bebidas e conveniência para delivery" : "Alimentos e utilidades para delivery";
  const searchPlaceholder = isAdega ? "Buscar por marca, produto ou volume" : "Buscar produtos e marcas";
  const addToCart = "Adicionar";
  const checkoutCta = "Finalizar";
  const continueShopping = "Continuar comprando";

  return {
    tenantId: context?.tenantId,
    pages: {
      home: {
        title: titleForTenant(context),
        subtitle: homeSubtitle,
        cepCta: "Informar CEP",
      },
      category: {
        title: "Categoria",
        emptyState: "Nenhum produto encontrado",
      },
      product: {
        addToCart,
        outOfStock: "Indisponível",
      },
      cart: {
        title: "Carrinho",
        continueShopping,
        checkoutCta,
      },
    },
    components: {
      search: { placeholder: searchPlaceholder },
      filters: { title: "Filtros", apply: "Aplicar", clear: "Limpar" },
      cepMock: { label: "CEP", placeholder: "00000-000", helper: "Somente UI (mock) na POC" },
    },
  };
}

function blueprintMd(context) {
  const tenantName = titleForTenant(context);
  const tenantId = context?.tenantId ?? "{tenant}";

  return `# Blueprint de Páginas — ${tenantName} (POC)

## Escopo (sem links para outras páginas)
- \`/${tenantId}/\` (Home)
- \`/${tenantId}/categoria/[slug]\` (Categoria)
- \`/${tenantId}/produto/[slug]\` (Produto)
- \`/${tenantId}/carrinho\` (Carrinho)

Outras páginas (institucionais/checkout/login/etc.) ficam fora do menu e sem links por enquanto.

## Componentes (bricks) alvo
- Carrosséis (banner, produtos)
- Cards (produto, categoria, promo)
- CTAs (Adicionar ao carrinho, Ver produto, Ver categoria, Continuar comprando)
- Forms (CEP mock, busca, filtros)
- Navegação (header, menu, breadcrumbs, footer)
- Carrinho (drawer/aside ou página, linha de item, stepper de quantidade)
`;
}

async function main() {
  const tenants = await listTenants(CWD);
  const results = [];

  for (const tenant of tenants) {
    const contextPath = path.join(CWD, tenant, "CONTEXTO", "contexto.json");
    const context = await readJson(contextPath);

    const outCopyPath = path.join(CWD, tenant, "COPY", "copy.json");
    const outBlueprintPath = path.join(CWD, tenant, "BLUEPRINT", "blueprint-paginas-ecommerce.md");

    await writeJson(outCopyPath, copyForTenant(context));
    await writeText(outBlueprintPath, blueprintMd(context));

    results.push({ tenant });
  }

  process.stdout.write(JSON.stringify({ ok: true, results }, null, 2) + "\n");
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + "\n");
  process.exit(1);
});
