import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFrom } from "./lib/env.mjs";
import { TokenManager } from "./lib/token-manager.mjs";
import { runRequestAndPersist } from "./lib/http-server.mjs";

function safeString(value) {
  return String(value ?? "").trim();
}

function getArgValue(name) {
  const prefix = `${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  if (!found) return "";
  return found.slice(prefix.length).trim();
}

function resolveEnvDir(__dirname, envName) {
  const key = safeString(envName).toUpperCase();
  if (key === "BACK") return path.resolve(__dirname, "..", "BACK");
  if (key === "MOCK") return path.resolve(__dirname, "..", "MOCK");
  throw new Error('Env invalido. Use --env=BACK ou --env=MOCK');
}

function parseJsonArg(raw) {
  const s = safeString(raw);
  if (!s) return null;
  return JSON.parse(s);
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const envName = getArgValue("--env");
  const envDir = resolveEnvDir(__dirname, envName);
  const env = await loadEnvFrom(envDir);
  const tokenManager = new TokenManager({ envDir, env });

  const base = getArgValue("--base") || "integration";
  const method = getArgValue("--method") || "GET";
  const p = getArgValue("--path");
  if (!p) throw new Error("Faltou --path=/...");

  const query = getArgValue("--query");
  const queryJson = getArgValue("--query-json");
  const bodyJson = getArgValue("--body-json");

  const out = await runRequestAndPersist({
    envDir,
    env,
    tokenManager,
    base,
    method,
    path: p,
    query: queryJson ? parseJsonArg(queryJson) : query || null,
    headers: null,
    body: bodyJson ? parseJsonArg(bodyJson) : null,
  });

  process.stdout.write(`${JSON.stringify({ ok: true, env: safeString(envName).toUpperCase(), ...out }, null, 2)}\n`);
}

main().catch((err) => {
  process.stderr.write(`${safeString(err?.message ?? err)}\n`);
  process.exitCode = 1;
});

