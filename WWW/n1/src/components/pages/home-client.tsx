"use client";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { fetchCatalogCategories, fetchCatalogProducts } from "@/lib/mockend/catalog-client";
import { ProductTile } from "@/components/catalog/product-tile";

export function HomeClient({ tenant, title, subtitle }: { tenant: string; title: string; subtitle?: string }) {
  const categoriesQuery = useQuery({
    queryKey: ["catalogo", tenant, "categorias"],
    queryFn: () => fetchCatalogCategories(tenant),
  });

  const productsQuery = useQuery({
    queryKey: ["catalogo", tenant, "produtos"],
    queryFn: () => fetchCatalogProducts(tenant),
  });

  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data ?? [];

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>

        <div className="mt-10 grid gap-8">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Categorias</h2>
            {categoriesQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando…</div>
            ) : categoriesQuery.isError ? (
              <div className="text-sm text-muted-foreground">Erro ao carregar categorias</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 12).map((c) => (
                  <Link
                    key={c.id}
                    href={`/${tenant}/categoria/${c.slug}`}
                    className="rounded-full border border-border px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Produtos</h2>
            {productsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando…</div>
            ) : productsQuery.isError ? (
              <div className="text-sm text-muted-foreground">Erro ao carregar produtos</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {products.slice(0, 10).map((p) => (
                  <ProductTile key={p.id} tenant={tenant} product={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

