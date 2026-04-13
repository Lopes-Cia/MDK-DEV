"use client";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";

import type { CatalogCategory } from "@/lib/mockend/catalog-client";
import { fetchCatalogCategories, fetchCatalogProducts } from "@/lib/mockend/catalog-client";
import { ProductTile } from "@/components/catalog/product-tile";

function collectDescendantCategoryIds(categories: CatalogCategory[], rootId: number) {
  const childrenByParent = new Map<number, number[]>();
  for (const c of categories) {
    const p = c.parentId ?? null;
    if (typeof p !== "number") continue;
    const arr = childrenByParent.get(p) ?? [];
    arr.push(c.id);
    childrenByParent.set(p, arr);
  }

  const result = new Set<number>();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    const children = childrenByParent.get(id) ?? [];
    for (const child of children) stack.push(child);
  }

  return result;
}

export function CategoryClient({
  tenant,
  slug,
  title,
  emptyState,
}: {
  tenant: string;
  slug: string;
  title: string;
  emptyState: string;
}) {
  const categoriesQuery = useQuery({
    queryKey: ["catalogo", tenant, "categorias"],
    queryFn: () => fetchCatalogCategories(tenant),
  });

  const productsQuery = useQuery({
    queryKey: ["catalogo", tenant, "produtos"],
    queryFn: () => fetchCatalogProducts(tenant),
  });

  const category = React.useMemo(() => {
    if (!categoriesQuery.data) return null;
    return categoriesQuery.data.find((c) => c.slug === slug) ?? null;
  }, [categoriesQuery.data, slug]);

  const filtered = React.useMemo(() => {
    if (!category || !categoriesQuery.data || !productsQuery.data) return null;
    const ids = collectDescendantCategoryIds(categoriesQuery.data, category.id);
    return productsQuery.data.filter((p) => ids.has(p.categoryId));
  }, [categoriesQuery.data, productsQuery.data, category]);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">{title}</div>
          <h1 className="text-2xl font-semibold tracking-tight">{category?.name ?? slug}</h1>
        </div>

        <div className="mt-8">
          {categoriesQuery.isLoading || productsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Carregando…</div>
          ) : categoriesQuery.isError || productsQuery.isError ? (
            <div className="text-sm text-muted-foreground">Erro ao carregar</div>
          ) : !filtered || filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">{emptyState}</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProductTile key={p.id} tenant={tenant} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

