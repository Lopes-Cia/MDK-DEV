import { readFile } from "node:fs/promises";
import path from "node:path";

export function parseEnv(raw) {
  const out = {};
  const lines = String(raw ?? "").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();

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

export async function loadEnvFrom(envDir) {
  const envPath = path.join(envDir, ".env");
  const raw = await readFile(envPath, "utf8");
  return parseEnv(raw);
}

