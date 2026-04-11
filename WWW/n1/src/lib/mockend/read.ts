import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { getMockEndRoot } from "./root";

export async function readMockEndText(segments: string[]) {
  const root = getMockEndRoot();
  const fullPath = path.join(root, ...segments);
  return await fs.readFile(fullPath, "utf8");
}

export async function readMockEndJson<T>(segments: string[]): Promise<T> {
  const raw = await readMockEndText(segments);
  return JSON.parse(raw) as T;
}

export async function readTenantText(tenant: string, segments: string[]) {
  return await readMockEndText([tenant, ...segments]);
}

export async function readTenantJson<T>(tenant: string, segments: string[]): Promise<T> {
  return await readMockEndJson<T>([tenant, ...segments]);
}

