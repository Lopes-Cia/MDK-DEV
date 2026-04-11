export type CatalogCategory = {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  level?: number;
};

export type CatalogProduct = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  categoryId: number;
  brand?: string;
  unitLabel?: string;
  sizeLabel?: string;
  price: number;
  compareAtPrice?: number | null;
  badges?: string[];
  image?: string;
  stock: number;
  inStock: boolean;
};

function getMockEndBaseUrl() {
  const base = process.env.NEXT_PUBLIC_MOCKEND_BASE_URL ?? "http://localhost:4000";
  return base.replace(/\/+$/, "");
}

async function getJson<T>(pathname: string): Promise<T> {
  const base = getMockEndBaseUrl();
  const url = `${base}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`mockend_fetch_failed:${res.status}:${text.slice(0, 120)}`);
  }
  return (await res.json()) as T;
}

export function catalogEndpoints(tenant: string) {
  const t = encodeURIComponent(tenant);
  return {
    categories: `/api/${t}/catalogo/categorias`,
    products: `/api/${t}/catalogo/produtos`,
    categoryBySlug: (slug: string) => `/api/${t}/catalogo/categorias/${encodeURIComponent(slug)}`,
    productBySlug: (slug: string) => `/api/${t}/catalogo/produtos/${encodeURIComponent(slug)}`,
  };
}

export async function fetchCatalogCategories(tenant: string) {
  const e = catalogEndpoints(tenant);
  return await getJson<CatalogCategory[]>(e.categories);
}

export async function fetchCatalogProducts(tenant: string) {
  const e = catalogEndpoints(tenant);
  return await getJson<CatalogProduct[]>(e.products);
}

export async function fetchCatalogProductBySlug(tenant: string, slug: string) {
  const e = catalogEndpoints(tenant);
  return await getJson<CatalogProduct>(e.productBySlug(slug));
}

