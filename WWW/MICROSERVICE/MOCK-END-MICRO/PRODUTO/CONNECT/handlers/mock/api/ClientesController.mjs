import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENTES_FILE = path.resolve(__dirname, "..", "..", "..", "data", "clientes", "clientes.json");

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
  const rawMeusDados = obj.meus_dados && typeof obj.meus_dados === "object" ? obj.meus_dados : null;
  const enderecos = Array.isArray(obj.enderecos) ? obj.enderecos : [];
  const rawPrivacidade = obj.privacidade && typeof obj.privacidade === "object" ? obj.privacidade : null;

  if (!rawMeusDados) return { meus_dados: null, enderecos, privacidade: rawPrivacidade };

  const privacidade =
    rawPrivacidade && typeof rawPrivacidade === "object"
      ? {
          ...rawPrivacidade,
          doisFatores: normalizeDoisFatores(rawPrivacidade?.doisFatores),
        }
      : rawPrivacidade;

  return { meus_dados: rawMeusDados, enderecos, privacidade };
}

function normalizeClientesData(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeClienteItem).filter((x) => x.meus_dados);
  }

  const obj = value && typeof value === "object" ? value : {};
  const meus_dados = Array.isArray(obj.meus_dados) ? obj.meus_dados : [];
  const enderecos = Array.isArray(obj.enderecos) ? obj.enderecos : [];
  const privacidade = Array.isArray(obj.privacidade) ? obj.privacidade : [];

  return meus_dados
    .map((c) => {
      const clienteId = toInt(c?.id);
      const e = clienteId == null ? [] : enderecos.filter((x) => toInt(x?.clienteId) === clienteId);
      const p = clienteId == null ? null : privacidade.find((x) => toInt(x?.clienteId) === clienteId) ?? null;
      return normalizeClienteItem({ meus_dados: c, enderecos: e, privacidade: p });
    })
    .filter((x) => x.meus_dados);
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
  const { senha, doisFatores, ...rest } = cliente;
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

function sanitizeEnderecoPatch(value) {
  const obj = value && typeof value === "object" && !Array.isArray(value) ? value : null;
  if (!obj) return null;

  const out = {};

  if ("rotulo" in obj) out.rotulo = String(obj.rotulo ?? "").trim() || undefined;
  if ("principal" in obj) out.principal = obj.principal == null ? undefined : Boolean(obj.principal);
  if ("cep" in obj) out.cep = String(obj.cep ?? "").trim();
  if ("logradouro" in obj) out.logradouro = String(obj.logradouro ?? "").trim();
  if ("numero" in obj) out.numero = String(obj.numero ?? "").trim();
  if ("complemento" in obj) out.complemento = String(obj.complemento ?? "").trim() || undefined;
  if ("bairro" in obj) out.bairro = String(obj.bairro ?? "").trim();
  if ("cidade" in obj) out.cidade = String(obj.cidade ?? "").trim();
  if ("uf" in obj) out.uf = String(obj.uf ?? "").trim().toUpperCase();
  if ("pais" in obj) out.pais = String(obj.pais ?? "").trim() || "BR";
  if ("referencia" in obj) out.referencia = String(obj.referencia ?? "").trim() || undefined;

  return out;
}

function ensureEnderecoComplete(value) {
  const obj = value && typeof value === "object" && !Array.isArray(value) ? value : null;
  if (!obj) return false;
  const cep = String(obj.cep ?? "").trim();
  const logradouro = String(obj.logradouro ?? "").trim();
  const numero = String(obj.numero ?? "").trim();
  const bairro = String(obj.bairro ?? "").trim();
  const cidade = String(obj.cidade ?? "").trim();
  const uf = String(obj.uf ?? "").trim();
  return Boolean(cep && logradouro && numero && bairro && cidade && uf);
}

