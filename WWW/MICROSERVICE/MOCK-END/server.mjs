import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;

async function loadDotEnv(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = String(line ?? "").trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (!key) continue;
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] == null) process.env[key] = value;
    }
  } catch (err) {
    if (err?.code !== "ENOENT") {
      process.stderr.write(
        `[mock-end] Falha ao ler .env: ${String(err?.message ?? err)}\n`
      );
    }
  }
}

await loadDotEnv(path.join(ROOT, ".env"));

const PORT = Number(process.env.PORT ?? "4000");
const DEFAULT_ID_INTEGRADORA = Number(
  process.env.IDINTEGRADORA ?? process.env.ID_INTEGRADORA ?? "8"
);

function json(res, statusCode, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

function text(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

function normalizeTenant(tenant) {
  return String(tenant ?? "").trim();
}

function nowIso() {
  return new Date().toISOString();
}

function parseCookies(req) {
  const raw = req.headers.cookie;
  if (!raw) return {};
  const out = {};
  for (const part of String(raw).split(";")) {
    const [k, ...rest] = part.split("=");
    const key = k?.trim();
    if (!key) continue;
    out[key] = decodeURIComponent(rest.join("=").trim());
  }
  return out;
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(String(value))}`];
  if (options.maxAge != null) parts.push(`Max-Age=${Number(options.maxAge)}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

async function listTenants() {
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  const candidates = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const tenants = [];
  for (const name of candidates) {
    try {
      const catalogDir = path.join(ROOT, name, "CATALOGO");
      await fs.access(path.join(catalogDir, "categorias.json"));
      await fs.access(path.join(catalogDir, "produtos.json"));
      tenants.push(name);
    } catch {
      continue;
    }
  }
  return tenants;
}

async function ensureTenant(tenant) {
  const t = normalizeTenant(tenant);
  if (!t) return null;
  const tenants = await listTenants();
  if (!tenants.includes(t)) return null;
  return t;
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  const host = url.hostname;
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  if (port !== "3000") return false;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host === "lvh.me" || host.endsWith(".lvh.me")) return true;
  return false;
}

function corsHeaders(req) {
  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Tenant",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function readRequestJson(req) {
  const chunks = [];
  let total = 0;
  const MAX = 2_000_000;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > MAX) throw new Error("payload_too_large");
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}

async function readRequestBinary(req) {
  const chunks = [];
  let total = 0;
  const MAX = 10_000_000;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > MAX) throw new Error("payload_too_large");
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

async function readCatalogList(tenant, fileName) {
  const base = path.join(ROOT, tenant, "CATALOGO");
  const fullPath = path.join(base, fileName);
  return await readJsonFile(fullPath);
}

function resolveProxyBaseUrl(envKey) {
  const raw = String(process.env[envKey] ?? "").trim();
  if (!raw) return null;
  try {
    return new URL(raw).toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

function buildProxyRequestHeaders(req) {
  const out = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null) continue;
    const key = String(k).toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(key)) continue;
    if (key === "origin" || key === "referer") continue;
    if (key === "accept-encoding") continue;
    out[k] = v;
  }
  out["accept-encoding"] = "identity";
  return out;
}

function isExternalProxyPath(pathname) {
  return (
    pathname === "/tokenService" ||
    pathname === "/postAutenteicaAplicativo" ||
    pathname === "/enviarToken" ||
    pathname === "/verificarTokenSistema" ||
    pathname === "/getOperadorSistemaForId" ||
    pathname.startsWith("/Servidor/webservice/integration/")
  );
}

