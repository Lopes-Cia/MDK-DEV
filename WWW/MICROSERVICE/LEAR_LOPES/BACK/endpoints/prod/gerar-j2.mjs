import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function safeString(value) {
  return String(value ?? "").trim();
}

function getArgValue(name) {
  const prefix = `${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  if (!found) return "";
  return found.slice(prefix.length).trim();
}

async function main() {
  const inArg = getArgValue("--in");
  const outArg = getArgValue("--out");

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  function resolveCliPath(cliValue, fallbackPathFromScriptDir) {
    const v = safeString(cliValue);
    if (!v) return path.resolve(__dirname, fallbackPathFromScriptDir);
    if (path.isAbsolute(v)) return v;
    return path.resolve(process.cwd(), v);
  }

  const inputPath = resolveCliPath(inArg, "j1.json");
  const outputPath = resolveCliPath(outArg, "j2.json");

  const raw = await fs.readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed) ? parsed : [];

  const out = items.map((it) => it?.descricaoEcomerce ?? null);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");

  process.stdout.write(`${JSON.stringify({ ok: true, inputPath, outputPath, count: out.length }, null, 2)}\n`);
}

main().catch((err) => {
  process.stderr.write(`${safeString(err?.message ?? err)}\n`);
  process.exitCode = 1;
});
