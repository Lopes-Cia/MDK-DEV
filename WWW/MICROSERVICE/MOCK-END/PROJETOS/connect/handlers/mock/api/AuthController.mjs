import path from "node:path";
import { createHash, randomBytes } from "node:crypto";

import { readJsonArray, updateJsonArray } from "../../../../../lib/array-store.mjs";

function nowIso() {
  return new Date().toISOString();
}

function stableSixDigitToken() {
  const n = Math.floor(Math.random() * 900_000) + 100_000;
  return String(n);
}

function sha256(value) {
  return createHash("sha256").update(String(value ?? "")).digest("hex");
}

function asText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return asText(value).toLowerCase();
}

function parseSessionCookie(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const userId = asText(parsed.userId);
    if (!userId) return null;
    return {
      userId,
      email: asText(parsed.email),
      token: asText(parsed.token),
      name: asText(parsed.name) || undefined,
    };
  } catch {
    return null;
  }
}

function nextNumericId(list) {
  let max = 0;
  for (const item of Array.isArray(list) ? list : []) {
    const n = Number(item?.id ?? 0);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

function findUserByEmailOrWhatsapp(users, { email, whatsapp }) {
  const emailKey = normalizeEmail(email);
  const whatsappKey = asText(whatsapp);
  return (
    (Array.isArray(users) ? users : []).find((u) => {
      if (emailKey && normalizeEmail(u?.email) === emailKey) return true;
      if (whatsappKey && asText(u?.whatsapp) === whatsappKey) return true;
      return false;
    }) ?? null
  );
}

function publicOperadorFromUser(user) {
  return {
    id: Number(user?.id ?? 0),
    nome: asText(user?.nome) || asText(user?.responsavel) || "Operador",
    email: normalizeEmail(user?.email),
    telefone: asText(user?.telefone) || asText(user?.whatsapp) || "",
  };
}

function isRecord(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function normalizeUf(value) {
  const uf = asText(value).toUpperCase();
  if (!uf) return "";
  if (uf.length !== 2) return "";
  return uf;
}

function normalizeCep(value) {
  return asText(value).replace(/\D/g, "").slice(0, 8);
}

function normalizeAddress(input, fallbackId) {
  const raw = isRecord(input) ? input : {};
  const id = asText(raw.id) || String(fallbackId);
  return {
    id,
    apelido: asText(raw.apelido || raw.label),
    destinatario: asText(raw.destinatario || raw.nome),
    telefone: asText(raw.telefone),
    cep: normalizeCep(raw.cep),
    uf: normalizeUf(raw.uf),
    cidade: asText(raw.cidade),
    bairro: asText(raw.bairro),
    logradouro: asText(raw.logradouro),
    numero: asText(raw.numero),
    complemento: asText(raw.complemento),
    referencia: asText(raw.referencia),
    padrao: Boolean(raw.padrao),
  };
}

function normalizeAddresses(list) {
  const arr = Array.isArray(list) ? list : [];
  let nextId = 1;
  const out = arr
    .map((a) => {
      const addr = normalizeAddress(a, nextId++);
      if (!addr.cep) return null;
      if (!addr.uf) return null;
      if (!addr.cidade) return null;
      if (!addr.logradouro) return null;
      if (!addr.numero) return null;
      return addr;
    })
    .filter(Boolean);

  let marked = false;
  const normalized = out.map((a) => {
    if (a.padrao && !marked) {
      marked = true;
      return a;
    }
    if (a.padrao && marked) return { ...a, padrao: false };
    return a;
  });
  if (!marked && normalized.length) normalized[0] = { ...normalized[0], padrao: true };
  return normalized;
}

export class AuthController {
  constructor({ baseDir }) {
    const dir = path.resolve(String(baseDir ?? ""));
    this.usersPath = path.join(dir, "users.json");
    this.sessionsPath = path.join(dir, "sessions.json");
    this.cartsPath = path.join(dir, "carts.json");
    this.ordersPath = path.join(dir, "orders.json");
    this.passwordResetsPath = path.join(dir, "passwordResets.json");
  }

  async register({ responsavel, cnpj, email, whatsapp }) {
    const r = asText(responsavel);
    const c = asText(cnpj);
    const e = asText(email);
    const w = asText(whatsapp);
    if (!r || !c || !e || !w) {
      return { ok: false, status: 400, body: { success: false, message: "Campos obrigatorios ausentes para cadastro." } };
    }

    const out = await updateJsonArray(this.usersPath, "users", async (users) => {
      const exists = findUserByEmailOrWhatsapp(users, { email: e, whatsapp: w });
      if (exists) return users;
      const id = nextNumericId(users);
      const createdAt = nowIso();
      return [
        ...(Array.isArray(users) ? users : []),
        {
          id,
          nome: r,
          responsavel: r,
          cnpj: c,
          email: normalizeEmail(e),
          whatsapp: w,
          telefone: "",
          enderecos: [],
          passwordHash: "",
          createdAt,
          updatedAt: createdAt,
        },
      ];
    });

    const created = findUserByEmailOrWhatsapp(out, { email: e, whatsapp: w });
    return { ok: true, status: 200, body: { success: true, data: { idCliente: Number(created?.id ?? 0), status: "OK" } } };
  }

  async sendToken({ email, whatsapp }) {
    const e = asText(email);
    const w = asText(whatsapp);
    if (!e && !w) {
      return {
        ok: false,
        status: 400,
        body: { success: false, message: "Informe email ou whatsapp para enviar o token." },
      };
    }

    const users = await readJsonArray(this.usersPath, "users");
    let user = findUserByEmailOrWhatsapp(users, { email: e, whatsapp: w });
    if (!user) {
      const id = nextNumericId(users);
      const createdAt = nowIso();
      user = {
        id,
        nome: e ? asText(e).split("@")[0] : "Operador",
        responsavel: e ? asText(e).split("@")[0] : "Operador",
        cnpj: "",
        email: normalizeEmail(e),
        whatsapp: w,
        telefone: "",
        enderecos: [],
        passwordHash: "",
        createdAt,
        updatedAt: createdAt,
      };
      await updateJsonArray(this.usersPath, "users", async (list) => [
        ...(Array.isArray(list) ? list : []),
        user,
      ]);
    }

    const token = stableSixDigitToken();
    const dtCriacao = nowIso();
    const dtExpira = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const idUsuario = Number(user?.id ?? 0);
    const canal = e ? "email" : "whatsapp";
    const hashToken = `mock-user-${token}`;

    await updateJsonArray(this.sessionsPath, "sessions", async (sessions) => [
      ...(Array.isArray(sessions) ? sessions : []),
      {
        id: `login-${token}-${randomBytes(4).toString("hex")}`,
        kind: "login_token",
        token,
        idUsuario,
        canal,
        dtCriacao,
        dtExpira,
        usado: false,
        tentativas: 0,
        maxTentativas: 5,
        hashToken,
      },
    ]);

    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        data: { enviado: true, canal, tokenPreview: token },
      },
    };
  }

  async verifyToken({ token }) {
    const t = asText(token);
    if (!t) {
      return { ok: false, status: 400, body: { success: false, message: "Token de validacao e obrigatorio." } };
    }

    const sessions = await readJsonArray(this.sessionsPath, "sessions");
    const meta =
      (Array.isArray(sessions) ? sessions : []).find(
        (s) =>
          asText(s?.kind) === "login_token" &&
          asText(s?.token) === t &&
          String(s?.usado ?? "false") !== "true"
      ) ?? null;

    if (!meta || Date.parse(asText(meta.dtExpira)) <= Date.now()) {
      return {
        ok: false,
        status: 401,
        body: { success: false, message: "Falha ao validar token informado.", data: null },
      };
    }

    const users = await readJsonArray(this.usersPath, "users");
    const user =
      (Array.isArray(users) ? users : []).find((u) => String(u?.id ?? "") === String(meta.idUsuario ?? "")) ??
      null;

    const operador = user ? publicOperadorFromUser(user) : { id: Number(meta.idUsuario ?? 0), nome: "Operador Mock", email: "", telefone: "" };
    const verification = {
      idUsuario: Number(meta.idUsuario ?? 0),
      hashToken: asText(meta.hashToken) || `mock-user-${t}`,
      canal: asText(meta.canal) || "email",
      dtCriacao: asText(meta.dtCriacao),
      dtExpira: asText(meta.dtExpira),
      usado: true,
      tentativas: Number(meta.tentativas ?? 0),
      maxTentativas: Number(meta.maxTentativas ?? 5),
    };

    const sessionCookie = {
      userId: String(verification.idUsuario),
      email: operador.email ?? "",
      token: verification.hashToken || t,
      name: operador.nome ? String(operador.nome) : undefined,
    };

    const sessionId = `session-${randomBytes(10).toString("hex")}`;
    const createdAt = nowIso();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

    await updateJsonArray(this.sessionsPath, "sessions", async (list) => {
      const base = Array.isArray(list) ? list : [];
      const next = base.map((s) => {
        if (String(s?.id ?? "") === String(meta.id ?? "")) return { ...s, usado: true };
        return s;
      });
      next.push({
        id: sessionId,
        kind: "session",
        userId: sessionCookie.userId,
        token: sessionCookie.token,
        createdAt,
        expiresAt,
      });
      return next;
    });

    return {
      ok: true,
      status: 200,
      body: { success: true, data: { verification, operador } },
      sessionCookie,
    };
  }

  async me({ rawSession }) {
    const session = parseSessionCookie(rawSession);
    if (!session) {
      return { ok: false, status: 401, body: { success: false, message: "Sessao nao encontrada." } };
    }
    return { ok: true, status: 200, body: { success: true, data: session } };
  }

  async logout() {
    return { ok: true, status: 200, body: { success: true } };
  }

  async updateMe({ rawSession, nome, telefone, enderecos }) {
    const session = parseSessionCookie(rawSession);
    if (!session) {
      return { ok: false, status: 401, body: { success: false, message: "Sessao nao encontrada." } };
    }

    const name = asText(nome);
    const phone = asText(telefone);
    const addresses = enderecos === undefined ? null : normalizeAddresses(enderecos);
    if (!name && !phone && addresses == null) {
      return { ok: false, status: 400, body: { success: false, message: "Nada para atualizar." } };
    }

    const userId = session.userId;
    const out = await updateJsonArray(this.usersPath, "users", async (users) => {
      const base = Array.isArray(users) ? users : [];
      const idx = base.findIndex((u) => String(u?.id ?? "") === String(userId));
      if (idx < 0) return base;
      const current = base[idx] ?? {};
      const next = {
        ...current,
        nome: name || current.nome,
        telefone: phone || current.telefone,
        enderecos: addresses == null ? current.enderecos : addresses,
        updatedAt: nowIso(),
      };
      const copy = [...base];
      copy[idx] = next;
      return copy;
    });

    const updated = (Array.isArray(out) ? out : []).find((u) => String(u?.id ?? "") === String(userId)) ?? null;
    const operador = updated ? publicOperadorFromUser(updated) : null;
    return { ok: true, status: 200, body: { success: true, data: { operador } } };
  }

  async privacyDelete({ rawSession }) {
    const session = parseSessionCookie(rawSession);
    if (!session) {
      return { ok: false, status: 401, body: { success: false, message: "Sessao nao encontrada." } };
    }

    const userId = session.userId;

    await updateJsonArray(this.usersPath, "users", async (users) =>
      (Array.isArray(users) ? users : []).filter((u) => String(u?.id ?? "") !== String(userId))
    );

    await updateJsonArray(this.sessionsPath, "sessions", async (sessions) =>
      (Array.isArray(sessions) ? sessions : []).filter((s) => {
        if (asText(s?.kind) === "session") return String(s?.userId ?? "") !== String(userId);
        if (asText(s?.kind) === "login_token") return String(s?.idUsuario ?? "") !== String(userId);
        return true;
      })
    );

    await updateJsonArray(this.cartsPath, "carts", async (carts) =>
      (Array.isArray(carts) ? carts : []).filter((c) => String(c?.userId ?? "") !== String(userId))
    );

    await updateJsonArray(this.ordersPath, "orders", async (orders) =>
      (Array.isArray(orders) ? orders : []).filter((o) => String(o?.userId ?? "") !== String(userId))
    );

    await updateJsonArray(this.passwordResetsPath, "passwordResets", async (resets) =>
      (Array.isArray(resets) ? resets : []).filter((r) => String(r?.userId ?? "") !== String(userId))
    );

    return { ok: true, status: 200, body: { success: true } };
  }

  async forgotPassword({ email }) {
    const e = asText(email);
    if (!e) {
      return { ok: false, status: 400, body: { success: false, message: "Email e obrigatorio." } };
    }

    const users = await readJsonArray(this.usersPath, "users");
    const user = findUserByEmailOrWhatsapp(users, { email: e, whatsapp: "" });
    if (!user) {
      return { ok: true, status: 200, body: { success: true, data: { enviado: true } } };
    }

    const token = randomBytes(18).toString("hex");
    const createdAt = nowIso();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await updateJsonArray(this.passwordResetsPath, "passwordResets", async (list) => [
      ...(Array.isArray(list) ? list : []),
      {
        id: `reset-${randomBytes(6).toString("hex")}`,
        userId: String(user.id),
        token,
        createdAt,
        expiresAt,
        usedAt: "",
      },
    ]);

    return { ok: true, status: 200, body: { success: true, data: { enviado: true } } };
  }

  async resetPassword({ token, password }) {
    const t = asText(token);
    const p = asText(password);
    if (!t || !p) {
      return { ok: false, status: 400, body: { success: false, message: "Token e senha sao obrigatorios." } };
    }

    const resets = await readJsonArray(this.passwordResetsPath, "passwordResets");
    const reset =
      (Array.isArray(resets) ? resets : []).find((r) => asText(r?.token) === t && !asText(r?.usedAt)) ?? null;

    if (!reset || Date.parse(asText(reset.expiresAt)) <= Date.now()) {
      return { ok: false, status: 401, body: { success: false, message: "Token invalido ou expirado." } };
    }

    const userId = asText(reset.userId);
    await updateJsonArray(this.usersPath, "users", async (users) => {
      const base = Array.isArray(users) ? users : [];
      const idx = base.findIndex((u) => String(u?.id ?? "") === String(userId));
      if (idx < 0) return base;
      const current = base[idx] ?? {};
      const next = { ...current, passwordHash: sha256(p), updatedAt: nowIso() };
      const copy = [...base];
      copy[idx] = next;
      return copy;
    });

    await updateJsonArray(this.passwordResetsPath, "passwordResets", async (list) => {
      const base = Array.isArray(list) ? list : [];
      const idx = base.findIndex((r) => String(r?.id ?? "") === String(reset.id ?? ""));
      if (idx < 0) return base;
      const current = base[idx] ?? {};
      const next = { ...current, usedAt: nowIso() };
      const copy = [...base];
      copy[idx] = next;
      return copy;
    });

    return { ok: true, status: 200, body: { success: true } };
  }
}
