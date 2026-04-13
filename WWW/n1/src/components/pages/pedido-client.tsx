"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/ui/state-card";
import { useAuthStore } from "@/stores/auth-store";
import { useOrdersStore } from "@/stores/orders-store";

type PedidoClientProps = {
  tenant: string;
  orderId: string;
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

function formatPaymentMethod(method: string) {
  switch (method) {
    case "pix":
      return "PIX";
    case "credit_card":
      return "Cartão";
    case "cash":
      return "Dinheiro";
    default:
      return method;
  }
}

function formatPaymentStatus(status: string) {
  switch (status) {
    case "pending":
      return "Pendente";
    case "paid":
      return "Pago";
    case "failed":
      return "Falhou";
    default:
      return status;
  }
}

export function PedidoClient({ tenant, orderId, title = "Detalhe do pedido" }: PedidoClientProps) {
  const router = useRouter();

  const authLoading = useAuthStore((s) => s.loading);
  const authError = useAuthStore((s) => s.error);
  const authData = useAuthStore((s) => s.data);
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const clearAuthError = useAuthStore((s) => s.clearError);
  const resetAuth = useAuthStore((s) => s.reset);

  const ordersLoading = useOrdersStore((s) => s.loading);
  const ordersError = useOrdersStore((s) => s.error);
  const getOrder = useOrdersStore((s) => s.getOrder);
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
    const next = encodeURIComponent(`/${tenant}/pedido/${encodeURIComponent(orderId)}`);
    router.replace(`/${tenant}/login?next=${next}`);
  }, [checked, authLoading, isAuthenticated, router, tenant, orderId]);

  const orderFromList = ordersData.orders.find((o) => o.tenant === tenant && o.id === orderId) ?? null;
  const orderFromDetail =
    ordersData.order && ordersData.order.tenant === tenant && ordersData.order.id === orderId ? ordersData.order : null;
  const order = orderFromDetail ?? orderFromList;

  React.useEffect(() => {
    if (!checked) return;
    if (authLoading) return;
    if (!isAuthenticated) return;
    if (loaded) return;
    if (order) {
      setLoaded(true);
      return;
    }
    (async () => {
      await getOrder(tenant, orderId);
      setLoaded(true);
    })();
  }, [checked, authLoading, isAuthenticated, loaded, order, getOrder, tenant, orderId]);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href={`/${tenant}/pedidos`}>Voltar para pedidos</Link>
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
          <StateCard className="mt-8" title="Carregando pedido" tone="muted" description="Carregando pedido…" />
        ) : ordersError ? (
          <StateCard
            className="mt-8"
            title="Não foi possível carregar o pedido"
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
                  <Link href={`/${tenant}/pedidos`}>Ir para lista</Link>
                </Button>
              </>
            }
          />
        ) : !order ? (
          <StateCard
            className="mt-8"
            title="Pedido não encontrado"
            tone="muted"
            description="Verifique o link ou volte para a lista de pedidos."
            actions={
              <>
                <Button asChild>
                  <Link href={`/${tenant}/pedidos`}>Voltar</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/${tenant}/`}>Home</Link>
                </Button>
              </>
            }
          />
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Itens</CardTitle>
                  <CardDescription>
                    Pedido <span className="font-mono">{order.id}</span> • {formatDateTime(order.createdAt)} •{" "}
                    {order.status}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {order.items.map((it) => (
                      <div key={it.id} className="flex items-start justify-between gap-4 text-sm">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{it.name}</div>
                          <div className="text-muted-foreground">
                            {it.quantity} × {formatMoney(it.unitPrice)}
                          </div>
                        </div>
                        <div className="shrink-0 font-semibold">{formatMoney(it.lineTotal)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Endereço</CardTitle>
                  <CardDescription>Entrega mock do MVP.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-1 text-sm">
                    <div className="font-semibold">{order.address.fullName}</div>
                    <div className="text-muted-foreground">{order.address.phone}</div>
                    <div>
                      {order.address.street}, {order.address.number}
                      {order.address.complement ? `, ${order.address.complement}` : ""}
                    </div>
                    <div>
                      {order.address.neighborhood} • {order.address.city}/{order.address.state}
                    </div>
                    <div className="text-muted-foreground">CEP {order.address.zipCode}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pagamento</CardTitle>
                  <CardDescription>Mock do MVP (sem gateway).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Método:</span> {formatPaymentMethod(order.payment.method)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span> {formatPaymentStatus(order.payment.status)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Transação:</span>{" "}
                      <span className="font-mono">{order.payment.transactionId ?? "—"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card className="h-fit">
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle className="text-lg">Totais</CardTitle>
                  <CardDescription>Resumo do pedido.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatMoney(order.totals.itemsSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Entrega</span>
                    <span className="font-semibold">{formatMoney(order.totals.shipping)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="font-semibold">-{formatMoney(order.totals.discount)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-base font-semibold">{formatMoney(order.totals.grandTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
