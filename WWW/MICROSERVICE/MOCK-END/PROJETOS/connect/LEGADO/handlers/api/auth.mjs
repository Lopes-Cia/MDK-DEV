import { readRequestJson } from "../../../../lib/body.mjs";
import { parseCookies, serializeCookie } from "../../../../lib/cookies.mjs";
import { json } from "../../../../lib/response.mjs";

function nowIso() {
  return new Date().toISOString();
}

function stableSixDigitToken() {
  const n = Math.floor(Math.random() * 900_000) + 100_000;
  return String(n);
}

const LOGIN_TOKENS = new Map();
const USERS = new Map();

function nextUserId() {
  let max = 0;
  for (const user of USERS.values()) {
    const id = Number(user?.id ?? 0);
    if (Number.isFinite(id) && id > max) max = id;
  }
  return max + 1;
}

function upsertUser({ responsavel, cnpj, email, whatsapp }) {
  const emailKey = String(email ?? "").trim().toLowerCase();
  const whatsappKey = String(whatsapp ?? "").trim();
  for (const user of USERS.values()) {
    if (emailKey && String(user.email ?? "").toLowerCase() === emailKey) return user;
    if (whatsappKey && String(user.whatsapp ?? "") === whatsappKey) return user;
  }
  const id = nextUserId();
  const created = {
    id,
    nome: String(responsavel ?? emailKey.split("@")[0] ?? "Operador").trim() || "Operador",
    responsavel: String(responsavel ?? "").trim(),
    cnpj: String(cnpj ?? "").trim(),
    email: emailKey,
    whatsapp: whatsappKey,
    createdAt: nowIso(),
  };
  USERS.set(String(id), created);
  return created;
}

async function register(req, res, ctx) {
  const { cors } = ctx;
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

  const created = upsertUser({ responsavel, cnpj, email, whatsapp });
  json(res, 200, { success: true, data: { idCliente: created.id, status: "OK" } }, cors);
}

async function sendToken(req, res, ctx) {
  const { cors } = ctx;
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

  const user = upsertUser({
    responsavel: email ? String(email).split("@")[0] : "Operador",
    cnpj: "",
    email,
    whatsapp,
  });
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
}

async function verifyToken(req, res, ctx) {
  const { cors } = ctx;
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

  const operador = USERS.get(String(meta.idUsuario)) ?? {
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
}

async function logout(req, res, ctx) {
  const { cors } = ctx;
  const cookie = serializeCookie("session", "", {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    maxAge: 0,
  });
  json(res, 200, { success: true }, { ...cors, "Set-Cookie": cookie });
}

async function me(req, res, ctx) {
  const { cors } = ctx;
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
}

export const handlers = {
  register,
  "send-token": sendToken,
  "verify-token": verifyToken,
  logout,
  me,
};
