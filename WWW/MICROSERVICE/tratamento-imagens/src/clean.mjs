import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const output = {};
  for (const arg of argv.slice(2)) {
    if (!arg.startsWith("--")) continue;
    const [key, ...rest] = arg.slice(2).split("=");
    output[key] = rest.join("=") || true;
  }
  return output;
}

async function rmIfExists(target) {
  try {
    await fs.rm(target, { recursive: true, force: true });
  } catch {
  }
}

async function pruneEmptyDirs(rootDir) {
  let entries;
  try {
    entries = await fs.readdir(rootDir, { withFileTypes: true });
  } catch {
    return false;
  }
  let hasContent = false;
  for (const entry of entries) {
    const p = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      const childHasContent = await pruneEmptyDirs(p);
      if (childHasContent) {
        hasContent = true;
      }
    } else {
      hasContent = true;
    }
  }
  if (!hasContent) {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
  return hasContent;
}

async function main() {
  const args = parseArgs(process.argv);
  const all = args.all === true || args.all === "1";
  const cleanImages = all || args.images === true || args.images === "1";
  const cleanTemp = all || args.temp === true || args.temp === "1";
  const pruneImages = args.prune === true || args.prune === "1";

  if (cleanImages) await rmIfExists(path.join(ROOT, "images"));
  if (cleanTemp) await rmIfExists(path.join(ROOT, "temp"));
  if (pruneImages) await pruneEmptyDirs(path.join(ROOT, "images"));
}

main().catch((e) => {
  process.stderr.write(`[fatal] ${String(e?.message ?? e)}\n`);
  process.exitCode = 1;
});
