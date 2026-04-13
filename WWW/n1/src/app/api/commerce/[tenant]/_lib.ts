import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { PublicUserSchema, SessionSchema, UserSchema, type PublicUser, type Session, type User } from "@/lib/commerce/schemas";
import { ensureSessionsFile, ensureUsersFile, saveSessionsFile } from "@/lib/commerce/mockend-json";

export const SESSION_COOKIE_NAME = "commerce_session";

export function looksLikeTenant(value: string) {
  return /^[a-z0-9-]+$/.test(value);
}

export function jsonError(status: number, error: string, details?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...(details ? { details } : {}) }, { status });
}

export async function readJsonBody<T>(req: Request, schema: z.ZodType<T>) {
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ path: i.path, message: i.message })).slice(0, 8);
    return { ok: false as const, status: 400 as const, issues };
  }
  return { ok: true as const, data: parsed.data };
}

export function toPublicUser(user: User): PublicUser {
  return PublicUserSchema.parse(user);
}

export async function requireSession(tenant: string, req: NextRequest): Promise<
  | { ok: true; user: User; session: Session }
  | { ok: false; response: NextResponse }
> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { ok: false, response: jsonError(401, "not_authenticated") };

  const [usersFile, sessionsFile] = await Promise.all([ensureUsersFile(tenant), ensureSessionsFile(tenant)]);
  const session = sessionsFile.sessions.find((s) => s.token === token);
  if (!session) return { ok: false, response: jsonError(401, "invalid_session") };

  const now = Date.now();
  if (session.expiresAt) {
    const exp = Date.parse(session.expiresAt);
    if (Number.isFinite(exp) && exp <= now) {
      // cleanup best-effort
      const next = { ...sessionsFile, sessions: sessionsFile.sessions.filter((s) => s.id !== session.id) };
      await saveSessionsFile(tenant, next).catch(() => {});
      return { ok: false, response: jsonError(401, "session_expired") };
    }
  }

  const user = usersFile.users.find((u) => u.id === session.userId);
  if (!user) return { ok: false, response: jsonError(401, "user_not_found") };

  return { ok: true, user: UserSchema.parse(user), session: SessionSchema.parse(session) };
}
