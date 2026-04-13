import { createHash, randomBytes, randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ensureSessionsFile, ensureUsersFile, saveSessionsFile } from "@/lib/commerce/mockend-json";
import { SessionSchema } from "@/lib/commerce/schemas";

import { jsonError, looksLikeTenant, readJsonBody, SESSION_COOKIE_NAME, toPublicUser } from "../../_lib";

export const runtime = "nodejs";

const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function newToken() {
  return randomBytes(32).toString("hex");
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;
  if (!looksLikeTenant(tenant)) return jsonError(404, "tenant_not_found");

  const body = await readJsonBody(req, LoginBodySchema);
  if (!body.ok) return jsonError(body.status, "invalid_request", { issues: body.issues });

  const usersFile = await ensureUsersFile(tenant);
  const user = usersFile.users.find((u) => u.email.toLowerCase() === body.data.email.toLowerCase());
  if (!user) return jsonError(401, "invalid_credentials");

  const candidate = hashPassword(body.data.password);
  if (user.passwordHash !== candidate) return jsonError(401, "invalid_credentials");

  const sessionsFile = await ensureSessionsFile(tenant);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  const session = SessionSchema.parse({
    id: randomUUID(),
    tenant,
    userId: user.id,
    token: newToken(),
    createdAt: now,
    expiresAt,
  });

  await saveSessionsFile(tenant, { ...sessionsFile, sessions: [...sessionsFile.sessions, session] });

  const res = NextResponse.json({ ok: true, user: toPublicUser(user) }, { status: 200 });
  res.cookies.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
  return res;
}
