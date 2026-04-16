import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ensureUsersFile, saveUsersFile } from "@/lib/commerce/mockend-json";

import { jsonError, looksLikeTenant, readJsonBody, requireSession, toPublicUser } from "../_lib";

export const runtime = "nodejs";

const UpdateMeBodySchema = z
  .object({
    name: z
      .string()
      .transform((v) => v.trim())
      .refine((v) => v.length > 0, { message: "Nome obrigatório." })
      .optional(),
    phone: z.string().min(6).optional().nullable(),
  })
  .refine((data) => Object.prototype.hasOwnProperty.call(data, "name") || Object.prototype.hasOwnProperty.call(data, "phone"), {
    message: "Informe ao menos um campo para atualizar.",
  });

export async function GET(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;
  if (!looksLikeTenant(tenant)) return jsonError(404, "tenant_not_found");

  const auth = await requireSession(tenant, req);
  if (!auth.ok) return auth.response;

  return NextResponse.json({ ok: true, user: toPublicUser(auth.user) }, { status: 200 });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;
  if (!looksLikeTenant(tenant)) return jsonError(404, "tenant_not_found");

  const auth = await requireSession(tenant, req);
  if (!auth.ok) return auth.response;

  const body = await readJsonBody(req, UpdateMeBodySchema);
  if (!body.ok) return jsonError(body.status, "invalid_request", { issues: body.issues });

  const usersFile = await ensureUsersFile(tenant);
  const idx = usersFile.users.findIndex((u) => u.id === auth.user.id);
  if (idx === -1) return jsonError(404, "user_not_found");

  const now = new Date().toISOString();
  const current = usersFile.users[idx]!;
  const nextUser = {
    ...current,
    ...(Object.prototype.hasOwnProperty.call(body.data, "name") ? { name: body.data.name } : {}),
    ...(Object.prototype.hasOwnProperty.call(body.data, "phone") ? { phone: body.data.phone ?? null } : {}),
    updatedAt: now,
  };

  const nextUsers = [...usersFile.users];
  nextUsers[idx] = nextUser;
  await saveUsersFile(tenant, { ...usersFile, users: nextUsers });

  return NextResponse.json({ ok: true, user: toPublicUser(nextUser) }, { status: 200 });
}