async function proxyToUpstream(req, res, cors, upstreamBaseUrl) {
  const rawUrl = String(req.url ?? "/");
  const targetUrl = `${String(upstreamBaseUrl).replace(/\/+$/, "")}/${rawUrl.replace(
    /^\/+/,
    ""
  )}`;
  const method = String(req.method ?? "GET").toUpperCase();
  const headers = buildProxyRequestHeaders(req);

  let body;
  if (method !== "GET" && method !== "HEAD") {
    try {
      body = await readRequestBinary(req);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (message === "payload_too_large") {
        json(res, 413, { error: "payload_too_large" }, cors);
        return;
      }
      json(res, 400, { error: "invalid_body" }, cors);
      return;
    }
  }

  let upstream;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "manual",
    });
  } catch (err) {
    process.stderr.write(
      `[mock-end] Proxy falhou (${method} ${targetUrl}): ${String(err?.message ?? err)}\n`
    );
    json(res, 502, { error: "bad_gateway" }, cors);
    return;
  }

  const upstreamHeaders = {};
  let setCookies = [];
  for (const [k, v] of upstream.headers) {
    const key = String(k).toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(key)) continue;
    if (key === "set-cookie") continue;
    upstreamHeaders[k] = v;
  }

  if (typeof upstream.headers.getSetCookie === "function") {
    setCookies = upstream.headers.getSetCookie();
  } else {
    const single = upstream.headers.get("set-cookie");
    if (single) setCookies = [single];
  }

  const finalHeaders = {
    ...upstreamHeaders,
    ...cors,
  };
  if (setCookies.length) finalHeaders["Set-Cookie"] = setCookies;

  const buf = Buffer.from(await upstream.arrayBuffer());
  res.writeHead(upstream.status, finalHeaders);
  res.end(buf);
}

const COMMERCE_SCHEMA_VERSION = 1;
const SEEDED_COMMERCE_TENANTS = new Set();
const SEEDING_COMMERCE_TENANTS = new Map();

async function writeJsonIfMissing(filePath, data) {
  try {
    await fs.access(filePath);
    return false;
  } catch (err) {
    if (err?.code !== "ENOENT") throw err;
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8", {
      flag: "wx",
    });
    return true;
  } catch (err) {
    if (err?.code === "EEXIST") return false;
    throw err;
  }
}

async function ensureCommerceSeed(tenant) {
  if (SEEDED_COMMERCE_TENANTS.has(tenant)) return;
  const inFlight = SEEDING_COMMERCE_TENANTS.get(tenant);
  if (inFlight) return await inFlight;

  const p = (async () => {
    const dir = path.join(ROOT, tenant, "COMMERCE");
    await fs.mkdir(dir, { recursive: true });

    await writeJsonIfMissing(path.join(dir, "users.json"), {
      schemaVersion: COMMERCE_SCHEMA_VERSION,
      users: [],
    });
    await writeJsonIfMissing(path.join(dir, "sessions.json"), {
      schemaVersion: COMMERCE_SCHEMA_VERSION,
      sessions: [],
    });
    await writeJsonIfMissing(path.join(dir, "orders.json"), {
      schemaVersion: COMMERCE_SCHEMA_VERSION,
      orders: [],
    });
  })();

  SEEDING_COMMERCE_TENANTS.set(tenant, p);
  try {
    await p;
    SEEDED_COMMERCE_TENANTS.add(tenant);
  } finally {
    SEEDING_COMMERCE_TENANTS.delete(tenant);
  }
}

async function readCommerceFile(tenant, fileName) {
  const fullPath = path.join(ROOT, tenant, "COMMERCE", fileName);
  return await readJsonFile(fullPath);
}

