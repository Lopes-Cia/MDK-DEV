import { createHash, randomBytes, randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ensureSessionsFile, ensureUsersFile, saveSessionsFile, saveUsersFile } from "@/lib/commerce/mockend-json";
import { SessionSchema, UserSchema } from "@/lib/commerce/schemas";

import { jsonError, looksLikeTenant, readJsonBody, SESSION_COOKIE_NAME, toPublicUser } from "../../_lib";

export const runtime = "nodejs";

const RegisterBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
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

  const body = await readJsonBody(req, RegisterBodySchema);
  if (!body.ok) return jsonError(body.status, "invalid_request", { issues: body.issues });

  const usersFile = await ensureUsersFile(tenant);
  const email = body.data.email.toLowerCase();
  const exists = usersFile.users.some((u) => u.email.toLowerCase() === email);
  if (exists) return jsonError(409, "email_already_registered");

  const now = new Date().toISOString();
  const user = UserSchema.parse({
    id: randomUUID(),
    email,
    name: body.data.name,
    passwordHash: hashPassword(body.data.password),
    createdAt: now,
    updatedAt: now,
  });

  await saveUsersFile(tenant, { ...usersFile, users: [...usersFile.users, user] });

  const sessionsFile = await ensureSessionsFile(tenant);
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

  const res = NextResponse.json({ ok: true, user: toPublicUser(user) }, { status: 201 });
  res.cookies.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
  return res;
}
