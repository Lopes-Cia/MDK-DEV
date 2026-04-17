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

function buildKey(method, uri) {
  return `${toUpperSafe(method)} ${safeString(uri)}`;
}

function normalizeUriForId(uri) {
  return safeString(uri)
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .replace(/[^a-zA-Z0-9/_:-]/g, "-")
    .replace(/\*/g, "STAR")
    .replace(/[:]/g, "_")
    .replace(/\//g, "__");
}

function extractPathParams(uri) {
  const parts = safeString(uri).split("/").filter(Boolean);
  const params = [];
  for (const p of parts) {
    if (p.startsWith(":")) {
      const name = p.slice(1).trim();
      if (name) params.push(name);
    }
  }
  return params;
}

function detectWildcard(uri) {
  return safeString(uri).endsWith("*");
}

async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function extractPrecedingComment(rawLines, uri) {
  const needle = `uri: "${uri}"`;
  let idx = -1;
  for (let i = 0; i < rawLines.length; i++) {
    if (rawLines[i].includes(needle)) {
      idx = i;
      break;
    }
  }
  if (idx < 0) return "";

  const out = [];
  for (let i = idx - 1; i >= 0 && i >= idx - 20; i--) {
    const line = rawLines[i];
    const t = line.trim();
    if (!t) {
      if (out.length) break;
      continue;
    }
    if (!t.startsWith("//")) break;
    out.push(t.replace(/^\/\/\s?/, ""));
  }
  return out.reverse().join("\n").trim();
}

function findSearchParamsKeys(source) {
  const keys = new Set();
  const re = /searchParams\.get\(\s*["']([^"']+)["']\s*\)/g;
  let m;
  while ((m = re.exec(source))) {
    const k = safeString(m[1]);
    if (k) keys.add(k);
  }
  return Array.from(keys).sort();
}

function findBodyKeys(source) {
  const keys = new Set();
  const re = /const\s*\{\s*([^}]+)\s*\}\s*=\s*await\s+readRequestJson\s*\(/g;
  let m;
  while ((m = re.exec(source))) {
    const chunk = safeString(m[1]);
    const parts = chunk
      .split(",")
      .map((p) => safeString(p.split(":")[0]))
      .filter(Boolean);
    for (const p of parts) keys.add(p);
  }
  const usesJsonBody = /readRequestJson\s*\(/.test(source);
  return { usesJsonBody, keys: Array.from(keys).sort() };
}

function findResponseKeys(source) {
  const keys = new Set();
  const re = /json\s*\(\s*res\s*,\s*\d+\s*,\s*\{([\s\S]*?)\}\s*(?:,|\))/m;
  const m = re.exec(source);
  if (!m) return { keys: [], hasJsonResponse: /json\s*\(\s*res\s*,/.test(source) };
  const obj = m[1];
  const keyRe = /(^|[,{]\s*)([a-zA-Z0-9_]+)\s*:/g;
  let km;
  while ((km = keyRe.exec(obj))) {
    const k = safeString(km[2]);
    if (k) keys.add(k);
  }
  return { keys: Array.from(keys).sort(), hasJsonResponse: true };
}

function extractHandlersMap(source) {
  const map = new Map();
  const blockMatch = /export\s+const\s+handlers\s*=\s*\{([\s\S]*?)\}\s*;?/m.exec(source);
  if (!blockMatch) return map;
  const block = blockMatch[1];
  const lines = block.split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    const m1 = /^["']([^"']+)["']\s*:\s*([a-zA-Z0-9_$]+)\s*,?$/.exec(t);
    if (m1) {
      map.set(m1[1], m1[2]);
      continue;
    }
    const m2 = /^([a-zA-Z0-9_$]+)\s*:\s*([a-zA-Z0-9_$]+)\s*,?$/.exec(t);
    if (m2) {
      map.set(m2[1], m2[2]);
      continue;
    }
    const m3 = /^([a-zA-Z0-9_$]+)\s*,?$/.exec(t);
    if (m3) {
      map.set(m3[1], m3[1]);
    }
  }
  return map;
}

function extractFunctionSnippet(source, fnName) {
  if (!fnName) return "";
  const idx = source.indexOf(`function ${fnName}`);
  if (idx >= 0) return source.slice(idx, Math.min(source.length, idx + 1600));
  const idx2 = source.indexOf(`async function ${fnName}`);
  if (idx2 >= 0) return source.slice(idx2, Math.min(source.length, idx2 + 1600));
  const idx3 = source.indexOf(`const ${fnName} =`);
  if (idx3 >= 0) return source.slice(idx3, Math.min(source.length, idx3 + 1600));
  return "";
}

async function loadRoutesModule(filePath) {
  const mod = await import(pathToFileURL(filePath).href);
  return Array.isArray(mod?.routes) ? mod.routes : [];
}

async function loadExamplesFromDataDir(dataDir) {
  const out = [];
  let entries = [];
  try {
    entries = await fs.readdir(dataDir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const stepId = ent.name;
    const requestPath = path.join(dataDir, stepId, "request.json");
    const resultPath = path.join(dataDir, stepId, "result.json");
    if (!(await fileExists(requestPath)) || !(await fileExists(resultPath))) continue;

    let reqObj;
    let resObj;
    try {
      reqObj = JSON.parse(await readText(requestPath));
      resObj = JSON.parse(await readText(resultPath));
    } catch {
      continue;
    }

    const baseUrl = safeString(reqObj?.endpoint?.baseUrl);
    const endpointPath = safeString(reqObj?.endpoint?.path);
    const method = toUpperSafe(reqObj?.request?.method);
    const url = safeString(reqObj?.request?.url);

    const ok = Boolean(resObj?.response?.ok);
    const status = Number(resObj?.response?.status ?? 0) || null;
    out.push({
      stepId,
      baseUrl,
      endpointPath,
      method,
      url,
      requestPath,
      resultPath,
      at: safeString(reqObj?.at) || safeString(resObj?.at),
      ok,
      status,
    });
  }

  return out;
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const mockEndRoot = path.resolve(__dirname, "../MOCK-END");
  const connectRoutesPath = path.join(mockEndRoot, "PROJETOS", "connect", "routes.mjs");
  const authRoutesPath = path.join(mockEndRoot, "PROJETOS", "ApiLopes", "webservice", "api", "routes.mjs");
  const outDir = path.join(__dirname, "DOCS", "mock-end-deep");

  const connectRoutesRaw = await readText(connectRoutesPath);
  const connectRoutesLines = connectRoutesRaw.split(/\r?\n/);
  const authRoutesRaw = await readText(authRoutesPath);
  const authRoutesLines = authRoutesRaw.split(/\r?\n/);

  const connectRoutes = await loadRoutesModule(connectRoutesPath);
  const authRoutes = await loadRoutesModule(authRoutesPath);
  const examples = await loadExamplesFromDataDir(path.join(__dirname, "data"));

  const endpoints = [];

  endpoints.push({
    id: "health",
    group: "core",
    method: "GET",
    uri: "/health",
    summary: "Healthcheck do MOCK-END",
    request: { headers: [], query: [], body: null },
    response: { contentType: "application/json", exampleFrom: "hardcoded", example: { ok: true } },
  });

  endpoints.push({
    id: "public_assets_images",
    group: "core",
    method: "GET|HEAD",
    uri: "/assets/images/*",
    summary: "Assets publicos de imagens (mock connect)",
    request: { headers: [], query: [], body: null },
    response: { contentType: "image/*", exampleFrom: "filesystem", example: null },
  });

  endpoints.push({
    id: "storage_images",
    group: "core",
    method: "GET|HEAD|PUT|POST",
    uri: "/api/storage/:tenant/images/<rest...>",
    summary: "Storage seguro de imagens por tenant (originals/derived/manifests)",
    request: { headers: [], query: [], body: "binary or json (manifest)" },
    response: {
      contentType: "application/json (writes) / image|json (reads)",
      exampleFrom: "code",
      example: { ok: true, path: "manifests/<sha>.json", bytes: 123 },
    },
  });

  function pushProjectRoute(project, route, rawLines) {
    const method = toUpperSafe(route?.method);
    const uri = safeString(route?.uri);
    const executionMode = safeString(route?.execution?.mode);
    const handlerClassBase = safeString(route?.handler_class);
    const handlerFunctionKey = safeString(route?.handler_function);
    const summary = extractPrecedingComment(rawLines, uri);

    const pathParams = extractPathParams(uri);
    const wildcard = detectWildcard(uri);

    endpoints.push({
      id: `${project}__${normalizeUriForId(method)}__${normalizeUriForId(uri)}`,
      group: project,
      method,
      uri,
      key: buildKey(method, uri),
      executionMode,
      authMode: safeString(route?.auth?.mode),
      authLabel: safeString(route?.auth?.label),
      handler: { handler_class: handlerClassBase, handler_function: handlerFunctionKey },
      summary,
      pathParams,
      wildcard,
      analysis: {},
    });
  }

  for (const r of connectRoutes) pushProjectRoute("connect", r, connectRoutesLines);
  for (const r of authRoutes) pushProjectRoute("auth", r, authRoutesLines);

  for (const e of endpoints) {
    if (!e.handler?.handler_class || !e.handler?.handler_function) continue;

    let handlerClassToUse = e.handler.handler_class;
    const mode = safeString(e.executionMode);

    if (e.group === "connect") {
      if (mode === "mock" || mode === "hybrid") handlerClassToUse = `mock/${handlerClassToUse}`;
    }

    const handlerFilePath =
      e.group === "connect"
        ? path.join(mockEndRoot, "PROJETOS", "connect", "handlers", ...handlerClassToUse.split("/")) + ".mjs"
        : path.join(mockEndRoot, "PROJETOS", "ApiLopes", "webservice", "api", "handlers", ...handlerClassToUse.split("/")) + ".mjs";

    e.analysis.handlerFile = handlerFilePath;
    e.analysis.handlerExists = await fileExists(handlerFilePath);
    if (!e.analysis.handlerExists) continue;

    const handlerSource = await readText(handlerFilePath);
    const handlersMap = extractHandlersMap(handlerSource);
    const fnName = handlersMap.get(e.handler.handler_function) ?? "";
    e.analysis.resolvedFunction = fnName;

    const snippet = extractFunctionSnippet(handlerSource, fnName) || handlerSource;
    e.analysis.queryKeys = findSearchParamsKeys(snippet);
    e.analysis.body = findBodyKeys(snippet);
    e.analysis.response = findResponseKeys(snippet);
  }

  const examplesByKey = new Map();
  for (const ex of examples) {
    if (!ex.method || !ex.endpointPath) continue;
    const k = buildKey(ex.method, ex.endpointPath);
    examplesByKey.set(k, ex);
  }
  for (const e of endpoints) {
    const ex = examplesByKey.get(buildKey(e.method, e.uri)) ?? null;
    if (ex) {
      e.example = {
        stepId: ex.stepId,
        at: ex.at,
        requestJson: ex.requestPath,
        resultJson: ex.resultPath,
        url: ex.url,
      };
    }
  }

  await fs.mkdir(outDir, { recursive: true });

  const indexLines = [];
  indexLines.push(`# MOCK-END — Deep dive (endpoints)`);
  indexLines.push(``);
  indexLines.push(`## Grupos cobertos`);
  indexLines.push(`- core: /health, /assets/images/*, /api/storage/...`);
  indexLines.push(`- connect: rotas declarativas em PROJETOS/connect/routes.mjs (mock/hybrid/original)`);
  indexLines.push(`- auth: rotas declarativas em PROJETOS/ApiLopes/webservice/api/routes.mjs (proxy AUTH)`);
  indexLines.push(``);
  indexLines.push(`## Observacoes importantes`);
  indexLines.push(`- /connect/*: se a rota nao existir em PROJETOS/connect/routes.mjs, o MOCK-END faz proxy cego para INTEGRATION_URL_API.`);
  indexLines.push(`- /ApiLopes/webservice/api/*: segue routes.mjs da base AUTH e encaminha para AUTH_BASE_URL via handlers.`);
  indexLines.push(``);
  indexLines.push(`## Arquivos gerados`);
  indexLines.push(`- endpoints.json: catalogo IA-friendly de endpoints, com hints de query/body/response quando detectavel.`);
  indexLines.push(`- ENDPOINTS.md: leitura humana (tabela) com resumo e ponteiro para handler.`);
  indexLines.push(``);

  await fs.writeFile(path.join(outDir, "README.md"), `${indexLines.join("\n")}\n`, "utf8");
  await fs.writeFile(path.join(outDir, "endpoints.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), endpoints }, null, 2)}\n`, "utf8");

  const md = [];
  md.push(`# Endpoints do MOCK-END (deep dive)`);
  md.push(``);
  md.push(`Gerado em: ${new Date().toISOString()}`);
  md.push(``);
  md.push(`| Grupo | Metodo | URI | Mode | Auth | Handler | Request (hints) | Response (hints) |`);
  md.push(`|---|---|---|---|---|---|---|---|`);

  for (const e of endpoints) {
    const mode = safeString(e.executionMode);
    const auth = safeString(e.authMode);
    const handler = e.analysis?.handlerFile ? path.relative(__dirname, e.analysis.handlerFile).replace(/\\/g, "/") : "";
    const q = Array.isArray(e.analysis?.queryKeys) && e.analysis.queryKeys.length ? `q:${e.analysis.queryKeys.join(",")}` : "";
    const b = e.analysis?.body?.usesJsonBody ? `body:${(e.analysis.body.keys || []).join(",") || "*"}` : "";
    const reqHints = [q, b].filter(Boolean).join(" ");
    const respHints = e.analysis?.response?.hasJsonResponse ? `json:${(e.analysis.response.keys || []).join(",") || "*"}` : "";
    md.push(
      `| ${e.group} | ${e.method} | ${e.uri} | ${mode} | ${auth} | ${handler} | ${reqHints} | ${respHints} |`
    );
  }

  await fs.writeFile(path.join(outDir, "ENDPOINTS.md"), `${md.join("\n")}\n`, "utf8");

  const exMd = [];
  exMd.push(`# Exemplos capturados (request/result)`);
  exMd.push(``);
  exMd.push(`Esses exemplos sao capturados via tester-progressivo e salvos em LEAR_LOPES/data/<stepId>/.`);
  exMd.push(``);
  const exForMock = examples
    .filter((e) => toLowerSafe(e.baseUrl).includes("localhost:4000") && e.ok)
    .sort((a, b) => `${a.method} ${a.endpointPath}`.localeCompare(`${b.method} ${b.endpointPath}`));
  if (!exForMock.length) {
    exMd.push(`- (nenhum exemplo local encontrado para localhost:4000)`);
  } else {
    for (const ex of exForMock) {
      exMd.push(`- ${ex.method} ${ex.endpointPath}`);
      exMd.push(`  - request: ${ex.requestPath}`);
      exMd.push(`  - result: ${ex.resultPath}`);
    }
  }
  exMd.push(``);
  await fs.writeFile(path.join(outDir, "EXAMPLES.md"), `${exMd.join("\n")}\n`, "utf8");

  process.stdout.write(`OK: ${outDir}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err?.message ?? err}\n`);
  process.exitCode = 1;
});
