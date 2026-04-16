import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENTES_FILE = path.resolve(__dirname, "..", "clientes.json");

let clientesCache = null;

async function readJsonFile(filePath, label) {
  let raw = "[]";
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} não conseguiu ler arquivo (${filePath}): ${String(err?.message ?? err)}\n`
    );
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} JSON inválido (${filePath}): ${String(err?.message ?? err)}\n`
    );
    return {};
  }
}

function normalizeClienteItem(value) {
  const obj = value && typeof value === "object" ? value : {};
  const cliente = obj.cliente && typeof obj.cliente === "object" ? obj.cliente : null;
  const enderecos = Array.isArray(obj.enderecos) ? obj.enderecos : [];
  const privacidade = obj.privacidade && typeof obj.privacidade === "object" ? obj.privacidade : null;
  return { cliente, enderecos, privacidade };
}

function normalizeClientesData(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeClienteItem).filter((x) => x.cliente);
  }

  const obj = value && typeof value === "object" ? value : {};
  const cliente = Array.isArray(obj.cliente) ? obj.cliente : [];
  const enderecos = Array.isArray(obj.enderecos) ? obj.enderecos : [];
  const privacidade = Array.isArray(obj.privacidade) ? obj.privacidade : [];

  return cliente
    .map((c) => {
      const clienteId = toInt(c?.id);
      const e = clienteId == null ? [] : enderecos.filter((x) => toInt(x?.clienteId) === clienteId);
      const p = clienteId == null ? null : privacidade.find((x) => toInt(x?.clienteId) === clienteId) ?? null;
      return { cliente: c, enderecos: e, privacidade: p };
    })
    .filter((x) => x.cliente);
}

async function loadClientes() {
  if (clientesCache) return clientesCache;
  const parsed = await readJsonFile(CLIENTES_FILE, "mock/clientes(clientes)");
  clientesCache = normalizeClientesData(parsed);
  return clientesCache;
}

async function saveClientes(data) {
  const normalized = normalizeClientesData(data);
  clientesCache = normalized;
  await fs.writeFile(CLIENTES_FILE, JSON.stringify(normalized, null, 2) + "\n", "utf8");
  return normalized;
}

function toInt(value) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function sanitizeCliente(cliente) {
  if (!cliente || typeof cliente !== "object") return null;
  const { senha, ...rest } = cliente;
  return rest;
}

function nextId(items, getter) {
  const ids = items
    .map((x) => toInt(getter(x)))
    .filter((n) => n != null);
  const max = ids.length ? Math.max(...ids) : 0;
  return max + 1;
}

function listEnderecos(items) {
  return items.flatMap((x) => (Array.isArray(x?.enderecos) ? x.enderecos : []));
}

function normalizePessoaTipo(tipoPessoa) {
  const t = String(tipoPessoa ?? "").trim().toUpperCase();
  return t === "PF" || t === "PJ" ? t : "";
}

function normalizeDoisFatores(value) {
  const obj = value && typeof value === "object" ? value : {};
  const habilitado = Boolean(obj.habilitado);
  const metodo = String(obj.metodo ?? "").trim().toLowerCase();
  const m = metodo === "whatsapp" || metodo === "email" ? metodo : "email";
  return { habilitado, metodo: m };
}

function sanitizeEnderecoInput(value) {
  const obj = value && typeof value === "object" ? value : null;
  if (!obj) return null;
  const cep = String(obj.cep ?? "").trim();
  const logradouro = String(obj.logradouro ?? "").trim();
  const numero = String(obj.numero ?? "").trim();
  const bairro = String(obj.bairro ?? "").trim();
  const cidade = String(obj.cidade ?? "").trim();
  const uf = String(obj.uf ?? "").trim().toUpperCase();
  if (!cep || !logradouro || !numero || !bairro || !cidade || !uf) return null;
  return {
    rotulo: String(obj.rotulo ?? "").trim() || undefined,
    principal: obj.principal == null ? undefined : Boolean(obj.principal),
    cep,
    logradouro,
    numero,
    complemento: String(obj.complemento ?? "").trim() || undefined,
    bairro,
    cidade,
    uf,
    pais: String(obj.pais ?? "").trim() || "BR",
    referencia: String(obj.referencia ?? "").trim() || undefined,
  };
}

