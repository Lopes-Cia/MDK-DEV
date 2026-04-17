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

async function startOne({ label, envDir, defaultPort }) {
  const env = await loadEnvFrom(envDir);
  const port = toPort(env.HTTP_SERVER_PORT, defaultPort);
  const tokenManager = new TokenManager({ envDir, env });
  const server = new HttpServer({ envDir, env, tokenManager, port, label });
  await server.start();
  return { label, port };
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const backDir = path.resolve(__dirname, "..", "BACK");
  const mockDir = path.resolve(__dirname, "..", "MOCK");

  const back = await startOne({ label: "BACK", envDir: backDir, defaultPort: 3100 });
  const mock = await startOne({ label: "MOCK", envDir: mockDir, defaultPort: 3101 });

  process.stdout.write(`BACK: http://localhost:${back.port}\n`);
  process.stdout.write(`MOCK: http://localhost:${mock.port}\n`);
}

main().catch((err) => {
  process.stderr.write(`${safeString(err?.message ?? err)}\n`);
  process.exitCode = 1;
});

