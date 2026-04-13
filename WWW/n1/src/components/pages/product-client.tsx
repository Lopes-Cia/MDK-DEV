"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

import { fetchCatalogProductBySlug } from "@/lib/mockend/catalog-client";
import { useCartStore } from "@/lib/store/cart";
import { resolveTenantAssetPath } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  const imageSrc = product ? resolveTenantAssetPath(tenant, product.image) : null;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {productQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando…</div>
        ) : productQuery.isError || !product ? (
          <div className="text-sm text-muted-foreground">Produto não encontrado</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[320px_1fr] md:items-start">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted">
              {imageSrc ? (
                <Image src={imageSrc} alt={product.name} fill className="object-cover" sizes="(min-width: 768px) 320px, 100vw" />
              ) : null}
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
              <div className="text-sm text-muted-foreground">
                {product.brand ? `${product.brand} · ` : ""}
                {product.unitLabel ?? ""}
                {product.sizeLabel ? ` ${product.sizeLabel}` : ""}
              </div>
              <Card className="mt-5">
                <CardContent className="flex items-center justify-between gap-6 p-4">
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
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

