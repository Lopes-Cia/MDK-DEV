import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { loadDotEnv } from "../lib/env.mjs";

const rootDir = path.resolve(process.cwd());

await loadDotEnv(rootDir, ".env");

const produtoName = String(process.env.PRODUTO ?? "connect").trim();
const routesPath = path.join(rootDir, "PRODUTO", produtoName, "routes.mjs");

const mod = await import(`${pathToFileURL(routesPath).href}?t=${Date.now()}`);
const routes = Array.isArray(mod?.routes) ? mod.routes : null;
if (!routes) {
  throw new Error("invalid_routes");
}

const simplified = routes.map((r) => {
  const out = { ...(r ?? {}) };
  delete out.auth;
  delete out.execution;

  const rawHandlerClass = typeof out.handler_class === "string" ? out.handler_class : "";
  const handlerClass = String(rawHandlerClass).trim().replace(/^\/+/, "");
  if (handlerClass) {
    out.handler_class = handlerClass.startsWith("mock/") ? handlerClass : `mock/${handlerClass}`;
  }

  return out;
});

const fileBody = `export const routes = ${JSON.stringify(simplified, null, 2)};\n`;
await fs.writeFile(routesPath, fileBody, "utf8");
process.stdout.write(`simplified: ${routesPath}\n`);
