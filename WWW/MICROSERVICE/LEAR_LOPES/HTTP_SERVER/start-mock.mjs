import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFrom } from "./lib/env.mjs";
import { TokenManager } from "./lib/token-manager.mjs";
import { HttpServer } from "./lib/http-server.mjs";

function safeString(value) {
  return String(value ?? "").trim();
}

function toPort(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const envDir = path.resolve(__dirname, "..", "MOCK");
  const env = await loadEnvFrom(envDir);
  const port = toPort(env.HTTP_SERVER_PORT, 3101);

  const tokenManager = new TokenManager({ envDir, env });
  const server = new HttpServer({ envDir, env, tokenManager, port, label: "MOCK" });
  await server.start();

  process.stdout.write(`MOCK: http://localhost:${port}\n`);
}

main().catch((err) => {
  process.stderr.write(`${safeString(err?.message ?? err)}\n`);
  process.exitCode = 1;
});

