import "server-only";

import { z } from "zod";

import {
  COMMERCE_SCHEMA_VERSION,
  OrdersFileSchema,
  SessionsFileSchema,
  UsersFileSchema,
  type OrdersFile,
  type SessionsFile,
  type UsersFile,
} from "./schemas";

function getMockEndBaseUrl() {
  const base = process.env.NEXT_PUBLIC_MOCKEND_BASE_URL ?? "http://localhost:4000";
  return base.replace(/\/+$/, "");
}

function commercePath(fileName: "users.json" | "sessions.json" | "orders.json") {
  return `COMMERCE/${fileName}`;
}

async function mockendGetJson(tenant: string, relPath: string) {
  const base = getMockEndBaseUrl();
  const t = encodeURIComponent(tenant);
  const url = `${base}/api/${t}/json?path=${encodeURIComponent(relPath)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) return { ok: false as const, status: 404 as const, data: null };
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`mockend_get_failed:${res.status}:${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as { data?: unknown };
  return { ok: true as const, status: 200 as const, data: body?.data };
}

async function mockendPutJson(tenant: string, relPath: string, data: unknown) {
  const base = getMockEndBaseUrl();
  const t = encodeURIComponent(tenant);
  const url = `${base}/api/${t}/json?path=${encodeURIComponent(relPath)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`mockend_put_failed:${res.status}:${text.slice(0, 200)}`);
  }
}

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}:${i.message}`).slice(0, 6);
    throw new Error(`invalid_${label}:${issues.join("|")}`);
  }
  return parsed.data;
}

export async function ensureUsersFile(tenant: string): Promise<UsersFile> {
  const relPath = commercePath("users.json");
  const res = await mockendGetJson(tenant, relPath);
  if (!res.ok) {
    const seed: UsersFile = { schemaVersion: COMMERCE_SCHEMA_VERSION, users: [] };
    await mockendPutJson(tenant, relPath, seed);
    return seed;
  }
  return parseOrThrow(UsersFileSchema, res.data, "users_file");
}

export async function saveUsersFile(tenant: string, file: UsersFile) {
  const relPath = commercePath("users.json");
  const data = parseOrThrow(UsersFileSchema, file, "users_file");
  await mockendPutJson(tenant, relPath, data);
}

export async function ensureSessionsFile(tenant: string): Promise<SessionsFile> {
  const relPath = commercePath("sessions.json");
  const res = await mockendGetJson(tenant, relPath);
  if (!res.ok) {
    const seed: SessionsFile = { schemaVersion: COMMERCE_SCHEMA_VERSION, sessions: [] };
    await mockendPutJson(tenant, relPath, seed);
    return seed;
  }
  return parseOrThrow(SessionsFileSchema, res.data, "sessions_file");
}

export async function saveSessionsFile(tenant: string, file: SessionsFile) {
  const relPath = commercePath("sessions.json");
  const data = parseOrThrow(SessionsFileSchema, file, "sessions_file");
  await mockendPutJson(tenant, relPath, data);
}

export async function ensureOrdersFile(tenant: string): Promise<OrdersFile> {
  const relPath = commercePath("orders.json");
  const res = await mockendGetJson(tenant, relPath);
  if (!res.ok) {
    const seed: OrdersFile = { schemaVersion: COMMERCE_SCHEMA_VERSION, orders: [] };
    await mockendPutJson(tenant, relPath, seed);
    return seed;
  }
  return parseOrThrow(OrdersFileSchema, res.data, "orders_file");
}

export async function saveOrdersFile(tenant: string, file: OrdersFile) {
  const relPath = commercePath("orders.json");
  const data = parseOrThrow(OrdersFileSchema, file, "orders_file");
  await mockendPutJson(tenant, relPath, data);
}
