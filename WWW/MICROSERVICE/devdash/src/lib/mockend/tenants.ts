import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { getMockEndRoot } from "./root";

export async function listTenants() {
  const root = getMockEndRoot();
  let entries: Awaited<ReturnType<typeof fs.readdir>>;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const candidates = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const tenants: string[] = [];

  for (const name of candidates) {
    try {
      const catalogDir = path.join(root, name, "CATALOGO");
      await fs.access(path.join(catalogDir, "categorias.json"));
      await fs.access(path.join(catalogDir, "produtos.json"));
      tenants.push(name);
    } catch {
      continue;
    }
  }

  return tenants;
}

export async function isValidTenant(tenant: string) {
  const tenants = await listTenants();
  return tenants.includes(tenant);
}
