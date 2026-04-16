import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ensurePasswordResetsFile, ensureUsersFile, savePasswordResetsFile, saveUsersFile } from "@/lib/commerce/mockend-json";

import { jsonError, looksLikeTenant, readJsonBody } from "../../_lib";

export const runtime = "nodejs";

const ResetPasswordBodySchema = z.object({
  token: z.string().min(24),
  password: z.string().min(6),
});

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function isExpired(expiresAt: string, nowMs: number) {
  const exp = Date.parse(expiresAt);
  return Number.isFinite(exp) ? exp <= nowMs : true;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;
  if (!looksLikeTenant(tenant)) return jsonError(404, "tenant_not_found");

  const body = await readJsonBody(req, ResetPasswordBodySchema);
  if (!body.ok) return jsonError(body.status, "invalid_request", { issues: body.issues });

  const token = body.data.token;
  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();

  const resetsFile = await ensurePasswordResetsFile(tenant);
  const idx = resetsFile.passwordResets.findIndex((r) => r.token === token);
  if (idx === -1) return jsonError(400, "invalid_or_expired_reset_token");

  const reset = resetsFile.passwordResets[idx]!;
  if (reset.usedAt) return jsonError(400, "invalid_or_expired_reset_token");
  if (isExpired(reset.expiresAt, nowMs)) return jsonError(400, "invalid_or_expired_reset_token");

  const usersFile = await ensureUsersFile(tenant);
  const userIdx = usersFile.users.findIndex((u) => u.id === reset.userId);
  if (userIdx === -1) return jsonError(404, "user_not_found");

  const nextUsers = [...usersFile.users];
  nextUsers[userIdx] = {
    ...nextUsers[userIdx],
    passwordHash: hashPassword(body.data.password),
    updatedAt: nowIso,
  };
  await saveUsersFile(tenant, { ...usersFile, users: nextUsers });

  const nextResets = [...resetsFile.passwordResets];
  nextResets[idx] = { ...reset, usedAt: nowIso };
  await savePasswordResetsFile(tenant, { ...resetsFile, passwordResets: nextResets });

  return NextResponse.json({ ok: true }, { status: 200 });
}

