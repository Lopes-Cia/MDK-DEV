"use client";

import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { getCartSubtotal, useCartStore } from "@/lib/store/cart";
import { resolveTenantAssetPath } from "@/lib/utils";

export function CartClient({
  tenant,
  title,
  continueShopping,
  checkoutCta,
}: {
  tenant: string;
  title: string;
  continueShopping: string;
  checkoutCta: string;
}) {
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  const subtotal = getCartSubtotal(items);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {items.length ? (
            <Button variant="ghost" onClick={() => clear()}>
              Limpar
            </Button>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-3">
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground">Seu carrinho está vazio</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                      {resolveTenantAssetPath(tenant, item.image) ? (
                        <Image
                          src={resolveTenantAssetPath(tenant, item.image)!}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/${tenant}/produto/${item.slug}`}
                        className="block truncate font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-1 text-sm text-muted-foreground">R$ {item.price.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      className="h-9 w-16 rounded-md border border-input bg-background px-2 text-sm"
                      type="number"
                      min={0}
                      value={item.qty}
                      onChange={(e) => setQty(item.productId, Number(e.target.value))}
                    />
                    <Button variant="outline" onClick={() => removeItem(item.productId)}>
                      Remover
                    </Button>
                  </div>
                </div>
              ))
            )}
          </section>

          <aside className="h-fit rounded-lg border border-border bg-background p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="mt-4 space-y-2">
              {items.length === 0 ? (
                <Button className="w-full" disabled>
                  {checkoutCta}
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href={`/${tenant}/checkout`}>{checkoutCta}</Link>
                </Button>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link href={`/${tenant}/`}>{continueShopping}</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

