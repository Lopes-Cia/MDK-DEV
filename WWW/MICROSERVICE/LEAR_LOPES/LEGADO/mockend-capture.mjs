import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function safeString(value) {
  return String(value ?? "").trim();
}

function toUpperSafe(value) {
  return safeString(value).toUpperCase();
}

function hasCliFlag(flagName) {
  return process.argv.includes(flagName);
}

function getCliArgValue(flagName) {
  const prefix = `${flagName}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  if (!arg) return "";
  return arg.slice(prefix.length).trim();
}

async function readJsonFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalizeForId(value) {
  return safeString(value)
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .replace(/\*/g, "STAR")
    .replace(/[:]/g, "_")
    .replace(/[^a-zA-Z0-9/_-]/g, "-")
    .replace(/\//g, "__");
}

function buildUrl(baseUrl, uri) {
  const base = safeString(baseUrl).replace(/\/+$/, "");
  const u = safeString(uri).startsWith("/") ? safeString(uri) : `/${safeString(uri)}`;
  return `${base}${u}`;
}

function fillUri(uri, samples) {
  let out = safeString(uri);
  for (const [k, v] of Object.entries(samples.pathParams ?? {})) {
    out = out.replaceAll(`:${k}`, encodeURIComponent(String(v)));
  }
  if (out.endsWith("*")) {
    const prefix = out.slice(0, -1);
    const star = safeString(samples.star ?? "").replace(/^\/+/, "");
    out = `${prefix}${star}`;
  }
  return out;
}

async function fetchJson(url, { method, headers, body } = {}) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutMs = 30000;
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      durationMs: Date.now() - startedAt,
      data,
    };
  } finally {
    clearTimeout(t);
  }
}

function redactHeaders(headers) {
  const out = { ...(headers ?? {}) };
  if (out.Authorization) out.Authorization = "<redacted>";
  if (out.authorization) out.authorization = "<redacted>";
  return out;
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const baseConnect = getCliArgValue("--base") || "http://localhost:4000/connect";
  const dataDir = path.join(__dirname, "data");
  const tokenFilePath = path.join(__dirname, "token-acesso.json");

  const tokenFile = await readJsonFile(tokenFilePath);
  const token = safeString(tokenFile?.hashToken);

  const getOnly = !hasCliFlag("--write");
  const samples = {
    pathParams: {
      clienteId: 999,
      enderecoId: 1,
      itemId: 1,
      checkoutId: 1,
      pedidoId: 1,
    },
    star: "1",
    starByHandler: {
      categoriaById: "10",
      categoriaBySlug: "bebidas",
      produtosByCategoria: "10",
      produtoById: "1001",
      produtoBySlug: "heineken-lata-269ml",
      brandById: "871013969",
    },
    searchByHandler: {
      listPedidos: "?clienteId=999&page=1&pageSize=20",
    },
    bodyByHandler: {
      login: { email: "cliente@teste.com", senha: "123456" },
      cadastro: { email: "cliente@teste.com", senha: "123456", nome: "Cliente Teste" },
      updateMeusDados: { clienteId: 999 },
      updatePrivacidade: { clienteId: 999, aceitaMarketing: false },
      createEndereco: { clienteId: 999 },
      updateEndereco: { clienteId: 999 },
      deleteEndereco: { clienteId: 999 },
      addCarrinhoItem: { clienteId: 999, produtoId: 1, quantidade: 1 },
      updateCarrinhoItem: { clienteId: 999, quantidade: 1 },
      deleteCarrinhoItem: { clienteId: 999 },
      applyCupom: { clienteId: 999, cupom: "TESTE" },
      removeCupom: { clienteId: 999 },
      createCheckoutSessao: { clienteId: 999 },
      updateCheckoutContato: { checkoutId: 1, email: "cliente@teste.com", whatsapp: "00000000000" },
      updateCheckoutEndereco: { checkoutId: 1, enderecoId: 1 },
      setFrete: { checkoutId: 1, opcaoId: 1 },
      createPix: { checkoutId: 1 },
      confirmPix: { checkoutId: 1 },
      finalizarCheckout: { checkoutId: 1 },
    },
  };

  const mockEndRoot = path.resolve(__dirname, "../MOCK-END");
  const connectRoutesPath = path.join(mockEndRoot, "PROJETOS", "connect", "routes.mjs");
  const mod = await import(pathToFileURL(connectRoutesPath).href);
  const routes = Array.isArray(mod?.routes) ? mod.routes : [];

  const summary = {
    generatedAt: new Date().toISOString(),
    base: baseConnect,
    getOnly,
    totalRoutes: routes.length,
    executed: 0,
    skipped: 0,
    ok: 0,
    failed: 0,
    items: [],
  };

  for (const r of routes) {
    const method = toUpperSafe(r?.method);
    const uriTpl = safeString(r?.uri);
    const authMode = safeString(r?.auth?.mode);
    const handlerFn = safeString(r?.handler_function);
    const mode = safeString(r?.execution?.mode);

    if (!method || !uriTpl) {
      summary.skipped += 1;
      continue;
    }

    if (getOnly && method !== "GET" && method !== "HEAD") {
      summary.skipped += 1;
      summary.items.push({ method, uri: uriTpl, skipped: true, reason: "write_disabled" });
      continue;
    }

    if (getOnly && (handlerFn === "getCheckoutSessao" || handlerFn === "listFreteOpcoes")) {
      summary.skipped += 1;
      summary.items.push({ method, uri: uriTpl, skipped: true, reason: "requires_checkout" });
      continue;
    }

    const effectiveSamples = {
      ...samples,
      star: samples.starByHandler[handlerFn] ?? samples.star,
    };
    const filledUri = fillUri(uriTpl, effectiveSamples);
    const search = samples.searchByHandler[handlerFn] ?? "";
    const url = `${buildUrl(baseConnect, filledUri)}${search}`;

    const headers = {
      Accept: "application/json",
    };
    const needsAuth = authMode === "required";
    if (needsAuth && token) headers.Authorization = token;

    let body = undefined;
    if (method !== "GET" && method !== "HEAD") {
      const payload = samples.bodyByHandler[handlerFn] ?? {};
      body = JSON.stringify(payload);
      headers["Content-Type"] = "application/json";
    }

    const result = await fetchJson(url, { method, headers, body });
    summary.executed += 1;
    if (result.ok) summary.ok += 1;
    else summary.failed += 1;

    const stepId = `${normalizeForId(method)}__${normalizeForId(filledUri)}`;
    const requestPath = path.join(dataDir, stepId, "request.json");
    const resultPath = path.join(dataDir, stepId, "result.json");

    const requestSnapshot = {
      at: new Date().toISOString(),
      stepId,
      endpoint: { baseUrl: baseConnect, path: filledUri },
      request: {
        method,
        url,
        headers: redactHeaders(headers),
        authRequired: needsAuth,
        body: method !== "GET" && method !== "HEAD" ? samples.bodyByHandler[handlerFn] ?? {} : null,
      },
      route: {
        uriTemplate: uriTpl,
        executionMode: mode,
        authMode,
        handler_function: handlerFn,
        handler_class: safeString(r?.handler_class),
      },
    };

    const resultSnapshot = {
      at: new Date().toISOString(),
      stepId,
      request: { method, url },
      response: {
        ok: result.ok,
        status: result.status,
        statusText: result.statusText,
        durationMs: result.durationMs,
      },
      data: result.data,
    };

    await writeJsonFile(requestPath, requestSnapshot);
    await writeJsonFile(resultPath, resultSnapshot);

    summary.items.push({
      stepId,
      method,
      uri: filledUri,
      ok: result.ok,
      status: result.status,
      requestJson: requestPath,
      resultJson: resultPath,
    });
  }

  const summaryPath = path.join(__dirname, "DOCS", "mock-end-deep", "CAPTURE_SUMMARY.json");
  await writeJsonFile(summaryPath, summary);

  process.stdout.write(`OK: ${summaryPath}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err?.message ?? err}\n`);
  process.exitCode = 1;
});