async function writeCommerceFile(tenant, fileName, data) {
  const fullPath = path.join(ROOT, tenant, "COMMERCE", fileName);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function stableSixDigitToken() {
  const n = Math.floor(Math.random() * 900_000) + 100_000;
  return String(n);
}

const LOGIN_TOKENS = new Map();

async function ensureUserByContact(tenant, { email, whatsapp }) {
  const commerce = await readCommerceFile(tenant, "users.json");
  const users = Array.isArray(commerce?.users) ? commerce.users : [];

  const found = users.find((u) => {
    if (!u || typeof u !== "object") return false;
    if (email && String(u.email ?? "").toLowerCase() === String(email).toLowerCase())
      return true;
    if (whatsapp && String(u.whatsapp ?? "") === String(whatsapp)) return true;
    return false;
  });
  if (found) return found;

  const nextId =
    users.reduce((max, u) => {
      const id = Number(u?.id ?? 0);
      return Number.isFinite(id) && id > max ? id : max;
    }, 0) + 1;

  const created = {
    id: nextId,
    nome: email ? String(email).split("@")[0] : "Operador Mock",
    email: email ?? "",
    whatsapp: whatsapp ?? "",
    createdAt: nowIso(),
  };
  users.push(created);
  await writeCommerceFile(tenant, "users.json", { ...commerce, users });
  return created;
}

async function findUserById(tenant, id) {
  const commerce = await readCommerceFile(tenant, "users.json");
  const users = Array.isArray(commerce?.users) ? commerce.users : [];
  const parsed = Number(id);
  if (!Number.isFinite(parsed)) return null;
  return users.find((u) => u && typeof u === "object" && Number(u.id) === parsed) ?? null;
}

async function readCatalogCategoriesMap(tenant) {
  const categories = await readCatalogList(tenant, "categorias.json");
  const map = new Map();
  if (Array.isArray(categories)) {
    for (const c of categories) {
      if (!c || typeof c !== "object") continue;
      const id = Number(c.id);
      if (!Number.isFinite(id)) continue;
      map.set(id, c);
    }
  }
  return map;
}

function resolveCategoryNames(categoriesById, categoryId) {
  const startId = Number(categoryId);
  if (!Number.isFinite(startId)) return { categoria: "", departamento: "" };
  const current = categoriesById.get(startId);
  const categoria = current?.name ? String(current.name) : "";

  let top = current;
  let guard = 0;
  while (top && Number(top.parentId ?? 0) !== 0 && guard++ < 10) {
    top = categoriesById.get(Number(top.parentId));
  }
  const departamento = top?.name ? String(top.name) : "";
  return { categoria, departamento };
}

function hashStringToInt(input) {
  const str = String(input ?? "");
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

function mapCatalogItemToIntegratedProduct(item, categoriesById, idIntegradora) {
  const codProd = Number(item?.id);
  const baseCodProd = Number.isFinite(codProd)
    ? codProd
    : Math.abs(hashStringToInt(String(item?.slug ?? item?.sku ?? "")));
  const categoryId = Number(item?.categoryId ?? 0);
  const { categoria, departamento } = resolveCategoryNames(categoriesById, categoryId);
  const image = String(item?.image ?? "");

  return {
    codProd: baseCodProd,
    idIntegradora,
    indiceEstoque: 1,
    qtUnit: 1,
    qtUnitCaixa: 1,
    codLocalOrig: 0,
    recalculaPrecoUnidade: false,
    recalculaEstoqueUnidade: false,
    descricaoErp: String(item?.name ?? ""),
    descricaoEcomerce: String(item?.name ?? ""),
    ean: "",
    eanCaixa: "",
    codVol: String(item?.unitLabel ?? "UN"),
    productId: String(item?.sku ?? baseCodProd),
    codFilial: "0",
    skuId: String(item?.sku ?? baseCodProd),
    preco: Number(item?.price ?? 0),
    qtEstoque: Number(item?.stock ?? 0),
    imagem: image,
    categoriaPrinciapal: categoryId,
    dtUltAlter: nowIso(),
    imagens: image ? [image] : [],
    categorias: [],
    departamento,
    categoria,
    url: "",
    status: "ATIVO",
  };
}

async function resolveConnectTenant(req, url) {
  const fromQuery = url.searchParams.get("tenant");
  const fromHeader = req.headers["x-tenant"];
  const fromEnv = process.env.MOCKEND_TENANT_DEFAULT;

  const candidates = [fromQuery, fromHeader, fromEnv];
  for (const candidate of candidates) {
    const t = await ensureTenant(candidate);
    if (t) return t;
  }

  const tenants = await listTenants();
  return tenants[0] ?? null;
}

const ALLOWED_JSON_ROOT_DIRS = new Set([
  "CATALOGO",
  "THEMA",
  "COPY",
  "CONTEXTO",
  "BUILDER",
  "BLUEPRINT",
  "COMMERCE",
]);

function resolveTenantJsonPath(tenant, relPath) {
  const base = path.resolve(ROOT, tenant);
  const raw = String(relPath ?? "");
  if (!raw || raw.includes("\0")) return null;
  if (path.isAbsolute(raw)) return null;
  const normalized = raw.replaceAll("\\", "/").replace(/^\/+/, "");
  const first = normalized.split("/")[0] ?? "";
  if (!ALLOWED_JSON_ROOT_DIRS.has(first)) return null;
  if (!normalized.toLowerCase().endsWith(".json")) return null;
  const full = path.resolve(base, normalized);
  if (!full.startsWith(base + path.sep)) return null;
  return full;
}

function resolveTenantAssetPath(tenant, relPath) {
  const base = path.resolve(ROOT, tenant);
  const raw = String(relPath ?? "");
  if (!raw || raw.includes("\0")) return null;
  if (path.isAbsolute(raw)) return null;
  const normalized = raw.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized.startsWith("THEMA/assets/images/")) return null;
  const ext = path.extname(normalized).toLowerCase();
  const allowedExts = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg"]);
  if (!allowedExts.has(ext)) return null;
  const full = path.resolve(base, normalized);
  if (!full.startsWith(base + path.sep)) return null;
  return full;
}

async function listJsonFiles(tenant, relDir) {
  const base = path.resolve(ROOT, tenant);
  const raw = String(relDir ?? "");
  if (!raw || raw.includes("\0")) return null;
  if (path.isAbsolute(raw)) return null;
  const normalized = raw
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  const first = normalized.split("/")[0] ?? "";
  if (!ALLOWED_JSON_ROOT_DIRS.has(first)) return null;
  const fullDir = path.resolve(base, normalized);
  if (!fullDir.startsWith(base + path.sep)) return null;
  const entries = await fs.readdir(fullDir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!e.name.toLowerCase().endsWith(".json")) continue;
    const filePath = path.join(fullDir, e.name);
    const st = await fs.stat(filePath);
    out.push({
      name: e.name,
      size: st.size,
      mtimeMs: st.mtimeMs,
      path: normalized ? `${normalized}/${e.name}` : e.name,
    });
  }
  return out;
}

