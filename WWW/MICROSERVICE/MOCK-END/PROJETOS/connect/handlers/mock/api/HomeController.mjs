import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLECTIONS_FILE = path.resolve(__dirname, "..", "colections.json");

let colectionsCache = null;

async function readJsonFile(filePath, label) {
  let raw = "{}";
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} não conseguiu ler arquivo (${filePath}): ${String(err?.message ?? err)}\n`
    );
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} JSON inválido (${filePath}): ${String(err?.message ?? err)}\n`
    );
    return {};
  }
}

async function loadColections() {
  if (colectionsCache) return colectionsCache;
  const parsed = await readJsonFile(COLECTIONS_FILE, "mock/home(colections)");
  colectionsCache = parsed && typeof parsed === "object" ? parsed : {};
  return colectionsCache;
}

export class HomeController {
  async home() {
    return loadColections();
  }
}
