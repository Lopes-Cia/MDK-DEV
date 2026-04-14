import fs from "node:fs/promises";
import path from "node:path";

// Env é carregado em 2 níveis:
// - loadDotEnv(ROOT, ".env"): apenas defaults do processo (ex.: PORT).
// - resolveProjectEnv({ projectDir }): lê PROJETOS/<base>/.env para upstream e parâmetros do integrador.
// O objetivo é manter configuração de upstream por base, sem depender do .env global para URLs.
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

export async function readDotEnvObject(rootDir, fileName = ".env") {
  const filePath = path.join(rootDir, fileName);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return parseDotEnv(raw);
  } catch (err) {
    if (err?.code !== "ENOENT") {
      process.stderr.write(
        `[mock-end] Falha ao ler .env (${filePath}): ${String(err?.message ?? err)}\n`
      );
    }
    return {};
  }
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
        `[mock-end] Falha ao ler .env: ${String(err?.message ?? err)}\n`
      );
    }
  }
}

export async function resolveProjectEnv({
  projectDir = null,
  projectFileName = ".env",
  fallback = {},
  processEnv = process.env,
} = {}) {
  const fallbackEnv = fallback && typeof fallback === "object" ? fallback : {};

  const projectEnv =
    projectDir && typeof projectDir === "string"
      ? await readDotEnvObject(projectDir, projectFileName)
      : {};

  const processOverrides = {};
  for (const [k, v] of Object.entries(processEnv ?? {})) {
    if (v == null) continue;
    const value = String(v);
    const appliedValue = APPLIED_PROCESS_ENV.get(k);
    if (appliedValue != null && appliedValue === value) continue;
    processOverrides[k] = value;
  }

  return {
    ...fallbackEnv,
    ...projectEnv,
    ...processOverrides,
  };
}
