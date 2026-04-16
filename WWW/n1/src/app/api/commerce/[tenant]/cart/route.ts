import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ensureCartsFile, saveCartsFile } from "@/lib/commerce/mockend-json";
import { CartItemSchema, CartSchema } from "@/lib/commerce/schemas";

import { jsonError, looksLikeTenant, readJsonBody, requireSession } from "../_lib";

export const runtime = "nodejs";

function calcTotals(items: Array<z.infer<typeof CartItemSchema>>) {
  const subtotal = Number(items.reduce((acc, it) => acc + it.unitPrice * it.qty, 0).toFixed(2));
  const shipping = 0;
  const discount = 0;
  const total = Number((subtotal + shipping - discount).toFixed(2));
  return { subtotal, shipping, discount, total, currency: "BRL" as const };
}

const PutCartBodySchema = z.object({
  // opcional para permitir “limpar carrinho” via PUT sem payload completo
  items: z.array(CartItemSchema).optional(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;
  if (!looksLikeTenant(tenant)) return jsonError(404, "tenant_not_found");

  const auth = await requireSession(tenant, req);
  if (!auth.ok) return auth.response;

  const cartsFile = await ensureCartsFile(tenant);
  const cart = cartsFile.carts.find((c) => c.userId === auth.user.id);
  if (cart) return NextResponse.json({ ok: true, cart }, { status: 200 });

  const now = new Date().toISOString();
  const empty = CartSchema.parse({
    id: auth.user.id,
    userId: auth.user.id,
    items: [],
    totals: calcTotals([]),
    updatedAt: now,
  });
  return NextResponse.json({ ok: true, cart: empty }, { status: 200 });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;
  if (!looksLikeTenant(tenant)) return jsonError(404, "tenant_not_found");

  const auth = await requireSession(tenant, req);
  if (!auth.ok) return auth.response;

  const body = await readJsonBody(req, PutCartBodySchema);
  if (!body.ok) return jsonError(body.status, "invalid_request", { issues: body.issues });

  const items = body.data.items ?? [];
  const now = new Date().toISOString();

  const cartsFile = await ensureCartsFile(tenant);
  const idx = cartsFile.carts.findIndex((c) => c.userId === auth.user.id);

  const nextCart = CartSchema.parse({
    id: auth.user.id,
    userId: auth.user.id,
    items,
    totals: calcTotals(items),
    updatedAt: now,
  });

  const nextCarts = [...cartsFile.carts];
  if (idx === -1) nextCarts.push(nextCart);
  else nextCarts[idx] = nextCart;

  await saveCartsFile(tenant, { ...cartsFile, carts: nextCarts });

  return NextResponse.json({ ok: true, cart: nextCart }, { status: 200 });
}