export class ClientesController {
  async login(email, senha) {
    const emailKey = normalizeEmail(email);
    const senhaKey = String(senha ?? "");
    if (!emailKey || !senhaKey) {
      return { ok: false, status: 400, error: "invalid_payload" };
    }

    const data = await loadClientes();
    const item = data.find((x) => normalizeEmail(x?.cliente?.email) === emailKey) ?? null;
    const found = item?.cliente ?? null;

    if (!found) return { ok: false, status: 401, error: "invalid_credentials" };

    const status = String(found?.status ?? "").trim().toLowerCase();
    if (status !== "ativo") return { ok: false, status: 403, error: "account_inactive" };

    const storedSenha = String(found?.senha ?? "");
    if (storedSenha !== senhaKey) return { ok: false, status: 401, error: "invalid_credentials" };

    const clienteId = toInt(found?.id);
    if (clienteId == null) return { ok: false, status: 401, error: "invalid_credentials" };

    const enderecos = Array.isArray(item?.enderecos) ? item.enderecos : [];
    const privacidade = item?.privacidade && typeof item.privacidade === "object" ? item.privacidade : null;

    return {
      ok: true,
      data: {
        cliente: sanitizeCliente(found),
        enderecos,
        privacidade,
        token: `mock-client-token-${clienteId}-${Date.now()}`,
      },
    };
  }

  async cadastro(payload) {
    const obj = payload && typeof payload === "object" ? payload : null;
    if (!obj) return { ok: false, status: 400, error: "invalid_payload" };

    const tipoPessoa = normalizePessoaTipo(obj.tipoPessoa);
    const documento = String(obj.documento ?? "").trim();
    const nome = String(obj.nome ?? "").trim();
    const nomeFantasia = String(obj.nomeFantasia ?? "").trim();
    const email = normalizeEmail(obj.email);
    const whatsapp = String(obj.whatsapp ?? "").trim();
    const senha = String(obj.senha ?? "");
    const status = String(obj.status ?? "ativo").trim().toLowerCase() || "ativo";

    if (!tipoPessoa || !documento || !nome || !email || !whatsapp || !senha) {
      return { ok: false, status: 400, error: "invalid_payload" };
    }
    if (tipoPessoa === "PJ" && !nomeFantasia) {
      return { ok: false, status: 400, error: "invalid_payload" };
    }
    if (status !== "ativo" && status !== "inativo") {
      return { ok: false, status: 400, error: "invalid_payload" };
    }

    const data = await loadClientes();

    if (data.some((x) => normalizeEmail(x?.cliente?.email) === email)) {
      return { ok: false, status: 409, error: "email_already_exists" };
    }
    if (data.some((x) => String(x?.cliente?.documento ?? "").trim() === documento)) {
      return { ok: false, status: 409, error: "documento_already_exists" };
    }

    const id = nextId(data, (x) => x?.cliente?.id);
    const createdAt = new Date().toISOString();
    const doisFatores = normalizeDoisFatores(obj.doisFatores);

    const novoCliente = {
      id,
      tipoPessoa,
      documento,
      nome,
      ...(tipoPessoa === "PJ" ? { nomeFantasia } : {}),
      email,
      whatsapp,
      senha,
      doisFatores,
      status,
      createdAt,
    };

    const enderecosIn = obj.enderecos;
    const privacidadeIn = obj.privacidade;

    let enderecosCriados = [];
    if (!Array.isArray(enderecosIn) || enderecosIn.length === 0) {
      return { ok: false, status: 400, error: "invalid_payload" };
    }
    let nextEnderecoId = nextId(listEnderecos(data), (x) => x?.id);
    for (const item of enderecosIn) {
      const sanitized = sanitizeEnderecoInput(item);
      if (!sanitized) return { ok: false, status: 400, error: "invalid_payload" };
      enderecosCriados.push({
        id: nextEnderecoId++,
        clienteId: id,
        ...sanitized,
      });
    }

    let privacidadeCriada = null;
    const p = privacidadeIn && typeof privacidadeIn === "object" ? privacidadeIn : null;
    if (!p) return { ok: false, status: 400, error: "invalid_payload" };
    privacidadeCriada = {
      clienteId: id,
      aceitaMarketing: Boolean(p.aceitaMarketing),
      aceitaTermos: Boolean(p.aceitaTermos),
      aceitaCookies: p.aceitaCookies == null ? undefined : Boolean(p.aceitaCookies),
      canalPreferido: String(p.canalPreferido ?? "").trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    const nextData = [...data, { cliente: novoCliente, enderecos: enderecosCriados, privacidade: privacidadeCriada }];

    await saveClientes(nextData);

    return {
      ok: true,
      data: {
        cliente: sanitizeCliente(novoCliente),
        enderecos: enderecosCriados,
        privacidade: privacidadeCriada,
      },
    };
  }
}
