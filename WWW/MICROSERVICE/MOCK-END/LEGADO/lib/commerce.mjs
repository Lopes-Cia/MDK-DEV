import fs from "node:fs/promises";
import path from "node:path";

import { readJsonFile } from "./fs-json.mjs";

const COMMERCE_SCHEMA_VERSION = 1;
const SEEDED_COMMERCE_TENANTS = new Set();
const SEEDING_COMMERCE_TENANTS = new Map();

async function writeJsonIfMissing(filePath, data) {
  try {
    await fs.access(filePath);
    return false;
  } catch (err) {
    if (err?.code !== "ENOENT") throw err;
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8", {
      flag: "wx",
    });
    return true;
  } catch (err) {
    if (err?.code === "EEXIST") return false;
    throw err;
  }
}

export async function ensureCommerceSeed(rootDir, tenant) {
  const key = `${rootDir}::${tenant}`;
  if (SEEDED_COMMERCE_TENANTS.has(key)) return;
  const inFlight = SEEDING_COMMERCE_TENANTS.get(key);
  if (inFlight) return await inFlight;

  const p = (async () => {
    const dir = path.join(rootDir, tenant, "COMMERCE");
    await fs.mkdir(dir, { recursive: true });

    await writeJsonIfMissing(path.join(dir, "users.json"), {
      schemaVersion: COMMERCE_SCHEMA_VERSION,
      users: [],
    });
    await writeJsonIfMissing(path.join(dir, "sessions.json"), {
      schemaVersion: COMMERCE_SCHEMA_VERSION,
      sessions: [],
    });
    await writeJsonIfMissing(path.join(dir, "orders.json"), {
      schemaVersion: COMMERCE_SCHEMA_VERSION,
      orders: [],
    });
  })();

  SEEDING_COMMERCE_TENANTS.set(key, p);
  try {
    await p;
    SEEDED_COMMERCE_TENANTS.add(key);
  } finally {
    SEEDING_COMMERCE_TENANTS.delete(key);
  }
}

export async function readCommerceFile(rootDir, tenant, fileName) {
  const fullPath = path.join(rootDir, tenant, "COMMERCE", fileName);
  return await readJsonFile(fullPath);
}

export async function writeCommerceFile(rootDir, tenant, fileName, data) {
  const fullPath = path.join(rootDir, tenant, "COMMERCE", fileName);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}
