"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/ui/state-card";
import { AddressSchema, PaymentSchema } from "@/lib/commerce/schemas";
import { getCartSubtotal, useCartStore } from "@/lib/store/cart";
import { useAuthStore } from "@/stores/auth-store";
import { useOrdersStore } from "@/stores/orders-store";

const CheckoutFormSchema = z.object({
  address: AddressSchema,
  payment: PaymentSchema,
});

type CheckoutClientProps = {
  tenant: string;
  title?: string;
};

function mapZodIssueToMessage(issue: z.ZodIssue) {
  const field = issue.path[0];
  const labels: Record<string, string> = {
    fullName: "Nome completo",
    phone: "Telefone",
    zipCode: "CEP",
    street: "Rua",
    number: "Número",
    complement: "Complemento",
    neighborhood: "Bairro",
    city: "Cidade",
    state: "UF",
    method: "Forma de pagamento",
  };
  if (typeof field === "string" && labels[field]) return `${labels[field]}: ${issue.message}`;
  return issue.message;
}

export function CheckoutClient({ tenant, title = "Checkout" }: CheckoutClientProps) {
  const router = useRouter();

  const cartItems = useCartStore((s) => s.items);

  const authLoading = useAuthStore((s) => s.loading);
  const authError = useAuthStore((s) => s.error);
  const authData = useAuthStore((s) => s.data);
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const clearAuthError = useAuthStore((s) => s.clearError);
  const resetAuth = useAuthStore((s) => s.reset);

  const ordersLoading = useOrdersStore((s) => s.loading);
  const ordersError = useOrdersStore((s) => s.error);
  const createOrder = useOrdersStore((s) => s.createOrder);
  const clearOrdersError = useOrdersStore((s) => s.clearError);
  const resetOrders = useOrdersStore((s) => s.reset);
  const ordersData = useOrdersStore((s) => s.data);

  const [checked, setChecked] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");

  const [address, setAddress] = React.useState({
    fullName: "",
    phone: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "SP",
  });

  const [paymentMethod, setPaymentMethod] = React.useState<"pix" | "credit_card" | "cash">("pix");

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
    const next = encodeURIComponent(`/${tenant}/checkout`);
    router.replace(`/${tenant}/login?next=${next}`);
  }, [checked, authLoading, isAuthenticated, router, tenant]);

  const subtotal = getCartSubtotal(cartItems);
  const canSubmit = checked && isAuthenticated && cartItems.length > 0 && !authLoading && !ordersLoading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    if (authError) clearAuthError();
    if (ordersError) clearOrdersError();

    const parsed = CheckoutFormSchema.safeParse({
      address: {
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        zipCode: address.zipCode.trim(),
        street: address.street.trim(),
        number: address.number.trim(),
        complement: address.complement.trim() || null,
        neighborhood: address.neighborhood.trim(),
        city: address.city.trim(),
        state: address.state.trim().toUpperCase(),
      },
      payment: {
        method: paymentMethod,
        status: "pending",
        transactionId: null,
      },
    });

    if (!parsed.success) {
      const message = parsed.error.issues.map(mapZodIssueToMessage).join(" | ");
      setSubmitError(message || "Dados inválidos.");
      return;
    }

    const items = cartItems.map((it) => ({
      productId: it.productId,
      sku: null as string | null,
      name: it.name,
      quantity: it.qty,
      unitPrice: it.price,
    }));

    const order = await createOrder(tenant, { items, address: parsed.data.address, payment: parsed.data.payment });
    if (!order) return;

    const orderId = encodeURIComponent(order.id);
    router.replace(`/${tenant}/checkout/sucesso?orderId=${orderId}`);
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <Button asChild variant="ghost">
            <Link href={`/${tenant}/carrinho`}>Voltar ao carrinho</Link>
          </Button>
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
                <Button onClick={() => void refreshMe(tenant)} disabled={authLoading}>
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
        ) : cartItems.length === 0 ? (
          <StateCard
            className="mt-8"
            title="Carrinho vazio"
            tone="muted"
            description="Seu carrinho está vazio."
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
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Entrega</CardTitle>
                  <CardDescription>Endereço mock do MVP.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-4" onSubmit={handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-1.5 sm:col-span-2">
                        <label className="text-sm font-medium" htmlFor="fullName">
                          Nome completo
                        </label>
                        <input
                          id="fullName"
                          value={address.fullName}
                          onChange={(e) => {
                            setAddress((s) => ({ ...s, fullName: e.target.value }));
                            if (submitError) setSubmitError("");
                            if (ordersError) clearOrdersError();
                          }}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium" htmlFor="phone">
                          Telefone
                        </label>
                        <input
                          id="phone"
                          value={address.phone}
                          onChange={(e) => {
                            setAddress((s) => ({ ...s, phone: e.target.value }));
                            if (submitError) setSubmitError("");
                          }}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium" htmlFor="zipCode">
                          CEP
                        </label>
                        <input
                          id="zipCode"
                          value={address.zipCode}
                          onChange={(e) => {
                            setAddress((s) => ({ ...s, zipCode: e.target.value }));
                            if (submitError) setSubmitError("");
                          }}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                      </div>

                      <div className="grid gap-1.5 sm:col-span-2">
                        <label className="text-sm font-medium" htmlFor="street">
                          Rua
                        </label>
                        <input
                          id="street"
                          value={address.street}
                          onChange={(e) => {
                            setAddress((s) => ({ ...s, street: e.target.value }));
                            if (submitError) setSubmitError("");
                          }}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium" htmlFor="number">
                          Número
                        </label>
                        <input
                          id="number"
                          value={address.number}
                          onChange={(e) => {
                            setAddress((s) => ({ ...s, number: e.target.value }));
                            if (submitError) setSubmitError("");
                          }}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium" htmlFor="complement">
                          Complemento
                        </label>
                        <input
                          id="complement"
                          value={address.complement}
                          onChange={(e) => {
                            setAddress((s) => ({ ...s, complement: e.target.value }));
                            if (submitError) setSubmitError("");
                          }}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium" htmlFor="neighborhood">
                          Bairro
                        </label>
                        <input
                          id="neighborhood"
                          value={address.neighborhood}
                          onChange={(e) => {
                            setAddress((s) => ({ ...s, neighborhood: e.target.value }));
                            if (submitError) setSubmitError("");
                          }}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium" htmlFor="city">
                          Cidade
                        </label>
                        <input
                          id="city"
                          value={address.city}
                          onChange={(e) => {
                            setAddress((s) => ({ ...s, city: e.target.value }));
                            if (submitError) setSubmitError("");
                          }}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium" htmlFor="state">
                          UF
                        </label>
                        <input
                          id="state"
                          value={address.state}
                          onChange={(e) => {
                            setAddress((s) => ({ ...s, state: e.target.value }));
                            if (submitError) setSubmitError("");
                          }}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          maxLength={2}
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-2 grid gap-3 rounded-lg border border-border bg-background p-4">
                      <div className="text-sm font-semibold tracking-tight">Pagamento</div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="pix"
                            checked={paymentMethod === "pix"}
                            onChange={() => setPaymentMethod("pix")}
                          />
                          PIX
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="credit_card"
                            checked={paymentMethod === "credit_card"}
                            onChange={() => setPaymentMethod("credit_card")}
                          />
                          Cartão
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={paymentMethod === "cash"}
                            onChange={() => setPaymentMethod("cash")}
                          />
                          Dinheiro
                        </label>
                      </div>
                    </div>

                    {submitError ? (
                      <div className="rounded-md border border-border bg-background p-3 text-sm text-destructive">
                        {submitError}
                      </div>
                    ) : null}
                    {ordersError ? (
                      <div className="rounded-md border border-border bg-background p-3 text-sm text-destructive">
                        {ordersError}
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2">
                      <Button type="submit" disabled={!canSubmit}>
                        {ordersLoading ? "Criando pedido…" : "Confirmar pedido"}
                      </Button>
                      <Button asChild variant="ghost" disabled={ordersLoading}>
                        <Link href={`/${tenant}/carrinho`}>Editar carrinho</Link>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </section>

            <Card className="h-fit">
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle className="text-lg">Resumo</CardTitle>
                  <CardDescription>Itens do carrinho.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    {cartItems.map((it) => (
                      <div key={it.productId} className="flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{it.name}</div>
                          <div className="text-muted-foreground">
                            {it.qty} × R$ {it.price.toFixed(2)}
                          </div>
                        </div>
                        <div className="shrink-0 font-semibold">R$ {(it.qty * it.price).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Entrega</span>
                    <span className="font-semibold">R$ 0,00</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-base font-semibold">R$ {subtotal.toFixed(2)}</span>
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
