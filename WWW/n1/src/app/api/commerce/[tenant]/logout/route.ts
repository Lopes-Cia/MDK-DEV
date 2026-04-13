import { NextRequest, NextResponse } from "next/server";

import { ensureSessionsFile, saveSessionsFile } from "@/lib/commerce/mockend-json";

import { jsonError, looksLikeTenant, SESSION_COOKIE_NAME } from "../_lib";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;
  if (!looksLikeTenant(tenant)) return jsonError(404, "tenant_not_found");

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const sessionsFile = await ensureSessionsFile(tenant);
    const next = { ...sessionsFile, sessions: sessionsFile.sessions.filter((s) => s.token !== token) };
    await saveSessionsFile(tenant, next).catch(() => {});
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(SESSION_COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
