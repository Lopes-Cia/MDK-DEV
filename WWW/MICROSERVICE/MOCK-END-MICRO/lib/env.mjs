import fs from "node:fs/promises";
import path from "node:path";

const APPLIED_PROCESS_ENV = new Map();

export function parseDotEnv(raw) {
  const out = {};
  const lines = String(raw ?? "").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = String(line ?? "").trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (!key) continue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export async function loadDotEnv(rootDir, fileName = ".env") {
  const filePath = path.join(rootDir, fileName);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = String(line ?? "").trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (!key) continue;
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] == null) {
        process.env[key] = value;
        APPLIED_PROCESS_ENV.set(key, value);
      }
    }
  } catch (err) {
    if (err?.code !== "ENOENT") {
      process.stderr.write(
        `[mock-end-micro] Falha ao ler .env (${filePath}): ${String(err?.message ?? err)}\n`
      );
    }
  }
}

export function getAppliedProcessEnv() {
  return new Map(APPLIED_PROCESS_ENV);
}

