"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/ui/state-card";
import { useCartStore } from "@/lib/store/cart";
import { useAuthStore } from "@/stores/auth-store";

type CheckoutSucessoClientProps = {
  tenant: string;
  title?: string;
};

export function CheckoutSucessoClient({ tenant, title = "Pedido confirmado" }: CheckoutSucessoClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId") ?? "";

  const clearCart = useCartStore((s) => s.clear);

  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const data = useAuthStore((s) => s.data);
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const clearError = useAuthStore((s) => s.clearError);
  const reset = useAuthStore((s) => s.reset);

  const [checked, setChecked] = React.useState(false);
  const [cleaned, setCleaned] = React.useState(false);

  const isAuthenticated =
    data.session?.authenticated === true && data.session.tenant === tenant && Boolean(data.user);

  React.useEffect(() => {
    if (data.session && data.session.tenant !== tenant) reset();
  }, [tenant, data.session, reset]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      await refreshMe(tenant);
      if (alive) setChecked(true);
    })();
    return () => {
      alive = false;
    };
  }, [tenant, refreshMe]);

  React.useEffect(() => {
    if (!checked) return;
    if (loading) return;
    if (isAuthenticated) return;
    const next = encodeURIComponent(orderId ? `/${tenant}/checkout/sucesso?orderId=${orderId}` : `/${tenant}/checkout`);
    router.replace(`/${tenant}/login?next=${next}`);
  }, [checked, loading, isAuthenticated, router, tenant, orderId]);

  React.useEffect(() => {
    if (!checked) return;
    if (!isAuthenticated) return;
    if (!orderId) return;
    if (cleaned) return;
    clearCart();
    setCleaned(true);
  }, [checked, isAuthenticated, orderId, cleaned, clearCart]);

  const orderHref = orderId ? `/${tenant}/pedido/${encodeURIComponent(orderId)}` : "";

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <div className="mt-1 text-sm text-muted-foreground">Checkout mock do MVP.</div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/${tenant}/`}>Home</Link>
          </Button>
        </div>

        {!checked || loading ? (
          <StateCard className="mt-8" title="Carregando" tone="muted" description="Carregando sessão…" />
        ) : error ? (
          <StateCard
            className="mt-8"
            title="Não foi possível carregar a sessão"
            tone="error"
            description={error}
            actions={
              <>
                <Button
                  onClick={() => {
                    clearError();
                    void refreshMe(tenant);
                  }}
                  disabled={loading}
                >
                  Tentar novamente
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/${tenant}/login`}>Ir para login</Link>
                </Button>
              </>
            }
          />
        ) : !isAuthenticated ? (
          <StateCard
            className="mt-8"
            title="Login necessário"
            tone="muted"
            description="Você precisa estar autenticado. Redirecionando…"
          />
        ) : !orderId ? (
          <StateCard
            className="mt-8"
            title="Pedido não informado"
            tone="muted"
            description="Nenhum pedido foi informado na URL."
            actions={
              <>
                <Button asChild>
                  <Link href={`/${tenant}/checkout`}>Voltar ao checkout</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/${tenant}/carrinho`}>Ir para carrinho</Link>
                </Button>
              </>
            }
          />
        ) : (
          <div className="mt-8 grid gap-6">
            <Card>
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle className="text-lg">Pedido criado com sucesso</CardTitle>
                  <CardDescription>Você já pode acompanhar o pedido.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <span className="text-muted-foreground">orderId:</span> <span className="font-mono">{orderId}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button asChild>
                    <Link href={orderHref}>Ver pedido</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/${tenant}/pedidos`}>Ver lista de pedidos</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
