import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function safeString(value) {
  return String(value ?? "").trim();
}

function toLowerSafe(value) {
  return safeString(value).toLowerCase();
}

function toUpperSafe(value) {
  return safeString(value).toUpperCase();
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function opMethodsForPathItem(pathItem) {
  const allowed = new Set(["get", "post", "put", "delete", "patch", "options", "head"]);
  return Object.keys(pathItem ?? {}).filter((k) => allowed.has(toLowerSafe(k)));
}

function buildKey(method, uri) {
  return `${toUpperSafe(method)} ${safeString(uri)}`;
}

function toMockUri(openapiPath) {
  const p = safeString(openapiPath);
  if (!p.startsWith("/")) return `/Servidor/${p}`;
  return `/Servidor${p}`;
}

function extractRequiredQueryParams(op) {
  const params = Array.isArray(op?.parameters) ? op.parameters : [];
  const required = params
    .filter((p) => toLowerSafe(p?.in) === "query" && Boolean(p?.required))
    .map((p) => safeString(p?.name))
    .filter(Boolean);
  return uniq(required).sort();
}

function requiresAuthorization(spec, op) {
  const opSec = Array.isArray(op?.security) ? op.security : null;
  const sec = opSec ?? (Array.isArray(spec?.security) ? spec.security : []);
  const has = sec.some((item) => item && typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "Authorization"));
  return Boolean(has);
}

function normalizeMockRoutes(routes) {
  const out = [];
  for (const r of Array.isArray(routes) ? routes : []) {
    const method = toUpperSafe(r?.method);
    const uri = safeString(r?.uri);
    if (!method || !uri) continue;
    const executionMode = safeString(r?.execution?.mode);
    out.push({
      method,
      uri,
      key: buildKey(method, uri),
      executionMode,
      handler_class: safeString(r?.handler_class),
      handler_function: safeString(r?.handler_function),
    });
  }
  return out;
}

function normalizeBackEndpointsByTags(spec, tagsFilter) {
  const tagsSet = new Set((Array.isArray(tagsFilter) ? tagsFilter : []).map(safeString).filter(Boolean));
  const paths = spec?.paths ?? {};
  const endpoints = [];

  for (const p of Object.keys(paths)) {
    const pathItem = paths[p];
    const methods = opMethodsForPathItem(pathItem);
    for (const m of methods) {
      const op = pathItem[m];
      const opTags = Array.isArray(op?.tags) ? op.tags.map(safeString).filter(Boolean) : [];
      const include = opTags.some((t) => tagsSet.has(t));
      if (!include) continue;
      const method = toUpperSafe(m);
      const openapiPath = safeString(p);
      const mockUri = toMockUri(openapiPath);
      endpoints.push({
        method,
        path: openapiPath,
        mockUri,
        key: buildKey(method, mockUri),
        operationId: safeString(op?.operationId),
        tags: opTags,
        requiredQueryParams: extractRequiredQueryParams(op),
        requiresAuthorization: requiresAuthorization(spec, op),
      });
    }
  }

  return endpoints.sort((a, b) => a.key.localeCompare(b.key));
}

function normalizeBackKeysAll(spec) {
  const paths = spec?.paths ?? {};
  const keys = new Set();
  for (const p of Object.keys(paths)) {
    const pathItem = paths[p];
    const methods = opMethodsForPathItem(pathItem);
    for (const m of methods) {
      const method = toUpperSafe(m);
      const openapiPath = safeString(p);
      const mockUri = toMockUri(openapiPath);
      keys.add(buildKey(method, mockUri));
    }
  }
  return keys;
}

function groupByTag(items, tagsFilter) {
  const tags = (Array.isArray(tagsFilter) ? tagsFilter : []).map(safeString).filter(Boolean);
  const out = {};
  for (const t of tags) out[t] = [];
  for (const item of items) {
    const itemTags = Array.isArray(item?.tags) ? item.tags : [];
    for (const t of tags) {
      if (itemTags.includes(t)) out[t].push(item);
    }
  }
  return out;
}

function classify(backEndpoints, mockRoutesByKey) {
  const mocked = [];
  const original = [];
  const proxied = [];
  const unknown = [];

  for (const e of backEndpoints) {
    const r = mockRoutesByKey.get(e.key) ?? null;
    if (!r) {
      proxied.push(e);
      continue;
    }

    const mode = safeString(r.executionMode);
    if (mode === "mock" || mode === "hybrid") mocked.push({ ...e, mockRoute: r });
    else if (mode === "original") original.push({ ...e, mockRoute: r });
    else unknown.push({ ...e, mockRoute: r });
  }

  return { mocked, original, proxied, unknown };
}

