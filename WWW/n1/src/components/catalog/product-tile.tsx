"use client";

import Link from "next/link";

import type { CatalogProduct } from "@/lib/mockend/catalog-client";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";

export function ProductTile({ tenant, product }: { tenant: string; product: CatalogProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const inStock = Boolean(product.inStock && product.stock > 0);

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href={`/${tenant}/produto/${product.slug}`} className="font-medium hover:underline">
            {product.name}
          </Link>
          <div className="mt-1 text-sm text-muted-foreground">
            {product.brand ? `${product.brand} · ` : ""}
            {product.unitLabel ?? ""}
            {product.sizeLabel ? ` ${product.sizeLabel}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">R$ {product.price.toFixed(2)}</div>
          {product.compareAtPrice ? (
            <div className="text-xs text-muted-foreground line-through">
              R$ {Number(product.compareAtPrice).toFixed(2)}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {inStock ? `Estoque: ${product.stock}` : "Indisponível"}
        </div>
        <Button
          disabled={!inStock}
          onClick={() =>
            addItem(
              { productId: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image },
              1
            )
          }
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}

