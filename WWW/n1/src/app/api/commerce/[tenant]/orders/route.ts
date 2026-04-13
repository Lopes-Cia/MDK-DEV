import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ensureOrdersFile, saveOrdersFile } from "@/lib/commerce/mockend-json";
import { AddressSchema, OrderSchema, PaymentSchema } from "@/lib/commerce/schemas";

import { jsonError, looksLikeTenant, readJsonBody, requireSession } from "../_lib";

export const runtime = "nodejs";

const CreateOrderBodySchema = z.object({
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
    .min(1),
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

  const now = new Date().toISOString();
  const items = body.data.items.map((i) => {
    const lineTotal = Number((i.quantity * i.unitPrice).toFixed(2));
    return {
      id: randomUUID(),
      productId: i.productId,
      sku: i.sku ?? null,
      name: i.name,
      quantity: i.quantity,
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
    createdAt: now,
    updatedAt: now,
  });

  const ordersFile = await ensureOrdersFile(tenant);
  await saveOrdersFile(tenant, { ...ordersFile, orders: [...ordersFile.orders, order] });

  return NextResponse.json({ ok: true, order }, { status: 201 });
}
