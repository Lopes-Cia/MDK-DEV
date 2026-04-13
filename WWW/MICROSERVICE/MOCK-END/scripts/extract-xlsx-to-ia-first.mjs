import fs from "node:fs/promises";
import path from "node:path";
import XLSX from "xlsx";

const CWD = process.cwd();
const REPO_ROOT = path.resolve(CWD, "..", "..", "..");
const SOURCE_CANDIDATES_REL = [
  path.join("IA", "DESENHOS", "mapa_paginas_ecommerce.xlsx"),
  path.join("IA", "DESENHOS", "LEGADO", "mapa_paginas_ecommerce.xlsx"),
];

async function resolveSourceFileAbs() {
  for (const rel of SOURCE_CANDIDATES_REL) {
    const abs = path.join(REPO_ROOT, rel);
    try {
      await fs.access(abs);
      return { rel, abs };
    } catch {
      continue;
    }
  }
  throw new Error(`source_xlsx_not_found: tried ${SOURCE_CANDIDATES_REL.join(", ")}`);
}

async function listTenants(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const candidates = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const tenants = [];
  for (const name of candidates) {
    try {
      const catalogDir = path.join(rootDir, name, "CATALOGO");
      await fs.access(path.join(catalogDir, "categorias.json"));
      await fs.access(path.join(catalogDir, "produtos.json"));
      tenants.push(name);
    } catch {
      continue;
    }
  }
  return tenants;
}

function safeRef(worksheet) {
  const ref = worksheet?.["!ref"];
  return typeof ref === "string" ? ref : null;
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function main() {
  const source = await resolveSourceFileAbs();
  const workbook = XLSX.readFile(source.abs, { cellDates: true });
  const sheets = workbook.SheetNames.map((name) => {
    const ws = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    return { name, ref: safeRef(ws), rows };
  });

  const payload = {
    sourceFile: source.rel.replace(/\\/g, "/"),
    extractedAt: new Date().toISOString(),
    sheets,
  };

  const tenants = await listTenants(CWD);
  for (const tenant of tenants) {
    const outPath = path.join(CWD, tenant, "BLUEPRINT", "mapa_paginas_ecommerce.ia.json");
    await writeJson(outPath, payload);
  }

  process.stdout.write(JSON.stringify({ ok: true, tenants, sheets: sheets.length }, null, 2) + "\n");
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + "\n");
  process.exit(1);
});
