import fs from "node:fs/promises";
import path from "node:path";
import XLSX from "xlsx";

const CWD = process.cwd();
const REPO_ROOT = path.resolve(CWD, "..", "..", "..");
const SOURCE_FILE_REL = path.join("IA", "DESENHOS", "mapa_paginas_ecommerce.xlsx");
const SOURCE_FILE_ABS = path.join(REPO_ROOT, SOURCE_FILE_REL);

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
  const workbook = XLSX.readFile(SOURCE_FILE_ABS, { cellDates: true });
  const sheets = workbook.SheetNames.map((name) => {
    const ws = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    return { name, ref: safeRef(ws), rows };
  });

  const payload = {
    sourceFile: SOURCE_FILE_REL.replace(/\\/g, "/"),
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
