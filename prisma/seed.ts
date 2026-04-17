import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

type JsonBrand = {
  id: number;
  name: string;
  slug: string;
  image: string;
};

type JsonCategory = {
  id: number;
  name: string;
  slug: string;
  parentId: number;
  image: string;
  order: number;
};

type JsonProduct = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  unitLabel: string;
  sizeLabel: string;
  price: number | null;
  compareAtPrice: number | null;
  badges: string[] | null;
  image: string;
  stock: number;
  inStock: boolean;
  category: {
    id: number;
  };
  brand: {
    id: number;
  };
};

const prisma = new PrismaClient();

function safeString(value: unknown): string {
  return String(value ?? "").trim();
}

function toIntOrNull(value: unknown): number | null {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function toNumberOrNull(value: unknown): number | null {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function main() {
  const rootDir = path.resolve(__dirname, "..");
  const dataDir = path.resolve(
    rootDir,
    "WWW",
    "MICROSERVICE",
    "LEAR_LOPES",
    "BACK",
    "endpoints",
    "prod",
    "vai",
    "OUT"
  );

  const produtosPath = path.resolve(dataDir, "produtos.json");
  const categoriasPath = path.resolve(dataDir, "categorias.json");
  const brandsPath = path.resolve(dataDir, "brands.json");

  const [rawProdutos, rawCategorias, rawBrands] = await Promise.all([
    readJsonFile<unknown[]>(produtosPath),
    readJsonFile<unknown[]>(categoriasPath),
    readJsonFile<unknown[]>(brandsPath),
  ]);

  const produtos = (Array.isArray(rawProdutos) ? rawProdutos : []) as JsonProduct[];
  const categorias = (Array.isArray(rawCategorias) ? rawCategorias : []) as JsonCategory[];
  const brands = (Array.isArray(rawBrands) ? rawBrands : []) as JsonBrand[];

  await prisma.$transaction(async (tx) => {
    for (const b of brands) {
      const id = toIntOrNull(b.id);
      if (id === null) continue;
      const name = safeString(b.name);
      if (!name) continue;
      const slug = safeString(b.slug) || `/marca/${id}`;
      const image = safeString(b.image);
      await tx.brand.upsert({
        where: { id },
        create: { id, name, slug, image },
        update: { name, slug, image },
      });
    }

    for (const c of categorias) {
      const id = toIntOrNull(c.id);
      if (id === null) continue;
      const name = safeString(c.name);
      if (!name) continue;
      const slug = safeString(c.slug) || `/categoria/${id}`;
      const parentId = toIntOrNull(c.parentId);
      const image = safeString(c.image);
      const order = toIntOrNull(c.order) ?? id;
      await tx.category.upsert({
        where: { id },
        create: {
          id,
          name,
          slug,
          parentId,
          image,
          order,
        },
        update: {
          name,
          slug,
          parentId,
          image,
          order,
        },
      });
    }

    for (const p of produtos) {
      const id = toIntOrNull(p.id);
      if (id === null) continue;
      const name = safeString(p.name);
      if (!name) continue;
      const slug = safeString(p.slug) || `/produtos/${id}`;
      const sku = safeString(p.sku) || `SKU-${id}`;
      const unitLabel = safeString(p.unitLabel);
      const sizeLabel = safeString(p.sizeLabel);
      const price = toNumberOrNull(p.price);
      const compareAtPrice = toNumberOrNull(p.compareAtPrice);
      const badges = Array.isArray(p.badges) ? p.badges.map(safeString) : [];
      const image = safeString(p.image);
      const stock = toIntOrNull(p.stock) ?? 0;
      const inStock = Boolean(p.inStock);
      const categoryId = toIntOrNull(p.category?.id);
      const brandId = toIntOrNull(p.brand?.id);

      if (categoryId === null || brandId === null) continue;

      await tx.product.upsert({
        where: { id },
        create: {
          id,
          sku,
          name,
          slug,
          unitLabel,
          sizeLabel,
          price,
          compareAtPrice,
          badges,
          image,
          stock,
          inStock,
          categoryId,
          brandId,
        },
        update: {
          sku,
          name,
          slug,
          unitLabel,
          sizeLabel,
          price,
          compareAtPrice,
          badges,
          image,
          stock,
          inStock,
          categoryId,
          brandId,
        },
      });
    }
  });
}

main()
  .catch((err) => {
    process.stderr.write(`${safeString(err?.message ?? err)}\n`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

