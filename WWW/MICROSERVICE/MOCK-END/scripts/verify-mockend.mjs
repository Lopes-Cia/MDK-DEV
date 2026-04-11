import fs from "node:fs/promises";
import path from "node:path";

const CWD = process.cwd();

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function readText(filePath) {
  return await fs.readFile(filePath, "utf8");
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function verifyTenant(tenant) {
  const base = path.join(CWD, tenant);
  const requiredFiles = [
    path.join(base, "CATALOGO", "categorias.json"),
    path.join(base, "CATALOGO", "produtos.json"),
    path.join(base, "THEMA", "theme.json"),
    path.join(base, "THEMA", "tokens.css"),
    path.join(base, "CONTEXTO", "contexto.json"),
    path.join(base, "COPY", "copy.json"),
    path.join(base, "BLUEPRINT", "mapa_paginas_ecommerce.ia.json"),
    path.join(base, "BLUEPRINT", "blueprint-paginas-ecommerce.md"),
    path.join(base, "BUILDER", "pages.json"),
    path.join(base, "BUILDER", "enabledBlocks.json"),
    path.join(base, "BUILDER", "presets.json"),
  ];

  for (const f of requiredFiles) {
    assert(await exists(f), `[${tenant}] arquivo ausente: ${f}`);
  }

  const context = await readJson(path.join(base, "CONTEXTO", "contexto.json"));
  assert(context.tenantId === tenant, `[${tenant}] CONTEXTO.tenantId inválido`);
  assert(typeof context.segment === "string", `[${tenant}] CONTEXTO.segment inválido`);

  const copy = await readJson(path.join(base, "COPY", "copy.json"));
  assert(copy.tenantId === tenant, `[${tenant}] COPY.tenantId inválido`);
  assert(copy.pages?.home && copy.pages?.cart, `[${tenant}] COPY.pages incompleto`);
  assert(copy.components?.search && copy.components?.cepMock, `[${tenant}] COPY.components incompleto`);

  const blueprintIa = await readJson(path.join(base, "BLUEPRINT", "mapa_paginas_ecommerce.ia.json"));
  assert(Array.isArray(blueprintIa.sheets), `[${tenant}] BLUEPRINT IA-first inválido`);

  const blueprintMd = await readText(path.join(base, "BLUEPRINT", "blueprint-paginas-ecommerce.md"));
  const requiredRoutes = ["/categoria/[slug]", "/produto/[slug]", "/carrinho"];
  for (const r of requiredRoutes) {
    assert(blueprintMd.includes(r), `[${tenant}] blueprint md não contém rota ${r}`);
  }

  const builderPages = await readJson(path.join(base, "BUILDER", "pages.json"));
  assert(builderPages.tenantId === tenant, `[${tenant}] BUILDER.pages.tenantId inválido`);
  const urlPaths = (builderPages.pages ?? []).map((p) => p?.urlPath).filter(Boolean);
  for (const p of ["/", "/categoria/[slug]", "/produto/[slug]", "/carrinho"]) {
    assert(urlPaths.includes(p), `[${tenant}] BUILDER.pages não contém ${p}`);
  }

  const blocks = await readJson(path.join(base, "BUILDER", "enabledBlocks.json"));
  assert(blocks.tenantId === tenant, `[${tenant}] BUILDER.enabledBlocks.tenantId inválido`);
  assert(Array.isArray(blocks.blocks) && blocks.blocks.length > 0, `[${tenant}] BUILDER.blocks vazio`);

  const presets = await readJson(path.join(base, "BUILDER", "presets.json"));
  assert(presets.tenantId === tenant, `[${tenant}] BUILDER.presets.tenantId inválido`);
  assert(presets.presets && typeof presets.presets === "object", `[${tenant}] BUILDER.presets inválido`);

  return { tenant, segment: context.segment };
}

async function main() {
  const tenants = await listTenants(CWD);
  const results = [];
  for (const tenant of tenants) results.push(await verifyTenant(tenant));
  process.stdout.write(JSON.stringify({ ok: true, results }, null, 2) + "\n");
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + "\n");
  process.exit(1);
});