function sanitizeMeusDadosPatch(value) {
  const obj = value && typeof value === "object" && !Array.isArray(value) ? value : null;
  if (!obj) return null;
  const out = {};

  if ("tipoPessoa" in obj) {
    const t = normalizePessoaTipo(obj.tipoPessoa);
    if (t) out.tipoPessoa = t;
  }
  if ("documento" in obj) out.documento = String(obj.documento ?? "").trim();
  if ("nome" in obj) out.nome = String(obj.nome ?? "").trim();
  if ("nomeFantasia" in obj) out.nomeFantasia = String(obj.nomeFantasia ?? "").trim();
  if ("email" in obj) out.email = normalizeEmail(obj.email);
  if ("whatsapp" in obj) out.whatsapp = String(obj.whatsapp ?? "").trim();
  if ("status" in obj) {
    const s = String(obj.status ?? "").trim().toLowerCase();
    if (s === "ativo" || s === "inativo") out.status = s;
  }

  return out;
}

function sanitizePrivacidadePatch(value) {
  const obj = value && typeof value === "object" && !Array.isArray(value) ? value : null;
  if (!obj) return null;
  const out = {};

  if ("aceitaMarketing" in obj) out.aceitaMarketing = Boolean(obj.aceitaMarketing);
  if ("aceitaTermos" in obj) out.aceitaTermos = Boolean(obj.aceitaTermos);
  if ("aceitaCookies" in obj) out.aceitaCookies = obj.aceitaCookies == null ? undefined : Boolean(obj.aceitaCookies);
  if ("canalPreferido" in obj) out.canalPreferido = String(obj.canalPreferido ?? "").trim() || undefined;
  if ("doisFatores" in obj) out.doisFatores = normalizeDoisFatores(obj.doisFatores);

  return out;
}

function findItemByClienteId(data, clienteId) {
  const id = toInt(clienteId);
  if (id == null) return { index: -1, item: null, id: null };
  const index = data.findIndex((x) => toInt(x?.meus_dados?.id) === id);
  return { index, item: index >= 0 ? data[index] : null, id };
}

export class ClientesController {
  async login(email, senha) {
    const emailKey = normalizeEmail(email);
    const senhaKey = String(senha ?? "");
    if (!emailKey || !senhaKey) {
      return { ok: false, status: 400, error: "invalid_payload" };
    }

    const data = await loadClientes();
    const item = data.find((x) => normalizeEmail(x?.meus_dados?.email) === emailKey) ?? null;
    const found = item?.meus_dados ?? null;

    if (!found) return { ok: false, status: 401, error: "invalid_credentials" };

    const status = String(found?.status ?? "").trim().toLowerCase();
    if (status !== "ativo") return { ok: false, status: 403, error: "account_inactive" };

    const storedSenha = String(found?.senha ?? "");
    if (storedSenha !== senhaKey) return { ok: false, status: 401, error: "invalid_credentials" };

    const clienteId = toInt(found?.id);
    if (clienteId == null) return { ok: false, status: 401, error: "invalid_credentials" };

    const enderecos = Array.isArray(item?.enderecos) ? item.enderecos : [];
    const privacidadeBase = item?.privacidade && typeof item.privacidade === "object" ? item.privacidade : null;
    const privacidade = privacidadeBase
      ? {
          ...privacidadeBase,
          doisFatores: normalizeDoisFatores(privacidadeBase?.doisFatores),
        }
      : null;

    return {
      ok: true,
      data: {
        meus_dados: sanitizeCliente(found),
        enderecos,
        privacidade,
        token: `mock-client-token-${clienteId}-${Date.now()}`,
      },
    };
  }

