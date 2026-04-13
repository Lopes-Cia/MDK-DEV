import { NextRequest, NextResponse } from "next/server";

import { jsonError, looksLikeTenant, requireSession, toPublicUser } from "../_lib";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;
  if (!looksLikeTenant(tenant)) return jsonError(404, "tenant_not_found");

  const auth = await requireSession(tenant, req);
  if (!auth.ok) return auth.response;

  return NextResponse.json({ ok: true, user: toPublicUser(auth.user) }, { status: 200 });
}
