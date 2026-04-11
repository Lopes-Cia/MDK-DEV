"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCatalogProductBySlug } from "@/lib/mockend/catalog-client";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";

export function ProductClient({
  tenant,
  slug,
  addToCartLabel,
  outOfStockLabel,
}: {
  tenant: string;
  slug: string;
  addToCartLabel: string;
  outOfStockLabel: string;
}) {
  const addItem = useCartStore((s) => s.addItem);

  const productQuery = useQuery({
    queryKey: ["catalogo", tenant, "produto", slug],
    queryFn: () => fetchCatalogProductBySlug(tenant, slug),
  });

  const product = productQuery.data;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {productQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando…</div>
        ) : productQuery.isError || !product ? (
          <div className="text-sm text-muted-foreground">Produto não encontrado</div>
        ) : (
          <div className="grid gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
              <div className="text-sm text-muted-foreground">
                {product.brand ? `${product.brand} · ` : ""}
                {product.unitLabel ?? ""}
                {product.sizeLabel ? ` ${product.sizeLabel}` : ""}
              </div>
            </div>

            <div className="flex items-center justify-between gap-6 rounded-lg border border-border bg-background p-4">
              <div>
                <div className="text-sm text-muted-foreground">Preço</div>
                <div className="text-lg font-semibold">R$ {product.price.toFixed(2)}</div>
              </div>

              <Button
                disabled={!product.inStock || product.stock <= 0}
                onClick={() =>
                  addItem(
                    {
                      productId: product.id,
                      slug: product.slug,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                    },
                    1
                  )
                }
              >
                {product.inStock && product.stock > 0 ? addToCartLabel : outOfStockLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

