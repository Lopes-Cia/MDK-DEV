import { randomBytes, randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ensurePasswordResetsFile, ensureUsersFile, savePasswordResetsFile } from "@/lib/commerce/mockend-json";
import { PasswordResetSchema } from "@/lib/commerce/schemas";

import { jsonError, looksLikeTenant, readJsonBody } from "../../_lib";

export const runtime = "nodejs";

const ForgotPasswordBodySchema = z.object({
  email: z.string().email(),
});

function newResetToken() {
  return randomBytes(32).toString("hex");
}

function isExpired(expiresAt: string, nowMs: number) {
  const exp = Date.parse(expiresAt);
  return Number.isFinite(exp) ? exp <= nowMs : true;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;
  if (!looksLikeTenant(tenant)) return jsonError(404, "tenant_not_found");

  const body = await readJsonBody(req, ForgotPasswordBodySchema);
  if (!body.ok) return jsonError(body.status, "invalid_request", { issues: body.issues });

  const email = body.data.email.toLowerCase();
  const usersFile = await ensureUsersFile(tenant);
  const user = usersFile.users.find((u) => u.email.toLowerCase() === email);

  // MVP: não envia email de verdade. Evita enumeração respondendo "ok" sempre.
  if (!user) return NextResponse.json({ ok: true, token: null }, { status: 200 });

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60).toISOString(); // 1h
  const token = newResetToken();

  const resetsFile = await ensurePasswordResetsFile(tenant);
  const nowMs = now.getTime();
  const pruned = resetsFile.passwordResets.filter((r) => {
    if (r.userId !== user.id) return true;
    if (r.usedAt) return false; // remove resets usados do mesmo user (mantém arquivo enxuto no MVP)
    return !isExpired(r.expiresAt, nowMs);
  });

  const reset = PasswordResetSchema.parse({
    id: randomUUID(),
    userId: user.id,
    token,
    expiresAt,
    usedAt: null,
    createdAt: nowIso,
  });

  await savePasswordResetsFile(tenant, { ...resetsFile, passwordResets: [...pruned, reset] });

  return NextResponse.json({ ok: true, token }, { status: 200 });
}

