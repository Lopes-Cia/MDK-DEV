"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/ui/state-card";
import { useAuthStore } from "@/stores/auth-store";
import { useOrdersStore } from "@/stores/orders-store";

type PedidosClientProps = {
  tenant: string;
  title?: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateTime(iso: string) {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString("pt-BR");
}

export function PedidosClient({ tenant, title = "Pedidos" }: PedidosClientProps) {
  const router = useRouter();

  const authLoading = useAuthStore((s) => s.loading);
  const authError = useAuthStore((s) => s.error);
  const authData = useAuthStore((s) => s.data);
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const clearAuthError = useAuthStore((s) => s.clearError);
  const resetAuth = useAuthStore((s) => s.reset);

  const ordersLoading = useOrdersStore((s) => s.loading);
  const ordersError = useOrdersStore((s) => s.error);
  const listOrders = useOrdersStore((s) => s.listOrders);
  const clearOrdersError = useOrdersStore((s) => s.clearError);
  const resetOrders = useOrdersStore((s) => s.reset);
  const ordersData = useOrdersStore((s) => s.data);

  const [checked, setChecked] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const isAuthenticated =
    authData.session?.authenticated === true && authData.session.tenant === tenant && Boolean(authData.user);

  React.useEffect(() => {
    if (authData.session && authData.session.tenant !== tenant) resetAuth();
    if (ordersData.order && ordersData.order.tenant !== tenant) resetOrders();
    if (ordersData.orders.length && ordersData.orders.some((o) => o.tenant !== tenant)) resetOrders();
  }, [tenant, authData.session, resetAuth, ordersData.order, ordersData.orders, resetOrders]);

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
    if (authLoading) return;
    if (isAuthenticated) return;
    const next = encodeURIComponent(`/${tenant}/pedidos`);
    router.replace(`/${tenant}/login?next=${next}`);
  }, [checked, authLoading, isAuthenticated, router, tenant]);

  React.useEffect(() => {
    if (!checked) return;
    if (authLoading) return;
    if (!isAuthenticated) return;
    if (loaded) return;
    (async () => {
      await listOrders(tenant);
      setLoaded(true);
    })();
  }, [checked, authLoading, isAuthenticated, loaded, listOrders, tenant]);

  const orders = ordersData.orders.filter((o) => o.tenant === tenant);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href={`/${tenant}/minha-conta`}>Minha conta</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${tenant}/`}>Home</Link>
            </Button>
          </div>
        </div>

        {!checked || authLoading ? (
          <StateCard className="mt-8" title="Carregando" tone="muted" description="Carregando sessão…" />
        ) : authError ? (
          <StateCard
            className="mt-8"
            title="Não foi possível carregar a sessão"
            tone="error"
            description={authError}
            actions={
              <>
                <Button
                  onClick={() => {
                    clearAuthError();
                    void refreshMe(tenant);
                  }}
                  disabled={authLoading}
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
        ) : !loaded || ordersLoading ? (
          <StateCard className="mt-8" title="Carregando pedidos" tone="muted" description="Carregando pedidos…" />
        ) : ordersError ? (
          <StateCard
            className="mt-8"
            title="Não foi possível carregar seus pedidos"
            tone="error"
            description={ordersError}
            actions={
              <>
                <Button
                  onClick={() => {
                    clearOrdersError();
                    setLoaded(false);
                  }}
                  disabled={ordersLoading}
                >
                  Tentar novamente
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/${tenant}/`}>Voltar para home</Link>
                </Button>
              </>
            }
          />
        ) : orders.length === 0 ? (
          <StateCard
            className="mt-8"
            title="Você ainda não tem pedidos"
            tone="muted"
            description="Quando você finalizar um checkout, ele aparecerá aqui."
            actions={
              <>
                <Button asChild>
                  <Link href={`/${tenant}/`}>Continuar comprando</Link>
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
                  <CardTitle className="text-lg">Seus pedidos</CardTitle>
                  <CardDescription>Lista mock do MVP (via orders-store).</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {orders
                    .slice()
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((order) => (
                      <Link key={order.id} href={`/${tenant}/pedido/${encodeURIComponent(order.id)}`} className="block">
                        <Card className="shadow-none transition-colors hover:bg-accent hover:text-accent-foreground">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold tracking-tight">Pedido #{order.id}</div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {formatDateTime(order.createdAt)} • {order.items.length} item(ns) • {order.status}
                                </div>
                              </div>
                              <div className="shrink-0 text-sm font-semibold">{formatMoney(order.totals.grandTotal)}</div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
