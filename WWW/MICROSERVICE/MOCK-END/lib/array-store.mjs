import fs from "node:fs/promises";

import { withFileLock, writeJsonAtomic } from "./json-store.mjs";

function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export async function readJsonArray(filePath, label = "json-array") {
  let raw = "[]";
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    const code = String(err?.code ?? "");
    if (code === "ENOENT") return [];
    process.stderr.write(
      `[mock-end] ${label} não conseguiu ler arquivo (${filePath}): ${String(err?.message ?? err)}\n`
    );
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} JSON inválido (${filePath}): ${String(err?.message ?? err)}\n`
    );
    return [];
  }
}

export async function writeJsonArray(filePath, data) {
  const arr = Array.isArray(data) ? data : [];
  await withFileLock(filePath, async () => {
    await writeJsonAtomic(filePath, arr);
  });
}

export async function updateJsonArray(filePath, label, fn) {
  return await withFileLock(filePath, async () => {
    const current = await readJsonArray(filePath, label);
    const next = await fn(current);
    const out = Array.isArray(next) ? next : current;
    await writeJsonAtomic(filePath, out);
    return out;
  });
}

export function upsertById(list, item) {
  const arr = Array.isArray(list) ? list : [];
  const rec = isPlainObject(item) ? item : null;
  const id = String(rec?.id ?? "").trim();
  if (!id) return arr;

  const idx = arr.findIndex((x) => isPlainObject(x) && String(x.id ?? "").trim() === id);
  if (idx >= 0) {
    const current = isPlainObject(arr[idx]) ? arr[idx] : {};
    const next = { ...current, ...rec, id };
    const out = [...arr];
    out[idx] = next;
    return out;
  }
  return [...arr, { ...rec, id }];
}

export function removeById(list, idRaw) {
  const arr = Array.isArray(list) ? list : [];
  const id = String(idRaw ?? "").trim();
  if (!id) return arr;
  return arr.filter((x) => !(isPlainObject(x) && String(x.id ?? "").trim() === id));
}

export function findById(list, idRaw) {
  const arr = Array.isArray(list) ? list : [];
  const id = String(idRaw ?? "").trim();
  if (!id) return null;
  return arr.find((x) => isPlainObject(x) && String(x.id ?? "").trim() === id) ?? null;
}
