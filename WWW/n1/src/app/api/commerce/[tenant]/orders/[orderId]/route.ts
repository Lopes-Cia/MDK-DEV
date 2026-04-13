import { NextRequest, NextResponse } from "next/server";

import { ensureOrdersFile } from "@/lib/commerce/mockend-json";

import { jsonError, looksLikeTenant, requireSession } from "../../_lib";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ tenant: string; orderId: string }> },
) {
  const { tenant, orderId } = await ctx.params;
  if (!looksLikeTenant(tenant)) return jsonError(404, "tenant_not_found");

  const auth = await requireSession(tenant, req);
  if (!auth.ok) return auth.response;

  const ordersFile = await ensureOrdersFile(tenant);
  const order = ordersFile.orders.find((o) => o.id === orderId && o.userId === auth.user.id);
  if (!order) return jsonError(404, "order_not_found");

  return NextResponse.json({ ok: true, order }, { status: 200 });
}
