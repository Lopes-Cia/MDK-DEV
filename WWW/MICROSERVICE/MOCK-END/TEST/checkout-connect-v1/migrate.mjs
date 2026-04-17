import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { writeJsonAtomic } from "../../lib/json-store.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOCK_CONNECT_DIR = path.resolve(__dirname, "..", "..", "PROJETOS", "connect", "handlers", "mock");
const CONFIG_FILE = path.resolve(MOCK_CONNECT_DIR, "checkout.json");
const CHECKOUT_DIR = path.resolve(MOCK_CONNECT_DIR, "CHECKOUT");
const INDEX_FILE = path.resolve(CHECKOUT_DIR, "_index.json");

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

async function safeReadJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function run() {
  const current = await safeReadJson(CONFIG_FILE);
  const hasCarrinhos = Array.isArray(current?.carrinhos);
  const hasCheckouts = Array.isArray(current?.checkouts);
  const hasPedidos = Array.isArray(current?.pedidos);
  const hasLegacy = hasCarrinhos || hasCheckouts || hasPedidos;

  await ensureDir(CHECKOUT_DIR);
  if (!(await fileExists(INDEX_FILE))) {
    await writeJsonAtomic(INDEX_FILE, { checkoutById: {}, pedidoById: {} });
  }

  if (!hasLegacy) {
    process.stdout.write("[migrate] Nenhum layout legado detectado em checkout.json. Nada para migrar.\n");
    return;
  }

  const backupFile = path.resolve(MOCK_CONNECT_DIR, `checkout.legacy.backup.${Date.now()}.json`);
  await writeJsonAtomic(backupFile, current);
  process.stdout.write(`[migrate] Backup criado: ${backupFile}\n`);

  const index = { checkoutById: {}, pedidoById: {} };

  for (const carrinho of current.carrinhos ?? []) {
    const c = isRecord(carrinho) ? carrinho : null;
    const clienteId = toInt(c?.clienteId);
    if (!clienteId) continue;
    const clienteDir = path.resolve(CHECKOUT_DIR, String(clienteId));
    await ensureDir(clienteDir);
    await writeJsonAtomic(path.resolve(clienteDir, "carrinho.json"), c);
  }

  for (const checkout of current.checkouts ?? []) {
    const chk = isRecord(checkout) ? checkout : null;
    const checkoutId = toInt(chk?.checkoutId);
    const clienteId = toInt(chk?.clienteId);
    const carrinhoId = toInt(chk?.carrinhoId);
    if (!checkoutId || !clienteId) continue;

    const transDir = path.resolve(CHECKOUT_DIR, String(clienteId), "transacoes");
    await ensureDir(transDir);
    const trans = {
      checkoutId,
      clienteId,
      carrinhoId,
      checkout: chk,
      pedido: null,
    };
    await writeJsonAtomic(path.resolve(transDir, `${checkoutId}.json`), trans);
    index.checkoutById[String(checkoutId)] = { clienteId };
  }

  for (const pedido of current.pedidos ?? []) {
    const p = isRecord(pedido) ? pedido : null;
    const pedidoId = toInt(p?.pedidoId);
    const clienteId = toInt(p?.clienteId);
    const checkoutId = toInt(p?.checkoutId);
    if (!pedidoId || !clienteId || !checkoutId) continue;

    const transFile = path.resolve(CHECKOUT_DIR, String(clienteId), "transacoes", `${checkoutId}.json`);
    const existing = (await fileExists(transFile)) ? await safeReadJson(transFile) : null;
    const trans = isRecord(existing) ? existing : { checkoutId, clienteId, carrinhoId: null, checkout: null, pedido: null };
    trans.pedido = p;
    await writeJsonAtomic(transFile, trans);
    index.pedidoById[String(pedidoId)] = { clienteId, checkoutId };
  }

  await writeJsonAtomic(INDEX_FILE, index);

  const nextConfig = {
    meta: {
      version: 2,
      updatedAt: nowIso(),
    },
    seq: isRecord(current.seq) ? current.seq : { carrinhoId: 1, itemId: 1, checkoutId: 1, pedidoId: 1, pagamentoId: 1 },
    config: isRecord(current.config) ? current.config : {},
  };

  await writeJsonAtomic(CONFIG_FILE, nextConfig);
  process.stdout.write("[migrate] Migracao concluida. checkout.json agora contem apenas meta/seq/config.\n");
}

run().catch((err) => {
  process.stderr.write(`[migrate] Erro: ${String(err?.message ?? err)}\n`);
  process.exitCode = 1;
});

