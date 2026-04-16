import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ensureCartsFile, ensureOrdersFile, saveCartsFile, saveOrdersFile } from "@/lib/commerce/mockend-json";
import { AddressSchema, OrderSchema, PaymentSchema } from "@/lib/commerce/schemas";

import { jsonError, looksLikeTenant, readJsonBody, requireSession } from "../_lib";

export const runtime = "nodejs";

const CreateOrderBodySchema = z.object({
  // compat: ainda aceita `items` no body, mas a origem “oficial” do pedido é o carrinho persistido.
  items: z
    .array(
      z.object({
        productId: z.number().int().nonnegative(),
        sku: z.string().optional().nullable(),
        name: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
      }),
    )
    .min(1)
    .optional(),
  address: AddressSchema,
  payment: PaymentSchema,
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;
  if (!looksLikeTenant(tenant)) return jsonError(404, "tenant_not_found");

  const auth = await requireSession(tenant, req);
  if (!auth.ok) return auth.response;

  const ordersFile = await ensureOrdersFile(tenant);
  const orders = ordersFile.orders
    .filter((o) => o.userId === auth.user.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return NextResponse.json({ ok: true, orders }, { status: 200 });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;
  if (!looksLikeTenant(tenant)) return jsonError(404, "tenant_not_found");

  const auth = await requireSession(tenant, req);
  if (!auth.ok) return auth.response;

  const body = await readJsonBody(req, CreateOrderBodySchema);
  if (!body.ok) return jsonError(body.status, "invalid_request", { issues: body.issues });

  const nowIso = new Date().toISOString();

  const cartsFile = await ensureCartsFile(tenant);
  const cartIdx = cartsFile.carts.findIndex((c) => c.userId === auth.user.id);

  const cartItems = body.data.items
    ? body.data.items.map((i) => ({
        productId: i.productId,
        sku: i.sku ?? null,
        name: i.name,
        unitPrice: i.unitPrice,
        qty: i.quantity,
      }))
    : cartIdx >= 0
      ? cartsFile.carts[cartIdx]!.items
      : [];

  if (!cartItems.length) return jsonError(400, "cart_empty");

  // Se veio `items` no body, sincroniza com o carrinho persistido (compat com UI atual).
  if (body.data.items) {
    const subtotal = Number(cartItems.reduce((acc, it) => acc + it.unitPrice * it.qty, 0).toFixed(2));
    const shipping = 0;
    const discount = 0;
    const total = Number((subtotal + shipping - discount).toFixed(2));
    const nextCart = {
      id: auth.user.id,
      userId: auth.user.id,
      items: cartItems,
      totals: { subtotal, shipping, discount, total, currency: "BRL" },
      updatedAt: nowIso,
    };
    const nextCarts = [...cartsFile.carts];
    if (cartIdx === -1) nextCarts.push(nextCart);
    else nextCarts[cartIdx] = nextCart;
    await saveCartsFile(tenant, { ...cartsFile, carts: nextCarts });
  }

  const items = cartItems.map((i) => {
    const lineTotal = Number((i.qty * i.unitPrice).toFixed(2));
    return {
      id: randomUUID(),
      productId: i.productId,
      sku: i.sku ?? null,
      name: i.name,
      quantity: i.qty,
      unitPrice: i.unitPrice,
      lineTotal,
    };
  });
  const itemsSubtotal = Number(items.reduce((acc, it) => acc + it.lineTotal, 0).toFixed(2));
  const shipping = 0;
  const discount = 0;
  const grandTotal = Number((itemsSubtotal + shipping - discount).toFixed(2));

  const order = OrderSchema.parse({
    id: randomUUID(),
    tenant,
    userId: auth.user.id,
    status: "created",
    items,
    address: body.data.address,
    payment: body.data.payment,
    totals: {
      itemsSubtotal,
      shipping,
      discount,
      grandTotal,
      currency: "BRL",
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  const ordersFile = await ensureOrdersFile(tenant);
  await saveOrdersFile(tenant, { ...ordersFile, orders: [...ordersFile.orders, order] });

  // Limpa carrinho após sucesso (best-effort, mas falha deve ser visível).
  const clearedCart = {
    id: auth.user.id,
    userId: auth.user.id,
    items: [],
    totals: { subtotal: 0, shipping: 0, discount: 0, total: 0, currency: "BRL" },
    updatedAt: nowIso,
  };
  const nextCarts = [...cartsFile.carts];
  if (cartIdx === -1) nextCarts.push(clearedCart);
  else nextCarts[cartIdx] = clearedCart;
  await saveCartsFile(tenant, { ...cartsFile, carts: nextCarts });

  return NextResponse.json({ ok: true, order }, { status: 201 });
}
