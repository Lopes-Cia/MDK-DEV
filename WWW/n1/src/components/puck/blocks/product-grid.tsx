"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCatalogProducts } from "@/lib/mockend/catalog-client";
import { ProductTile } from "@/components/catalog/product-tile";
import { useTenant } from "@/components/puck/tenant-runtime";

export function ProductGridBlock({ title, limit = 10 }: { title: string; limit?: number }) {
  const tenant = useTenant();
  const productsQuery = useQuery({
    queryKey: ["catalogo", tenant, "produtos"],
    queryFn: () => fetchCatalogProducts(tenant),
  });
  const products = productsQuery.data ?? [];

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {productsQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : productsQuery.isError ? (
        <div className="text-sm text-muted-foreground">Erro ao carregar produtos</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.slice(0, limit).map((p) => (
            <ProductTile key={p.id} tenant={tenant} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

