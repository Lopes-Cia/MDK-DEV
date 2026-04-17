import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function safeString(value) {
  return String(value ?? "").trim();
}

function toNumber(value, fieldName) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Valor invalido para ${fieldName}: "${value}"`);
  }
  return n;
}

function toIsoOrNull(value) {
  const s = safeString(value);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
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
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export class TokenManager {
  constructor({ envDir, env }) {
    this.envDir = envDir;
    this.env = env;
    this.tokenFilePath = path.join(envDir, "token-acesso.json");
  }

  async readTokenFile() {
    return readJsonFile(this.tokenFilePath);
  }

  async persistToken({ mode, endpoint, response, payload }) {
    const data = response ?? {};
    const persisted = {
      updatedAt: new Date().toISOString(),
      mode,
      endpoint,
      hashToken: data?.hashToken ?? null,
      refreshToken: data?.refreshToken ?? (mode === "refresh" ? payload?.refreshToken ?? null : null),
      dtExpira: data?.dtExpira ?? null,
      dtExpiraIso: toIsoOrNull(data?.dtExpira),
      response: data,
    };
    await writeJsonFile(this.tokenFilePath, persisted);
    return persisted;
  }

  resolveAuthBaseUrl() {
    const baseUrl = safeString(this.env?.AUTH_BASE_URL);
    if (!baseUrl) throw new Error("AUTH_BASE_URL nao encontrado no .env");
    return baseUrl.replace(/\/+$/, "");
  }

  async generate() {
    const baseUrl = this.resolveAuthBaseUrl();
    const endpoint = `${baseUrl}/tokenService`;

    const produto = safeString(this.env?.PRODUTO).replace(/^["']|["']$/g, "");
    const ean = safeString(this.env?.EAN);
    const idIntegradora = toNumber(this.env?.IDINTEGRADORA, "IDINTEGRADORA");
    const codCli = toNumber(this.env?.CODCLI, "CODCLI");

    const payload = { produto, ean, idIntegradora, codCli };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    if (!res.ok) {
      const err = new Error(`Falha ao gerar token (${res.status} ${res.statusText})`);
      err.details = json;
      throw err;
    }

    return this.persistToken({ mode: "geracao", endpoint, response: json, payload });
  }

  async refresh({ refreshToken } = {}) {
    const baseUrl = this.resolveAuthBaseUrl();
    const endpoint = `${baseUrl}/tokenService`;

    const persisted = await this.readTokenFile();
    const rt =
      safeString(refreshToken) ||
      safeString(this.env?.REFRESH_TOKEN) ||
      safeString(persisted?.refreshToken);

    if (!rt) {
      throw new Error("Refresh solicitado, mas nenhum refreshToken foi encontrado.");
    }

    const payload = { refreshToken: rt };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    if (!res.ok) {
      const err = new Error(`Falha ao refresh token (${res.status} ${res.statusText})`);
      err.details = json;
      throw err;
    }

    return this.persistToken({ mode: "refresh", endpoint, response: json, payload });
  }

  isExpired(tokenFile) {
    const iso = safeString(tokenFile?.dtExpiraIso) || toIsoOrNull(tokenFile?.dtExpira);
    if (!iso) return false;
    const exp = new Date(iso).getTime();
    if (!Number.isFinite(exp)) return false;
    return Date.now() >= exp;
  }

  async ensureValidToken() {
    const tokenFile = await this.readTokenFile();
    const hashToken = safeString(tokenFile?.hashToken);
    if (hashToken && !this.isExpired(tokenFile)) return tokenFile;

    const hasRefresh = safeString(tokenFile?.refreshToken) || safeString(this.env?.REFRESH_TOKEN);
    if (hasRefresh) return this.refresh();
    return this.generate();
  }
}

