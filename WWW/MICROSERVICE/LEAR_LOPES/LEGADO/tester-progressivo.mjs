import http from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseEnv(raw) {
  const out = {};
  const lines = String(raw ?? "").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function json(res, status, data, extraHeaders = {}) {
  const body = `${JSON.stringify(data)}\n`;
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    ...extraHeaders,
  });
  res.end(body);
}

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function safeString(value) {
  return String(value ?? "").trim();
}

function getCliArgValue(flagName) {
  const prefix = `${flagName}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  if (!arg) return "";
  return arg.slice(prefix.length).trim();
}

function hasCliFlag(flagName) {
  return process.argv.includes(flagName);
}

async function readJsonFile(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeJsonFile(filePath, data) {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(filePath, content, "utf8");
}

function redactHeaders(headers) {
  const out = { ...(headers ?? {}) };
  if (out.Authorization) out.Authorization = "<redacted>";
  if (out.authorization) out.authorization = "<redacted>";
  return out;
}

function buildUrl(baseUrl, pathname, search) {
  const base = baseUrl.replace(/\/+$/, "");
  const pathPart = String(pathname ?? "").startsWith("/") ? pathname : `/${pathname}`;
  const queryPart = search ? String(search).replace(/^\?/, "?") : "";
  return `${base}${pathPart}${queryPart}`;
}

function detectPayloadError(data) {
  if (!data) return false;
  if (Array.isArray(data)) return false;
  if (typeof data !== "object") return false;
  if (data.success === false) return true;
  if (typeof data.error === "string" && data.error.trim()) return true;
  if (typeof data.message === "string" && data.message.trim() && data.success === false) return true;
  if (Array.isArray(data.errors) && data.errors.length > 0) return true;
  return false;
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

async function runStepOnce({
  step,
  tokenFilePath,
  dataRootDir,
  search = "",
} = {}) {
  const tokenFile = await readJsonFile(tokenFilePath);
  const hashToken = safeString(tokenFile?.hashToken);
  if (step.authRequired && !hashToken) {
    return {
      ok: false,
      status: 400,
      statusText: "missing_token",
      durationMs: 0,
      data: {
        error: "missing_token",
        message: "Token nao encontrado. Rode primeiro: node gerar-token-acesso.mjs",
      },
    };
  }

  const stepBaseUrl = safeString(step?.baseUrl);
  if (!stepBaseUrl) {
    return {
      ok: false,
      status: 400,
      statusText: "missing_base_url",
      durationMs: 0,
      data: {
        error: "missing_base_url",
        message: "Base URL nao configurada para este step.",
      },
    };
  }

  const targetUrl = buildUrl(stepBaseUrl, step.path, search);
  const headers = {
    Accept: "application/json",
  };
  if (step.authRequired) {
    const prefix = safeString(step?.authPrefix);
    headers.Authorization = `${prefix}${hashToken}`;
  }

  const result = await fetchJson(targetUrl, { method: step.method, headers });
  const payloadError = detectPayloadError(result.data);

  const nowIso = new Date().toISOString();
  const stepDataDir = path.join(dataRootDir, step.id);
  await mkdir(stepDataDir, { recursive: true });
  const requestFilePath = path.join(stepDataDir, "request.json");
  const resultFilePath = path.join(stepDataDir, "result.json");

  const requestSnapshot = {
    at: nowIso,
    stepId: step.id,
    endpoint: { baseUrl: stepBaseUrl, path: step.path },
    request: {
      method: step.method,
      url: targetUrl,
      headers: redactHeaders(headers),
      authRequired: step.authRequired,
    },
  };

  const resultSnapshot = {
    at: nowIso,
    stepId: step.id,
    request: { method: step.method, url: targetUrl },
    response: {
      ok: result.ok,
      status: result.status,
      statusText: result.statusText,
      durationMs: result.durationMs,
    },
    payloadError,
    data: result.data,
  };

  await writeJsonFile(requestFilePath, requestSnapshot);
  await writeJsonFile(resultFilePath, resultSnapshot);

  return {
    requestFilePath,
    resultFilePath,
    payloadError,
    ...result,
  };
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const envPath = path.join(__dirname, ".env");
  const tokenFilePath = path.join(__dirname, "token-acesso.json");
  const dataRootDir = path.join(__dirname, "data");

  const envRaw = await readFile(envPath, "utf8");
  const env = parseEnv(envRaw);

  const port = Number(env.PORT ?? 3000);
  const connectBaseUrl = safeString(env.CONNECT_BASE_URL) || "http://localhost:4000/connect";
  const integrationApi = safeString(env.INTEGRATION_URL_API) || "https://gp.lopesecia.com.br:9004";
  const lopes9004BaseUrl = safeString(env.LOPES_9004_BASE_URL) || `${integrationApi.replace(/\/+$/, "")}/Servidor`;
  const codCli = safeString(env.CODCLI);
  const idIntegradora = safeString(env.IDINTEGRADORA);

  const steps = [
    {
      id: "categorias",
      method: "GET",
      baseUrl: connectBaseUrl,
      path: "/Servidor/webservice/integration/produtos/categorias",
      authRequired: true,
      authPrefix: "",
      defaultSearch: "",
    },
    {
      id: "lopes_getIntegradora",
      method: "GET",
      baseUrl: lopes9004BaseUrl,
      path: "/webservice/integration/getIntegradora",
      authRequired: true,
      authPrefix: "",
      defaultSearch:
        idIntegradora || codCli
          ? `?${[
              idIntegradora ? `id=${encodeURIComponent(idIntegradora)}` : "",
              codCli ? `codCli=${encodeURIComponent(codCli)}` : "",
            ]
              .filter(Boolean)
              .join("&")}`
          : "",
    },
  ];

  const runArg = getCliArgValue("--run");
  const runStepId = runArg || (hasCliFlag("--run") ? safeString(process.argv[process.argv.indexOf("--run") + 1]) : "");
  if (runStepId) {
    const step = steps.find((s) => s.id === runStepId);
    if (!step) {
      process.stderr.write(`step_not_found: ${runStepId}\n`);
      process.exitCode = 1;
      return;
    }

    const search = getCliArgValue("--search") || safeString(step?.defaultSearch);
    const result = await runStepOnce({
      step,
      tokenFilePath,
      dataRootDir,
      search,
    });

    process.stdout.write(`step: ${step.id}\n`);
    process.stdout.write(`url: ${buildUrl(step.baseUrl, step.path, search)}\n`);
    process.stdout.write(`status: ${result.status} ${result.statusText}\n`);
    if (result.requestFilePath && result.resultFilePath) {
      process.stdout.write(`request.json: ${result.requestFilePath}\n`);
      process.stdout.write(`result.json: ${result.resultFilePath}\n`);
    }

    if (!result.ok || result.payloadError) {
      process.exitCode = 1;
    }
    return;
  }

  const runs = [];

  const server = http.createServer(async (req, res) => {
    const cors = getCorsHeaders();
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const pathname = url.pathname;

    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      res.end();
      return;
    }

    if (req.method === "GET" && pathname === "/health") {
      json(res, 200, { ok: true }, cors);
      return;
    }

    if (req.method === "GET" && pathname === "/steps") {
      json(
        res,
        200,
        {
          baseUrl: connectBaseUrl,
          steps: steps.map((s) => ({
            id: s.id,
            method: s.method,
            baseUrl: s.baseUrl,
            path: s.path,
            authRequired: s.authRequired,
            defaultSearch: s.defaultSearch,
          })),
        },
        cors
      );
      return;
    }

    if (req.method === "GET" && pathname === "/runs") {
      json(res, 200, { runs }, cors);
      return;
    }

    const stepRunMatch = pathname.match(/^\/steps\/([^/]+)\/run$/);
    if (req.method === "POST" && stepRunMatch) {
      const stepId = decodeURIComponent(stepRunMatch[1]);
      const step = steps.find((s) => s.id === stepId);
      if (!step) {
        json(res, 404, { error: "step_not_found", stepId }, cors);
        return;
      }

      const tokenFile = await readJsonFile(tokenFilePath);
      const hashToken = safeString(tokenFile?.hashToken);
      if (step.authRequired && !hashToken) {
        json(
          res,
          400,
          {
            error: "missing_token",
            message:
              "Token nao encontrado. Rode primeiro: node gerar-token-acesso.mjs (ele gera token-acesso.json).",
          },
          cors
        );
        return;
      }

      const stepSearch = safeString(url.search) || safeString(step?.defaultSearch);
      const stepBaseUrl = safeString(step?.baseUrl);
      if (!stepBaseUrl) {
        json(res, 400, { error: "missing_base_url", stepId }, cors);
        return;
      }

      const targetUrl = buildUrl(stepBaseUrl, step.path, stepSearch);
      const headers = {
        Accept: "application/json",
      };
      if (step.authRequired) {
        const prefix = safeString(step?.authPrefix);
        headers.Authorization = `${prefix}${hashToken}`;
      }

      const result = await fetchJson(targetUrl, { method: step.method, headers });
      const payloadError = detectPayloadError(result.data);

      const nowIso = new Date().toISOString();
      const stepDataDir = path.join(dataRootDir, step.id);
      await mkdir(stepDataDir, { recursive: true });
      const requestFilePath = path.join(stepDataDir, "request.json");
      const resultFilePath = path.join(stepDataDir, "result.json");

      const requestSnapshot = {
        at: nowIso,
        stepId: step.id,
        endpoint: { baseUrl: stepBaseUrl, path: step.path },
        request: {
          method: step.method,
          url: targetUrl,
          headers: redactHeaders(headers),
          authRequired: step.authRequired,
        },
      };

      const resultSnapshot = {
        at: nowIso,
        stepId: step.id,
        request: { method: step.method, url: targetUrl },
        response: {
          ok: result.ok,
          status: result.status,
          statusText: result.statusText,
          durationMs: result.durationMs,
        },
        payloadError,
        data: result.data,
      };

      await writeJsonFile(requestFilePath, requestSnapshot);
      await writeJsonFile(resultFilePath, resultSnapshot);

      const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: nowIso,
        stepId: step.id,
        request: { method: step.method, url: targetUrl, auth: step.authRequired ? "required" : "none" },
        response: { ok: result.ok, status: result.status, statusText: result.statusText, durationMs: result.durationMs },
      };
      runs.unshift(entry);
      if (runs.length > 50) runs.length = 50;

      json(
        res,
        200,
        {
          ...entry,
          files: {
            requestJson: requestFilePath,
            resultJson: resultFilePath,
          },
          payloadError,
          data: result.data,
        },
        cors
      );
      return;
    }

    json(res, 404, { error: "not_found", path: pathname }, cors);
  });

  server.listen(port, () => {
    process.stdout.write(`tester-progressivo: http://localhost:${port}\n`);
    process.stdout.write(`base connect: ${connectBaseUrl}\n`);
    process.stdout.write("endpoints: GET /health | GET /steps | POST /steps/:id/run | GET /runs\n");
  });
}

main().catch((err) => {
  process.stderr.write(`${err?.message ?? err}\n`);
  process.exitCode = 1;
});
