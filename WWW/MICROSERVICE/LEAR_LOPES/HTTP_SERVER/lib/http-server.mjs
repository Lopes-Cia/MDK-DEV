import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

function safeString(value) {
  return String(value ?? "").trim();
}

function redactHeaders(headers) {
  const out = { ...(headers ?? {}) };
  if (out.Authorization) out.Authorization = "<redacted>";
  if (out.authorization) out.authorization = "<redacted>";
  return out;
}

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeForPath(value) {
  return safeString(value)
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .replace(/\*/g, "STAR")
    .replace(/[:]/g, "_")
    .replace(/[^a-zA-Z0-9/_-]/g, "-")
    .replace(/\//g, "__");
}

function json(res, status, data, extraHeaders = {}) {
  const body = `${JSON.stringify(data, null, 2)}\n`;
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    ...extraHeaders,
  });
  res.end(body);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

async function readRequestJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return null;
  return JSON.parse(raw);
}

function buildUrl(baseUrl, p, query) {
  const base = safeString(baseUrl).replace(/\/+$/, "");
  const pathname = safeString(p).startsWith("/") ? safeString(p) : `/${safeString(p)}`;
  const u = new URL(`${base}${pathname}`);
  if (typeof query === "string") {
    const qs = query.startsWith("?") ? query.slice(1) : query;
    if (qs) u.search = qs;
  } else if (query && typeof query === "object") {
    for (const [k, v] of Object.entries(query)) {
      if (v == null) continue;
      u.searchParams.set(k, String(v));
    }
  }
  return u.toString();
}

async function fetchAny(url, { method, headers, body } = {}) {
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
    const contentType = safeString(res.headers.get("content-type"));
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
      contentType,
      data,
    };
  } finally {
    clearTimeout(t);
  }
}

export async function runRequestAndPersist({
  envDir,
  env,
  tokenManager,
  base,
  method,
  path: p,
  query,
  headers,
  body,
} = {}) {
  const baseKey = safeString(base) || "integration";
  const upstreamBase =
    baseKey === "auth" ? safeString(env?.AUTH_BASE_URL) : safeString(env?.INTEGRATION_URL_API);

  if (!upstreamBase) {
    throw new Error(baseKey === "auth" ? "AUTH_BASE_URL nao encontrado no .env" : "INTEGRATION_URL_API nao encontrado no .env");
  }

  const m = safeString(method).toUpperCase() || "GET";
  const url = buildUrl(upstreamBase, p, query);

  const hdrs = { ...(headers ?? {}) };
  if (!hdrs.Accept) hdrs.Accept = "application/json";

  if (!hdrs.Authorization) {
    const tokenFile = await tokenManager.ensureValidToken();
    const token = safeString(tokenFile?.hashToken);
    if (token) hdrs.Authorization = token;
  }

  let fetchBody = undefined;
  if (body != null && m !== "GET" && m !== "HEAD") {
    if (typeof body === "string") {
      fetchBody = body;
    } else {
      fetchBody = JSON.stringify(body);
      if (!hdrs["Content-Type"]) hdrs["Content-Type"] = "application/json";
    }
  }

  const result = await fetchAny(url, { method: m, headers: hdrs, body: fetchBody });

  const id = nowId();
  const dataDir = path.join(envDir, "data", `${normalizeForPath(m)}__${normalizeForPath(p) || "root"}__${id}`);
  await fs.mkdir(dataDir, { recursive: true });

  const requestSnapshot = {
    at: new Date().toISOString(),
    id,
    base: baseKey,
    endpoint: { baseUrl: upstreamBase, path: p, query },
    request: {
      method: m,
      url,
      headers: redactHeaders(hdrs),
      body: body ?? null,
    },
  };

  const resultSnapshot = {
    at: new Date().toISOString(),
    id,
    request: { method: m, url },
    response: {
      ok: result.ok,
      status: result.status,
      statusText: result.statusText,
      durationMs: result.durationMs,
      contentType: result.contentType,
    },
    data: result.data,
  };

  const requestJson = path.join(dataDir, "request.json");
  const resultJson = path.join(dataDir, "result.json");
  await fs.writeFile(requestJson, `${JSON.stringify(requestSnapshot, null, 2)}\n`, "utf8");
  await fs.writeFile(resultJson, `${JSON.stringify(resultSnapshot, null, 2)}\n`, "utf8");

  return {
    id,
    ok: result.ok,
    status: result.status,
    statusText: result.statusText,
    files: { requestJson, resultJson },
    result: resultSnapshot,
  };
}

export class HttpServer {
  constructor({ envDir, env, tokenManager, port, label }) {
    this.envDir = envDir;
    this.env = env;
    this.tokenManager = tokenManager;
    this.port = port;
    this.label = label || "server";
    this.server = null;
  }

  async start() {
    if (this.server) return;
    const cors = corsHeaders();

    this.server = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
      const pathname = url.pathname;

      if (req.method === "OPTIONS") {
        res.writeHead(204, cors);
        res.end();
        return;
      }

      try {
        if (req.method === "GET" && pathname === "/health") {
          json(res, 200, { ok: true, label: this.label }, cors);
          return;
        }

        if (req.method === "GET" && pathname === "/token") {
          const tokenFile = await this.tokenManager.readTokenFile();
          json(res, 200, { ok: true, token: tokenFile ?? null }, cors);
          return;
        }

        if (req.method === "POST" && pathname === "/token/generate") {
          const tokenFile = await this.tokenManager.generate();
          json(res, 200, { ok: true, token: tokenFile }, cors);
          return;
        }

        if (req.method === "POST" && pathname === "/token/refresh") {
          const body = (await readRequestJson(req)) ?? {};
          const tokenFile = await this.tokenManager.refresh({ refreshToken: body?.refreshToken });
          json(res, 200, { ok: true, token: tokenFile }, cors);
          return;
        }

        if (req.method === "POST" && pathname === "/request") {
          const body = (await readRequestJson(req)) ?? {};
          const out = await runRequestAndPersist({
            envDir: this.envDir,
            env: this.env,
            tokenManager: this.tokenManager,
            base: body?.base,
            method: body?.method,
            path: body?.path,
            query: body?.query,
            headers: body?.headers,
            body: body?.body,
          });
          json(res, 200, { ok: true, ...out }, cors);
          return;
        }

        if (req.method === "GET" && pathname === "/captures") {
          const dir = path.join(this.envDir, "data");
          let entries = [];
          try {
            entries = await fs.readdir(dir, { withFileTypes: true });
          } catch {
            entries = [];
          }
          const items = entries
            .filter((e) => e.isDirectory())
            .map((e) => ({ id: e.name }))
            .slice(0, 200);
          json(res, 200, { ok: true, items }, cors);
          return;
        }

        json(res, 404, { ok: false, error: "not_found", path: pathname }, cors);
      } catch (err) {
        json(res, 500, { ok: false, error: "internal_error", message: safeString(err?.message ?? err) }, cors);
      }
    });

    await new Promise((resolve) => this.server.listen(this.port, resolve));
  }

  async stop() {
    if (!this.server) return;
    await new Promise((resolve) => this.server.close(resolve));
    this.server = null;
  }
}

