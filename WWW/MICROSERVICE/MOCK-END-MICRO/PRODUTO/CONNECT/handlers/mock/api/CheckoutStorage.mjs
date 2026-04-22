import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { withFileLock, writeJsonAtomic } from "../../../../../lib/json-store.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCT_DIR = path.resolve(__dirname, "..", "..", "..");
const CHECKOUT_DIR = path.resolve(PRODUCT_DIR, "data", "checkout", "CHECKOUT");
const INDEX_FILE = path.resolve(CHECKOUT_DIR, "_index.json");
const CONFIG_FILE = path.resolve(PRODUCT_DIR, "data", "checkout", "checkout.json");

const DEFAULT_CONFIG = {
  meta: { version: 2, updatedAt: "2026-01-01T00:00:00.000Z" },
  seq: { carrinhoId: 1, itemId: 1, checkoutId: 1, pedidoId: 1, pagamentoId: 1 },
  config: {
    moeda: "BRL",
    frete: { opcoes: [] },
    cupons: [],
    pagamentos: { metodos: ["pix"] },
  },
};

const DEFAULT_INDEX = {
  checkoutById: {},
  pedidoById: {},
};

function nowIso() {
  return new Date().toISOString();
}

function isRecord(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function toInt(value) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

async function safeReadJson(filePath, fallback, label) {
  let raw = "";
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    const code = String(err?.code ?? "");
    if (code !== "ENOENT") {
      process.stderr.write(
        `[mock-end] ${label} nao conseguiu ler arquivo (${filePath}): ${String(err?.message ?? err)}\n`
      );
    }
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} JSON invalido (${filePath}): ${String(err?.message ?? err)}\n`
    );
    return fallback;
  }
}

function normalizeConfig(value) {
  const src = isRecord(value) ? value : {};
  const seq = isRecord(src.seq) ? src.seq : {};
  const config = isRecord(src.config) ? src.config : {};
  const frete = isRecord(config.frete) ? config.frete : {};
  const pagamentos = isRecord(config.pagamentos) ? config.pagamentos : {};

  return {
    meta: {
      version: toInt(src?.meta?.version) ?? 2,
      updatedAt: String(src?.meta?.updatedAt ?? DEFAULT_CONFIG.meta.updatedAt),
    },
    seq: {
      carrinhoId: Math.max(1, toInt(seq?.carrinhoId) ?? 1),
      itemId: Math.max(1, toInt(seq?.itemId) ?? 1),
      checkoutId: Math.max(1, toInt(seq?.checkoutId) ?? 1),
      pedidoId: Math.max(1, toInt(seq?.pedidoId) ?? 1),
      pagamentoId: Math.max(1, toInt(seq?.pagamentoId) ?? 1),
    },
    config: {
      moeda: String(config.moeda ?? "BRL"),
      frete: {
        opcoes: Array.isArray(frete.opcoes) ? frete.opcoes : [],
      },
      cupons: Array.isArray(config.cupons) ? config.cupons : [],
      pagamentos: {
        metodos: Array.isArray(pagamentos.metodos) ? pagamentos.metodos : ["pix"],
      },
    },
  };
}

function normalizeIndex(value) {
  const src = isRecord(value) ? value : {};
  const checkoutById = isRecord(src.checkoutById) ? src.checkoutById : {};
  const pedidoById = isRecord(src.pedidoById) ? src.pedidoById : {};
  return { checkoutById, pedidoById };
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function clienteDir(clienteId) {
  const cid = toInt(clienteId);
  if (cid == null || cid < 1) return null;
  return path.resolve(CHECKOUT_DIR, String(cid));
}

function carrinhoFile(clienteId) {
  const dir = clienteDir(clienteId);
  if (!dir) return null;
  return path.resolve(dir, "carrinho.json");
}

function transacoesDir(clienteId) {
  const dir = clienteDir(clienteId);
  if (!dir) return null;
  return path.resolve(dir, "transacoes");
}

function transacaoFile(clienteId, checkoutId) {
  const dir = transacoesDir(clienteId);
  const chk = toInt(checkoutId);
  if (!dir || chk == null || chk < 1) return null;
  return path.resolve(dir, `${chk}.json`);
}

export class CheckoutStorage {
  async ensureBase() {
    await ensureDir(CHECKOUT_DIR);
    await ensureDir(path.dirname(INDEX_FILE));
    const current = await safeReadJson(INDEX_FILE, null, "checkout/index");
    if (!current) {
      await writeJsonAtomic(INDEX_FILE, DEFAULT_INDEX);
    }
  }

  async getConfig() {
    const raw = await safeReadJson(CONFIG_FILE, DEFAULT_CONFIG, "checkout/config");
    return normalizeConfig(raw);
  }

  async saveConfig(nextConfig) {
    return withFileLock(CONFIG_FILE, async () => {
      const normalized = normalizeConfig(nextConfig);
      normalized.meta.updatedAt = nowIso();
      await writeJsonAtomic(CONFIG_FILE, normalized);
      return normalized;
    });
  }

  async nextSeq(key) {
    const seqKey = String(key ?? "").trim();
    if (!seqKey) throw new Error("missing_seq_key");
    return withFileLock(CONFIG_FILE, async () => {
      const current = normalizeConfig(await safeReadJson(CONFIG_FILE, DEFAULT_CONFIG, "checkout/config"));
      const value = Math.max(1, toInt(current.seq?.[seqKey]) ?? 1);
      current.seq[seqKey] = value + 1;
      current.meta.updatedAt = nowIso();
      await writeJsonAtomic(CONFIG_FILE, current);
      return value;
    });
  }

  async getIndex() {
    await this.ensureBase();
    const raw = await safeReadJson(INDEX_FILE, DEFAULT_INDEX, "checkout/index");
    return normalizeIndex(raw);
  }

  async saveIndex(nextIndex) {
    await this.ensureBase();
    return withFileLock(INDEX_FILE, async () => {
      const normalized = normalizeIndex(nextIndex);
      await writeJsonAtomic(INDEX_FILE, normalized);
      return normalized;
    });
  }

  async setCheckoutIndex(checkoutId, clienteId) {
    const chk = toInt(checkoutId);
    const cid = toInt(clienteId);
    if (chk == null || cid == null) throw new Error("invalid_index_payload");
    await this.ensureBase();
    return withFileLock(INDEX_FILE, async () => {
      const idx = normalizeIndex(await safeReadJson(INDEX_FILE, DEFAULT_INDEX, "checkout/index"));
      idx.checkoutById[String(chk)] = { clienteId: cid };
      await writeJsonAtomic(INDEX_FILE, idx);
      return idx;
    });
  }

  async setPedidoIndex(pedidoId, clienteId, checkoutId) {
    const pid = toInt(pedidoId);
    const cid = toInt(clienteId);
    const chk = toInt(checkoutId);
    if (pid == null || cid == null || chk == null) throw new Error("invalid_index_payload");
    await this.ensureBase();
    return withFileLock(INDEX_FILE, async () => {
      const idx = normalizeIndex(await safeReadJson(INDEX_FILE, DEFAULT_INDEX, "checkout/index"));
      idx.pedidoById[String(pid)] = { clienteId: cid, checkoutId: chk };
      await writeJsonAtomic(INDEX_FILE, idx);
      return idx;
    });
  }

  async resolveCheckoutCliente(checkoutId) {
    const chk = toInt(checkoutId);
    if (chk == null) return null;
    const idx = await this.getIndex();
    const entry = idx.checkoutById?.[String(chk)] ?? null;
    const cid = toInt(entry?.clienteId);
    return cid == null ? null : cid;
  }

  async resolvePedidoEntry(pedidoId) {
    const pid = toInt(pedidoId);
    if (pid == null) return null;
    const idx = await this.getIndex();
    const entry = idx.pedidoById?.[String(pid)] ?? null;
    const cid = toInt(entry?.clienteId);
    const chk = toInt(entry?.checkoutId);
    if (cid == null || chk == null) return null;
    return { clienteId: cid, checkoutId: chk };
  }

  async readCarrinho(clienteId) {
    const file = carrinhoFile(clienteId);
    if (!file) return null;
    return safeReadJson(file, null, "checkout/carrinho");
  }

  async writeCarrinho(clienteId, data) {
    const file = carrinhoFile(clienteId);
    const dir = clienteDir(clienteId);
    if (!file || !dir) throw new Error("invalid_clienteId");
    await ensureDir(dir);
    await writeJsonAtomic(file, data);
    return data;
  }

  async readTransacao(clienteId, checkoutId) {
    const file = transacaoFile(clienteId, checkoutId);
    if (!file) return null;
    return safeReadJson(file, null, "checkout/transacao");
  }

  async writeTransacao(clienteId, checkoutId, data) {
    const dir = transacoesDir(clienteId);
    const file = transacaoFile(clienteId, checkoutId);
    if (!dir || !file) throw new Error("invalid_transacao_id");
    await ensureDir(dir);
    await writeJsonAtomic(file, data);
    return data;
  }

  async listTransacoes(clienteId) {
    const dir = transacoesDir(clienteId);
    if (!dir) return [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      return entries
        .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".json"))
        .map((e) => e.name);
    } catch (err) {
      const code = String(err?.code ?? "");
      if (code === "ENOENT") return [];
      throw err;
    }
  }
}
