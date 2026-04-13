"use client";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { fetchCatalogCategories, fetchCatalogProducts } from "@/lib/mockend/catalog-client";
import { ProductTile } from "@/components/catalog/product-tile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-start">
          <Card>
            <CardHeader>
              <div className="min-w-0">
                <CardTitle className="text-xl">{title}</CardTitle>
                {subtitle ? <CardDescription className="mt-1">{subtitle}</CardDescription> : null}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <div className="text-sm font-semibold tracking-tight">Categorias</div>
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
                          className="rounded-full border border-border bg-transparent px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Atalhos</CardTitle>
              <CardDescription>Acesso rápido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Link
                  href={`/${tenant}/carrinho`}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  Carrinho
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <div className="mb-3 flex items-end justify-between gap-4">
            <h2 className="text-sm font-semibold tracking-tight">Produtos</h2>
          </div>
          {productsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Carregando…</div>
          ) : productsQuery.isError ? (
            <div className="text-sm text-muted-foreground">Erro ao carregar produtos</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 12).map((p) => (
                <ProductTile key={p.id} tenant={tenant} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