function buildMarkdown({ meta, byTag, mockOnly }) {
  const lines = [];
  lines.push(`# Contrato BACK ↔ MOCK — 9004 (MVP)`);
  lines.push(``);
  lines.push(`## Meta`);
  lines.push(`- GeneratedAt: ${meta.generatedAt}`);
  lines.push(`- Tags: ${meta.tags.join(", ")}`);
  lines.push(`- OpenAPI: ${meta.openapiPath}`);
  lines.push(`- Mock routes: ${meta.mockRoutesPath}`);
  lines.push(``);

  lines.push(`## Resumo por tag`);
  for (const [tag, bucket] of Object.entries(byTag)) {
    lines.push(``);
    lines.push(`### ${tag}`);
    lines.push(`- Total (BACK): ${bucket.total}`);
    lines.push(`- Mocked (rota declarada): ${bucket.mocked}`);
    lines.push(`- Proxied (gap de mock): ${bucket.proxied}`);
    lines.push(`- Original: ${bucket.original}`);
    lines.push(`- Unknown: ${bucket.unknown}`);
  }

  lines.push(``);
  lines.push(`## Gaps (proxied) — amostra`);
  lines.push(``);
  for (const [tag, bucket] of Object.entries(byTag)) {
    const sample = bucket.items.proxied.slice(0, 20);
    lines.push(`### ${tag}`);
    if (!sample.length) {
      lines.push(`- (sem gaps para esta tag)`);
      lines.push(``);
      continue;
    }
    for (const e of sample) {
      const q = e.requiredQueryParams?.length ? ` reqQuery=[${e.requiredQueryParams.join(",")}]` : "";
      const opId = e.operationId ? ` opId=${e.operationId}` : "";
      lines.push(`- ${e.method} ${e.path}${opId}${q}`);
    }
    lines.push(``);
  }

  lines.push(`## Rotas no MOCK que não existem no OpenAPI 9004 (mock-only) — amostra`);
  lines.push(`- Total: ${mockOnly.length}`);
  lines.push(``);
  for (const r of mockOnly.slice(0, 50)) {
    const mode = r.executionMode ? ` mode=${r.executionMode}` : "";
    lines.push(`- ${r.method} ${r.uri}${mode}`);
  }
  lines.push(``);

  return `${lines.join("\n")}\n`;
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const configPath = path.join(__dirname, "contract-9004.config.json");

  const configRaw = await fs.readFile(configPath, "utf8");
  const config = JSON.parse(configRaw);

  const openapiPath = path.resolve(__dirname, safeString(config?.openapiPath));
  const mockRoutesPath = path.resolve(__dirname, safeString(config?.mockRoutesPath));
  const outputDir = path.resolve(__dirname, safeString(config?.outputDir));
  const tags = Array.isArray(config?.tags) ? config.tags.map(safeString).filter(Boolean) : [];

  const specRaw = await fs.readFile(openapiPath, "utf8");
  const spec = JSON.parse(specRaw);

  const mod = await import(pathToFileURL(mockRoutesPath).href);
  const routes = Array.isArray(mod?.routes) ? mod.routes : [];

  const mockRoutes = normalizeMockRoutes(routes);
  const mockRoutesByKey = new Map(mockRoutes.map((r) => [r.key, r]));

  const backEndpoints = normalizeBackEndpointsByTags(spec, tags);
  const backKeysAll = normalizeBackKeysAll(spec);

  const classification = classify(backEndpoints, mockRoutesByKey);

  const mockOnly = mockRoutes.filter((r) => !backKeysAll.has(r.key));

  const backByTag = groupByTag(backEndpoints, tags);
  const mockedByTag = groupByTag(classification.mocked, tags);
  const proxiedByTag = groupByTag(classification.proxied, tags);
  const originalByTag = groupByTag(classification.original, tags);
  const unknownByTag = groupByTag(classification.unknown, tags);

  const byTag = {};
  for (const t of tags) {
    byTag[t] = {
      total: backByTag[t]?.length ?? 0,
      mocked: mockedByTag[t]?.length ?? 0,
      proxied: proxiedByTag[t]?.length ?? 0,
      original: originalByTag[t]?.length ?? 0,
      unknown: unknownByTag[t]?.length ?? 0,
      items: {
        mocked: mockedByTag[t] ?? [],
        proxied: proxiedByTag[t] ?? [],
        original: originalByTag[t] ?? [],
        unknown: unknownByTag[t] ?? [],
      },
    };
  }

  const meta = {
    generatedAt: new Date().toISOString(),
    tags,
    openapiPath,
    mockRoutesPath,
    outputDir,
  };

  const report = {
    meta,
    backEndpoints,
    mockRoutes,
    match: {
      mocked: classification.mocked,
      original: classification.original,
      proxied: classification.proxied,
      unknown: classification.unknown,
      mockOnly,
    },
    byTag,
  };

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(outputDir, "report.md"), buildMarkdown({ meta, byTag, mockOnly }), "utf8");

  process.stdout.write(`OK: ${path.join(outputDir, "report.json")}\n`);
  process.stdout.write(`OK: ${path.join(outputDir, "report.md")}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err?.message ?? err}\n`);
  process.exitCode = 1;
});

