import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

function isRecord(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function stableErrorCode(err) {
  const code = String(err?.code ?? "").trim();
  if (code) return code;
  const msg = String(err?.message ?? "").trim();
  if (!msg) return "UNKNOWN";
  return msg.slice(0, 60);
}

export async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function renameReplace(src, dst) {
  try {
    await fs.rename(src, dst);
    return;
  } catch (err) {
    const code = String(err?.code ?? "");
    // Windows pode falhar ao renomear sobre um arquivo existente.
    if (code === "EEXIST" || code === "EPERM") {
      await fs.rm(dst, { force: true });
      await fs.rename(src, dst);
      return;
    }
    throw err;
  }
}

export async function writeJsonAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  const tmpName = `.tmp-${process.pid}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.json`;
  const tmpPath = path.join(dir, tmpName);
  const payload = JSON.stringify(data, null, 2) + "\n";
  await fs.writeFile(tmpPath, payload, "utf8");

  await renameReplace(tmpPath, filePath);
}

const FILE_LOCKS = new Map();

export async function withFileLock(filePath, fn) {
  const key = String(filePath ?? "");
  const prev = FILE_LOCKS.get(key) ?? Promise.resolve();

  let release = () => {};
  const curr = new Promise((resolve) => {
    release = resolve;
  });

  const chain = prev.then(() => curr);
  FILE_LOCKS.set(key, chain);

  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (FILE_LOCKS.get(key) === chain) FILE_LOCKS.delete(key);
  }
}

export function ensureJsonRootObject(value, label = "json") {
  if (!isRecord(value)) {
    const err = new Error(`invalid_${label}_root`);
    err.code = "INVALID_JSON_ROOT";
    throw err;
  }
  return value;
}

export function upsertArrayItemById(rootObj, arrayKey, item) {
  const root = ensureJsonRootObject(rootObj, "file");
  const key = String(arrayKey ?? "").trim();
  if (!key) {
    const err = new Error("missing_array_key");
    err.code = "MISSING_ARRAY_KEY";
    throw err;
  }

  const rec = ensureJsonRootObject(item, "item");
  const id = String(rec.id ?? "").trim();
  if (!id) {
    const err = new Error("missing_id");
    err.code = "MISSING_ID";
    throw err;
  }

  const arrRaw = root[key];
  const arr = Array.isArray(arrRaw) ? arrRaw : [];
  const idx = arr.findIndex((x) => isRecord(x) && String(x.id ?? "").trim() === id);
  if (idx >= 0) arr[idx] = { ...arr[idx], ...rec, id };
  else arr.push({ ...rec, id });
  root[key] = arr;
  return { root, item: arr.find((x) => String(x?.id ?? "") === id) ?? null };
}

export function removeArrayItemById(rootObj, arrayKey, idRaw) {
  const root = ensureJsonRootObject(rootObj, "file");
  const key = String(arrayKey ?? "").trim();
  if (!key) {
    const err = new Error("missing_array_key");
    err.code = "MISSING_ARRAY_KEY";
    throw err;
  }
  const id = String(idRaw ?? "").trim();
  if (!id) {
    const err = new Error("missing_id");
    err.code = "MISSING_ID";
    throw err;
  }

  const arrRaw = root[key];
  const arr = Array.isArray(arrRaw) ? arrRaw : [];
  const before = arr.length;
  const next = arr.filter((x) => !(isRecord(x) && String(x.id ?? "").trim() === id));
  root[key] = next;
  return { root, removed: before !== next.length };
}

export function toPublicError(err) {
  const code = stableErrorCode(err);
  if (code === "payload_too_large") return { status: 413, error: "payload_too_large" };
  if (code === "ENOENT") return { status: 404, error: "not_found" };
  if (code.includes("JSON")) return { status: 400, error: "invalid_json" };
  if (code === "INVALID_JSON_ROOT") return { status: 400, error: "invalid_json_root" };
  if (code === "MISSING_ID") return { status: 400, error: "missing_id" };
  if (code === "MISSING_ARRAY_KEY") return { status: 400, error: "missing_array_key" };
  return { status: 500, error: "internal_error" };
}