  async cadastro(payload) {
    const obj = payload && typeof payload === "object" ? payload : null;
    if (!obj) return { ok: false, status: 400, error: "invalid_payload" };

    const dadosIn = obj.meus_dados && typeof obj.meus_dados === "object" ? obj.meus_dados : null;
    if (!dadosIn) return { ok: false, status: 400, error: "invalid_payload" };

    const tipoPessoa = normalizePessoaTipo(dadosIn.tipoPessoa);
    const documento = String(dadosIn.documento ?? "").trim();
    const nome = String(dadosIn.nome ?? "").trim();
    const nomeFantasia = String(dadosIn.nomeFantasia ?? "").trim();
    const email = normalizeEmail(dadosIn.email);
    const whatsapp = String(dadosIn.whatsapp ?? "").trim();
    const senha = String(dadosIn.senha ?? "");
    const status = String(dadosIn.status ?? "ativo").trim().toLowerCase() || "ativo";

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

    if (data.some((x) => normalizeEmail(x?.meus_dados?.email) === email)) {
      return { ok: false, status: 409, error: "email_already_exists" };
    }
    if (data.some((x) => String(x?.meus_dados?.documento ?? "").trim() === documento)) {
      return { ok: false, status: 409, error: "documento_already_exists" };
    }

    const id = nextId(data, (x) => x?.meus_dados?.id);
    const createdAt = new Date().toISOString();

    const novoCliente = {
      id,
      tipoPessoa,
      documento,
      nome,
      ...(tipoPessoa === "PJ" ? { nomeFantasia } : {}),
      email,
      whatsapp,
      senha,
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

    const doisFatores = normalizeDoisFatores(p?.doisFatores);
    privacidadeCriada = {
      clienteId: id,
      aceitaMarketing: Boolean(p.aceitaMarketing),
      aceitaTermos: Boolean(p.aceitaTermos),
      aceitaCookies: p.aceitaCookies == null ? undefined : Boolean(p.aceitaCookies),
      canalPreferido: String(p.canalPreferido ?? "").trim() || undefined,
      doisFatores,
      updatedAt: new Date().toISOString(),
    };

    const nextData = [...data, { meus_dados: novoCliente, enderecos: enderecosCriados, privacidade: privacidadeCriada }];

    await saveClientes(nextData);

    return {
      ok: true,
      data: {
        meus_dados: sanitizeCliente(novoCliente),
        enderecos: enderecosCriados,
        privacidade: privacidadeCriada,
      },
    };
  }

  async updateMeusDados({ clienteId, patch }) {
    const data = await loadClientes();
    const found = findItemByClienteId(data, clienteId);
    if (!found.item) return { ok: false, status: 404, error: "not_found" };

    const sanitizedPatch = sanitizeMeusDadosPatch(patch);
    if (!sanitizedPatch) return { ok: false, status: 400, error: "invalid_payload" };

    const nextMeusDados = { ...(found.item.meus_dados ?? {}), ...sanitizedPatch };
    if ("senha" in sanitizedPatch) delete nextMeusDados.senha;
    if ("id" in sanitizedPatch) delete nextMeusDados.id;
    if ("createdAt" in sanitizedPatch) delete nextMeusDados.createdAt;

    const nextItem = { ...found.item, meus_dados: nextMeusDados };
    const nextData = [...data];
    nextData[found.index] = nextItem;
    await saveClientes(nextData);

    return {
      ok: true,
      data: {
        meus_dados: sanitizeCliente(nextItem.meus_dados),
        enderecos: Array.isArray(nextItem.enderecos) ? nextItem.enderecos : [],
        privacidade: nextItem.privacidade ?? null,
      },
    };
  }

  async updatePrivacidade({ clienteId, patch }) {
    const data = await loadClientes();
    const found = findItemByClienteId(data, clienteId);
    if (!found.item) return { ok: false, status: 404, error: "not_found" };

    const sanitizedPatch = sanitizePrivacidadePatch(patch);
    if (!sanitizedPatch) return { ok: false, status: 400, error: "invalid_payload" };

    const base = found.item.privacidade && typeof found.item.privacidade === "object" ? found.item.privacidade : {};
    const nextPrivacidade = {
      ...base,
      ...sanitizedPatch,
      clienteId: found.id,
      updatedAt: new Date().toISOString(),
    };
    if (!nextPrivacidade.doisFatores) {
      nextPrivacidade.doisFatores = normalizeDoisFatores(null);
    }

    const nextItem = { ...found.item, privacidade: nextPrivacidade };
    const nextData = [...data];
    nextData[found.index] = nextItem;
    await saveClientes(nextData);

    return {
      ok: true,
      data: {
        privacidade: nextPrivacidade,
      },
    };
  }

  async listEnderecos({ clienteId }) {
    const data = await loadClientes();
    const found = findItemByClienteId(data, clienteId);
    if (!found.item) return { ok: false, status: 404, error: "not_found" };
    const enderecos = Array.isArray(found.item.enderecos) ? found.item.enderecos : [];
    return { ok: true, data: enderecos };
  }

  async createEndereco({ clienteId, endereco }) {
    const data = await loadClientes();
    const found = findItemByClienteId(data, clienteId);
    if (!found.item) return { ok: false, status: 404, error: "not_found" };

    const sanitized = sanitizeEnderecoInput(endereco);
    if (!sanitized) return { ok: false, status: 400, error: "invalid_payload" };

    const nextEnderecoId = nextId(listEnderecos(data), (x) => x?.id);
    const created = {
      id: nextEnderecoId,
      clienteId: found.id,
      ...sanitized,
    };

    const enderecos = Array.isArray(found.item.enderecos) ? found.item.enderecos : [];
    const nextItem = { ...found.item, enderecos: [...enderecos, created] };
    const nextData = [...data];
    nextData[found.index] = nextItem;
    await saveClientes(nextData);

    return { ok: true, data: nextItem.enderecos };
  }

  async updateEndereco({ enderecoId, clienteId, patch }) {
    const enderecoKey = toInt(enderecoId);
    if (enderecoKey == null) return { ok: false, status: 400, error: "invalid_payload" };

    const data = await loadClientes();
    const patchObj = sanitizeEnderecoPatch(patch);
    if (!patchObj) return { ok: false, status: 400, error: "invalid_payload" };

    let targetIndex = -1;
    let itemIndex = -1;
    for (let i = 0; i < data.length; i += 1) {
      const e = Array.isArray(data[i]?.enderecos) ? data[i].enderecos : [];
      const idx = e.findIndex((x) => toInt(x?.id) === enderecoKey);
      if (idx >= 0) {
        itemIndex = i;
        targetIndex = idx;
        break;
      }
    }

    if (itemIndex < 0 || targetIndex < 0) return { ok: false, status: 404, error: "not_found" };

    const item = data[itemIndex];
    const enderecos = Array.isArray(item.enderecos) ? item.enderecos : [];
    const current = enderecos[targetIndex];

    if (clienteId != null && toInt(current?.clienteId) !== toInt(clienteId)) {
      return { ok: false, status: 404, error: "not_found" };
    }

    const merged = { ...current, ...patchObj };
    if (!ensureEnderecoComplete(merged)) return { ok: false, status: 400, error: "invalid_payload" };

    const nextEnderecos = [...enderecos];
    nextEnderecos[targetIndex] = merged;
    const nextItem = { ...item, enderecos: nextEnderecos };
    const nextData = [...data];
    nextData[itemIndex] = nextItem;
    await saveClientes(nextData);

    return { ok: true, data: nextEnderecos };
  }

  async deleteEndereco({ enderecoId, clienteId }) {
    const enderecoKey = toInt(enderecoId);
    if (enderecoKey == null) return { ok: false, status: 400, error: "invalid_payload" };

    const data = await loadClientes();

    let itemIndex = -1;
    let targetIndex = -1;
    for (let i = 0; i < data.length; i += 1) {
      const e = Array.isArray(data[i]?.enderecos) ? data[i].enderecos : [];
      const idx = e.findIndex((x) => toInt(x?.id) === enderecoKey);
      if (idx >= 0) {
        itemIndex = i;
        targetIndex = idx;
        break;
      }
    }

    if (itemIndex < 0 || targetIndex < 0) return { ok: false, status: 404, error: "not_found" };

    const item = data[itemIndex];
    const enderecos = Array.isArray(item.enderecos) ? item.enderecos : [];
    const current = enderecos[targetIndex];

    if (clienteId != null && toInt(current?.clienteId) !== toInt(clienteId)) {
      return { ok: false, status: 404, error: "not_found" };
    }

    const nextEnderecos = enderecos.filter((x) => toInt(x?.id) !== enderecoKey);
    const nextItem = { ...item, enderecos: nextEnderecos };
    const nextData = [...data];
    nextData[itemIndex] = nextItem;
    await saveClientes(nextData);

    return { ok: true, data: nextEnderecos };
  }
}
