"use client";

import Link from "next/link";
import Image from "next/image";

import type { CatalogProduct } from "@/lib/mockend/catalog-client";
import { useCartStore } from "@/lib/store/cart";
import { resolveTenantAssetPath } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProductTile({ tenant, product }: { tenant: string; product: CatalogProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const inStock = Boolean(product.inStock && product.stock > 0);
  const imageSrc = resolveTenantAssetPath(tenant, product.image);
  const badges = Array.isArray(product.badges) ? product.badges : [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="flex items-start gap-4 p-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            {imageSrc ? <Image src={imageSrc} alt={product.name} fill className="object-cover" sizes="64px" /> : null}
          </div>

          <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
            <div className="min-w-0">
              <Link href={`/${tenant}/produto/${product.slug}`} className="font-medium hover:underline">
                {product.name}
              </Link>
              <div className="mt-1 text-sm text-muted-foreground">
                {product.brand ? `${product.brand} · ` : ""}
                {product.unitLabel ?? ""}
                {product.sizeLabel ? ` ${product.sizeLabel}` : ""}
              </div>
              {badges.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {badges.slice(0, 3).map((b) => (
                    <Badge key={b} variant="soft">
                      {b}
                    </Badge>
                  ))}
                </div>
              ) : null}
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
        </div>
      </CardHeader>

      <CardContent className="flex items-center justify-between gap-3 border-t border-border bg-background/40 p-4">
        <div className="text-xs text-muted-foreground">{inStock ? `Estoque: ${product.stock}` : "Indisponível"}</div>
        <Button
          disabled={!inStock}
          size="sm"
          onClick={() =>
            addItem({ productId: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image }, 1)
          }
        >
          Adicionar
        </Button>
      </CardContent>
    </Card>
  );
}

