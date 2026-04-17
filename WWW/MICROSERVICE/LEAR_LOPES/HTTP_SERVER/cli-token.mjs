import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFrom } from "./lib/env.mjs";
import { TokenManager } from "./lib/token-manager.mjs";

function safeString(value) {
  return String(value ?? "").trim();
}

function getArgValue(name) {
  const prefix = `${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  if (!found) return "";
  return found.slice(prefix.length).trim();
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function resolveEnvDir(__dirname, envName) {
  const key = safeString(envName).toUpperCase();
  if (key === "BACK") return path.resolve(__dirname, "..", "BACK");
  if (key === "MOCK") return path.resolve(__dirname, "..", "MOCK");
  throw new Error('Env invalido. Use --env=BACK ou --env=MOCK');
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const envName = getArgValue("--env");
  const envDir = resolveEnvDir(__dirname, envName);
  const env = await loadEnvFrom(envDir);
  const tm = new TokenManager({ envDir, env });

  const refreshToken = getArgValue("--refresh-token");

  let token;
  if (hasFlag("--generate")) token = await tm.generate();
  else if (hasFlag("--refresh")) token = await tm.refresh({ refreshToken });
  else if (hasFlag("--ensure")) token = await tm.ensureValidToken();
  else throw new Error("Use uma das flags: --generate | --refresh | --ensure");

  process.stdout.write(`${JSON.stringify({ ok: true, env: safeString(envName).toUpperCase(), tokenFile: tm.tokenFilePath, dtExpira: token?.dtExpira ?? null }, null, 2)}\n`);
}

main().catch((err) => {
  process.stderr.write(`${safeString(err?.message ?? err)}\n`);
  process.exitCode = 1;
});