async function handle(req, res) {
  const cors = corsHeaders(req) ?? {};
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname = url.pathname;

  if (isExternalProxyPath(pathname)) {
    const upstreamEnvKey = pathname.startsWith("/Servidor/webservice/integration/")
      ? "INTEGRATION_URL_API"
      : "AUTH_BASE_URL";
    const upstreamBaseUrl = resolveProxyBaseUrl(upstreamEnvKey);
    if (!upstreamBaseUrl) {
      json(res, 500, { error: "proxy_not_configured", env: upstreamEnvKey }, cors);
      return;
    }
    await proxyToUpstream(req, res, cors, upstreamBaseUrl);
    return;
  }

  if (pathname === "/health") {
    json(res, 200, { ok: true }, cors);
    return;
  }

  if (pathname.startsWith("/api/auth/") || pathname === "/api/auth/me") {
    const segment = pathname.replace(/^\/api\/auth\/?/, "");
    const tenant = await resolveConnectTenant(req, url);
    if (!tenant) {
      json(res, 500, { success: false, message: "Nenhum tenant disponivel." }, cors);
      return;
    }

    try {
      await ensureCommerceSeed(tenant);
    } catch {
      json(res, 500, { success: false, message: "Falha ao preparar dados do tenant." }, cors);
      return;
    }

    if (req.method === "POST" && segment === "register") {
      const body = await readRequestJson(req);
      const responsavel = String(body?.responsavel ?? "").trim();
      const cnpj = String(body?.cnpj ?? "").trim();
      const email = String(body?.email ?? "").trim();
      const whatsapp = String(body?.whatsapp ?? "").trim();

      if (!responsavel || !cnpj || !email || !whatsapp) {
        json(
          res,
          400,
          { success: false, message: "Campos obrigatorios ausentes para cadastro." },
          cors
        );
        return;
      }

      const commerce = await readCommerceFile(tenant, "users.json");
      const users = Array.isArray(commerce?.users) ? commerce.users : [];
      const nextId =
        users.reduce((max, u) => {
          const id = Number(u?.id ?? 0);
          return Number.isFinite(id) && id > max ? id : max;
        }, 0) + 1;

      const created = {
        id: nextId,
        nome: responsavel,
        responsavel,
        cnpj,
        email,
        whatsapp,
        createdAt: nowIso(),
      };

      users.push(created);
      await writeCommerceFile(tenant, "users.json", { ...commerce, users });

      json(res, 200, { success: true, data: { idCliente: nextId, status: "OK" } }, cors);
      return;
    }

    if (req.method === "POST" && segment === "send-token") {
      const body = await readRequestJson(req);
      const email = String(body?.email ?? "").trim();
      const whatsapp = String(body?.whatsapp ?? "").trim();

      if (!email && !whatsapp) {
        json(
          res,
          400,
          { success: false, message: "Informe email ou whatsapp para enviar o token." },
          cors
        );
        return;
      }

      const user = await ensureUserByContact(tenant, { email, whatsapp });
      const token = stableSixDigitToken();
      const dtCriacao = nowIso();
      const dtExpira = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      LOGIN_TOKENS.set(token, {
        idUsuario: Number(user.id),
        canal: email ? "email" : "whatsapp",
        dtCriacao,
        dtExpira,
        usado: false,
        tentativas: 0,
        maxTentativas: 5,
        hashToken: `mock-user-${token}`,
      });

      json(
        res,
        200,
        {
          success: true,
          data: {
            enviado: true,
            canal: email ? "email" : "whatsapp",
            tokenPreview: token,
          },
        },
        cors
      );
      return;
    }

    if (req.method === "POST" && segment === "verify-token") {
      const body = await readRequestJson(req);
      const token = String(body?.token ?? "").trim();

      if (!token) {
        json(res, 400, { success: false, message: "Token de validacao e obrigatorio." }, cors);
        return;
      }

      const meta = LOGIN_TOKENS.get(token);
      if (!meta || Date.parse(meta.dtExpira) <= Date.now()) {
        json(
          res,
          401,
          { success: false, message: "Falha ao validar token informado.", data: null },
          cors
        );
        return;
      }

      const operador = (await findUserById(tenant, meta.idUsuario)) ?? {
        id: meta.idUsuario,
        nome: "Operador Mock",
        email: "",
        telefone: "",
      };

      const verification = {
        idUsuario: meta.idUsuario,
        hashToken: String(meta.hashToken ?? `mock-user-${token}`),
        canal: meta.canal ?? "email",
        dtCriacao: meta.dtCriacao,
        dtExpira: meta.dtExpira,
        usado: true,
        tentativas: meta.tentativas ?? 0,
        maxTentativas: meta.maxTentativas ?? 5,
      };

      const session = {
        userId: String(meta.idUsuario),
        email: String(operador.email ?? ""),
        token: verification.hashToken || token,
        name: operador.nome ? String(operador.nome) : undefined,
      };

      const cookie = serializeCookie("session", JSON.stringify(session), {
        httpOnly: true,
        path: "/",
        sameSite: "Lax",
      });

      json(
        res,
        200,
        {
          success: true,
          data: {
            verification,
            operador,
          },
        },
        { ...cors, "Set-Cookie": cookie }
      );
      return;
    }

    if (req.method === "POST" && segment === "logout") {
      const cookie = serializeCookie("session", "", {
        httpOnly: true,
        path: "/",
        sameSite: "Lax",
        maxAge: 0,
      });
      json(res, 200, { success: true }, { ...cors, "Set-Cookie": cookie });
      return;
    }

    if (req.method === "GET" && (segment === "me" || segment === "")) {
      const cookies = parseCookies(req);
      const rawSession = cookies.session;
      if (!rawSession) {
        json(res, 401, { success: false, message: "Sessao nao encontrada." }, cors);
        return;
      }
      try {
        const parsed = JSON.parse(rawSession);
        if (!parsed || typeof parsed !== "object") throw new Error("invalid");
        json(res, 200, { success: true, data: parsed }, cors);
      } catch {
        json(res, 401, { success: false, message: "Sessao nao encontrada." }, cors);
      }
      return;
    }

    json(res, 404, { error: "not_found" }, cors);
    return;
  }

  if (pathname === "/api/products" || pathname.startsWith("/api/products/")) {
    const tenant = await resolveConnectTenant(req, url);
    if (!tenant) {
      json(res, 500, { success: false, message: "Nenhum tenant disponivel." }, cors);
      return;
    }

    const idIntegradoraRaw = url.searchParams.get("idIntegradora");
    const idIntegradora = idIntegradoraRaw
      ? Number.parseInt(idIntegradoraRaw, 10)
      : DEFAULT_ID_INTEGRADORA;

    if (Number.isNaN(idIntegradora)) {
      json(res, 400, { success: false, message: "idIntegradora must be a valid number" }, cors);
      return;
    }

    if (req.method !== "GET") {
      json(res, 405, { error: "method_not_allowed" }, cors);
      return;
    }

    const products = await readCatalogList(tenant, "produtos.json");
    const categoriesById = await readCatalogCategoriesMap(tenant);
    const list = Array.isArray(products) ? products : [];
    const mapped = list.map((p) =>
      mapCatalogItemToIntegratedProduct(p, categoriesById, idIntegradora)
    );

    if (pathname === "/api/products") {
      json(res, 200, { success: true, data: mapped, total: mapped.length }, cors);
      return;
    }

    const codProdStr = pathname.replace(/^\/api\/products\/+/, "").split("/")[0];
    const codProd = Number.parseInt(codProdStr, 10);
    if (Number.isNaN(codProd)) {
      json(res, 400, { success: false, message: "codProd must be a valid number" }, cors);
      return;
    }

    const found = mapped.find((p) => Number(p.codProd) === codProd) ?? null;
    if (!found) {
      json(res, 404, { success: false, message: "Produto nao encontrado." }, cors);
      return;
    }

    json(res, 200, { success: true, data: found }, cors);
    return;
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 3) {
    const [api, marker, tenantRaw, scope, resource, slug] = parts;
    if (api === "api" && marker === "tenant") {
      const tenant = await ensureTenant(tenantRaw);
      if (!tenant) {
        json(res, 404, { error: "tenant_not_found" }, cors);
        return;
      }

      try {
        if (scope === "json") {
          const action = resource;
          if (req.method === "GET" && action === "list") {
            const dir = url.searchParams.get("dir");
            let files;
            try {
              files = await listJsonFiles(tenant, dir);
            } catch (err) {
              if (err?.code === "ENOENT") {
                json(res, 404, { error: "not_found", tenant, dir }, cors);
                return;
              }
              throw err;
            }
            if (!files) {
              json(res, 400, { error: "invalid_dir" }, cors);
              return;
            }
            json(res, 200, { ok: true, tenant, dir, files }, cors);
            return;
          }

          if (req.method === "GET" && !action) {
            const relPath = url.searchParams.get("path");
            const filePath = resolveTenantJsonPath(tenant, relPath);
            if (!filePath) {
              json(res, 400, { error: "invalid_path" }, cors);
              return;
            }
            try {
              const data = await readJsonFile(filePath);
              json(res, 200, { ok: true, tenant, path: relPath, data }, cors);
            } catch (err) {
              if (err?.code === "ENOENT") {
                json(res, 404, { error: "not_found", tenant, path: relPath }, cors);
                return;
              }
              throw err;
            }
            return;
          }

          if (req.method === "PUT" && !action) {
            const relPath = url.searchParams.get("path");
            const filePath = resolveTenantJsonPath(tenant, relPath);
            if (!filePath) {
              json(res, 400, { error: "invalid_path" }, cors);
              return;
            }
            const body = await readRequestJson(req);
            if (!isRecord(body) && !Array.isArray(body)) {
              json(res, 400, { error: "invalid_json_root" }, cors);
              return;
            }
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(body, null, 2) + "\n", "utf8");
            json(res, 200, { ok: true, tenant, path: relPath }, cors);
            return;
          }

          if (req.method === "DELETE" && !action) {
            const relPath = url.searchParams.get("path");
            const filePath = resolveTenantJsonPath(tenant, relPath);
            if (!filePath) {
              json(res, 400, { error: "invalid_path" }, cors);
              return;
            }
            await fs.rm(filePath, { force: true });
            json(res, 200, { ok: true, tenant, path: relPath }, cors);
            return;
          }

          json(res, 405, { error: "method_not_allowed" }, cors);
          return;
        }

        if (scope === "assets") {
          const relPath = url.searchParams.get("path");
          const filePath = resolveTenantAssetPath(tenant, relPath);

          if (!filePath) {
            json(res, 400, { error: "invalid_path" }, cors);
            return;
          }

          if (req.method === "PUT") {
            const body = await readRequestBinary(req);
            if (!body || body.length === 0) {
              json(res, 400, { error: "empty_payload" }, cors);
              return;
            }
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, body);
            json(res, 200, { ok: true, tenant, path: relPath, size: body.length }, cors);
            return;
          }

          if (req.method === "DELETE") {
            await fs.rm(filePath, { force: true });
            json(res, 200, { ok: true, tenant, path: relPath }, cors);
            return;
          }

          json(res, 405, { error: "method_not_allowed" }, cors);
          return;
        }

        if (scope !== "catalogo") {
          json(res, 404, { error: "not_found" }, cors);
          return;
        }

        if (resource === "categorias") {
          if (req.method !== "GET") {
            json(res, 405, { error: "method_not_allowed" }, cors);
            return;
          }
          const categories = await readJsonFile(
            path.join(ROOT, tenant, "CATALOGO", "categorias.json")
          );
          if (!slug) {
            json(res, 200, categories, cors);
            return;
          }
          const item = Array.isArray(categories) ? categories.find((c) => c?.slug === slug) : null;
          if (!item) {
            json(res, 404, { error: "slug_not_found" }, cors);
            return;
          }
          json(res, 200, item, cors);
          return;
        }

        if (resource === "produtos") {
          if (req.method !== "GET") {
            json(res, 405, { error: "method_not_allowed" }, cors);
            return;
          }
          const products = await readJsonFile(path.join(ROOT, tenant, "CATALOGO", "produtos.json"));
          if (!slug) {
            json(res, 200, products, cors);
            return;
          }
          const item = Array.isArray(products) ? products.find((p) => p?.slug === slug) : null;
          if (!item) {
            json(res, 404, { error: "slug_not_found" }, cors);
            return;
          }
          json(res, 200, item, cors);
          return;
        }

        json(res, 404, { error: "not_found" }, cors);
        return;
      } catch (e) {
        const message = e instanceof Error ? e.message : "";
        if (message === "payload_too_large") {
          json(res, 413, { error: "payload_too_large" }, cors);
          return;
        }
        if (message.includes("JSON")) {
          json(res, 400, { error: "invalid_json" }, cors);
          return;
        }
        json(res, 500, { error: "internal_error" }, cors);
        return;
      }
    }
  }

  json(res, 404, { error: "not_found" }, cors);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(() => text(res, 500, "internal_error"));
});

server.listen(PORT, () => {
  process.stdout.write(`MOCK-END listening on http://localhost:${PORT}\n`);
});

