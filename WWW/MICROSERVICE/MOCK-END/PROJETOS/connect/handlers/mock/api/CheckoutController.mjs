import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CheckoutStorage } from "./CheckoutStorage.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUTOS_FILE = path.resolve(__dirname, "..", "produtos.json");

let produtosCache = null;

const storage = new CheckoutStorage();

async function readJsonFile(filePath, label, fallback) {
  let raw = JSON.stringify(fallback);
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} nao conseguiu ler arquivo (${filePath}): ${String(err?.message ?? err)}\n`
    );
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} JSON invalido (${filePath}): ${String(err?.message ?? err)}\n`
    );
    return fallback;
  }
}

function toInt(value) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function toNumber(value, fallback = 0) {
  const n = Number(String(value ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function loadProdutos() {
  if (produtosCache) return produtosCache;
  const parsed = await readJsonFile(PRODUTOS_FILE, "mock/checkout(produtos)", []);
  produtosCache = Array.isArray(parsed) ? parsed : [];
  return produtosCache;
}

function normalizeQuantidade(value) {
  const qty = toInt(value);
  return qty == null || qty < 1 ? null : qty;
}

function computeDiscount(subtotal, cupom) {
  if (!cupom || typeof cupom !== "object") return 0;
  const tipo = String(cupom.tipo ?? "").trim().toLowerCase();
  const valor = toNumber(cupom.valor, 0);
  if (valor <= 0) return 0;
  if (tipo === "percent") {
    return Math.max(0, Math.min(subtotal, (subtotal * valor) / 100));
  }
  if (tipo === "fixed") {
    return Math.max(0, Math.min(subtotal, valor));
  }
  return 0;
}

function computeResumoFromItens(itens, cupom, frete, moeda = "BRL") {
  const list = Array.isArray(itens) ? itens : [];
  const subtotal = list.reduce((acc, item) => acc + toNumber(item?.subtotal, 0), 0);
  const totalItens = list.reduce((acc, item) => acc + (toInt(item?.quantidade) ?? 0), 0);
  const desconto = computeDiscount(subtotal, cupom);
  const freteValor = toNumber(frete, 0);
  const total = Math.max(0, subtotal - desconto + freteValor);
  return { subtotal, desconto, frete: freteValor, total, totalItens, moeda };
}

function sanitizeEndereco(value) {
  const obj = value && typeof value === "object" && !Array.isArray(value) ? value : null;
  if (!obj) return null;
  const cep = String(obj.cep ?? "").trim();
  const logradouro = String(obj.logradouro ?? "").trim();
  const numero = String(obj.numero ?? "").trim();
  const bairro = String(obj.bairro ?? "").trim();
  const cidade = String(obj.cidade ?? "").trim();
  const uf = String(obj.uf ?? "").trim().toUpperCase();
  if (!cep || !logradouro || !numero || !bairro || !cidade || !uf) return null;
  return {
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

function sanitizeContatoPatch(value) {
  const obj = value && typeof value === "object" && !Array.isArray(value) ? value : null;
  if (!obj) return null;
  const out = {};
  if ("nome" in obj) out.nome = String(obj.nome ?? "").trim();
  if ("email" in obj) out.email = String(obj.email ?? "").trim().toLowerCase();
  if ("telefone" in obj) out.telefone = String(obj.telefone ?? "").trim();
  return out;
}

function paginate(items, { page, pageSize }) {
  const total = items.length;
  const offset = (page - 1) * pageSize;
  const data = items.slice(offset, offset + pageSize);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return { data, page, pageSize, total, totalPages };
}

function newEmptyCarrinho({ carrinhoId, clienteId, moeda }) {
  const createdAt = nowIso();
  return {
    carrinhoId,
    clienteId,
    status: "aberto",
    itens: [],
    cupom: null,
    resumo: computeResumoFromItens([], null, 0, moeda),
    createdAt,
    updatedAt: createdAt,
  };
}

function touchCarrinho(carrinho, { moeda }) {
  carrinho.resumo = computeResumoFromItens(carrinho.itens, carrinho.cupom, 0, moeda);
  carrinho.updatedAt = nowIso();
}

function touchCheckout(checkout) {
  checkout.updatedAt = nowIso();
}

export class CheckoutController {
  async getCarrinho(clienteId) {
    const cid = toInt(clienteId);
    if (cid == null) return { ok: false, status: 400, error: "invalid_payload" };

    const cfg = await storage.getConfig();
    const moeda = cfg.config?.moeda ?? "BRL";

    const existing = await storage.readCarrinho(cid);
    if (existing) {
      touchCarrinho(existing, { moeda });
      await storage.writeCarrinho(cid, existing);
      return { ok: true, data: existing };
    }

    const carrinhoId = await storage.nextSeq("carrinhoId");
    const created = newEmptyCarrinho({ carrinhoId, clienteId: cid, moeda });
    await storage.writeCarrinho(cid, created);
    return { ok: true, data: created };
  }

  async addCarrinhoItem({ clienteId, item }) {
    const cid = toInt(clienteId);
    const produtoId = toInt(item?.produtoId);
    const quantidade = normalizeQuantidade(item?.quantidade);
    if (cid == null || produtoId == null || quantidade == null) {
      return { ok: false, status: 400, error: "invalid_payload" };
    }

    const produtos = await loadProdutos();
    const produto = produtos.find((x) => toInt(x?.id) === produtoId) ?? null;
    if (!produto) return { ok: false, status: 404, error: "product_not_found" };

    const cfg = await storage.getConfig();
    const moeda = cfg.config?.moeda ?? "BRL";

    let carrinho = await storage.readCarrinho(cid);
    if (!carrinho) {
      const carrinhoId = await storage.nextSeq("carrinhoId");
      carrinho = newEmptyCarrinho({ carrinhoId, clienteId: cid, moeda });
    }

    const existing = Array.isArray(carrinho.itens)
      ? carrinho.itens.find((x) => toInt(x?.produtoId) === produtoId) ?? null
      : null;

    if (!Array.isArray(carrinho.itens)) carrinho.itens = [];

    if (existing) {
      existing.quantidade = (toInt(existing.quantidade) ?? 0) + quantidade;
      existing.subtotal = toNumber(existing.precoUnitario, 0) * existing.quantidade;
    } else {
      const precoUnitario = toNumber(produto?.price, 0);
      carrinho.itens.push({
        itemId: await storage.nextSeq("itemId"),
        produtoId,
        sku: String(produto?.sku ?? "").trim() || undefined,
        slug: String(produto?.slug ?? "").trim() || undefined,
        nome: String(produto?.name ?? "").trim() || `Produto ${produtoId}`,
        imagemUrl: String(produto?.image ?? produto?.imageUrl ?? "").trim() || undefined,
        precoUnitario,
        quantidade,
        subtotal: precoUnitario * quantidade,
        addedAt: nowIso(),
      });
    }

    touchCarrinho(carrinho, { moeda });
    await storage.writeCarrinho(cid, carrinho);
    return { ok: true, status: 201, data: carrinho };
  }

  async updateCarrinhoItem({ clienteId, itemId, patch }) {
    const cid = toInt(clienteId);
    const iid = toInt(itemId);
    const quantidade = normalizeQuantidade(patch?.quantidade);
    if (cid == null || iid == null || quantidade == null) {
      return { ok: false, status: 400, error: "invalid_payload" };
    }

    const cfg = await storage.getConfig();
    const moeda = cfg.config?.moeda ?? "BRL";

    const carrinho = await storage.readCarrinho(cid);
    if (!carrinho) return { ok: false, status: 404, error: "cart_not_found" };

    const index = Array.isArray(carrinho.itens) ? carrinho.itens.findIndex((x) => toInt(x?.itemId) === iid) : -1;
    if (index < 0) return { ok: false, status: 404, error: "item_not_found" };

    const current = carrinho.itens[index];
    current.quantidade = quantidade;
    current.subtotal = toNumber(current.precoUnitario, 0) * quantidade;

    touchCarrinho(carrinho, { moeda });
    await storage.writeCarrinho(cid, carrinho);
    return { ok: true, data: carrinho };
  }

  async deleteCarrinhoItem({ clienteId, itemId }) {
    const cid = toInt(clienteId);
    const iid = toInt(itemId);
    if (cid == null || iid == null) return { ok: false, status: 400, error: "invalid_payload" };

    const cfg = await storage.getConfig();
    const moeda = cfg.config?.moeda ?? "BRL";

    const carrinho = await storage.readCarrinho(cid);
    if (!carrinho) return { ok: false, status: 404, error: "cart_not_found" };

    const before = Array.isArray(carrinho.itens) ? carrinho.itens.length : 0;
    carrinho.itens = Array.isArray(carrinho.itens) ? carrinho.itens.filter((x) => toInt(x?.itemId) !== iid) : [];
    if (before === carrinho.itens.length) return { ok: false, status: 404, error: "item_not_found" };

    touchCarrinho(carrinho, { moeda });
    await storage.writeCarrinho(cid, carrinho);
    return { ok: true, data: carrinho };
  }

  async applyCupom({ clienteId, codigo }) {
    const cid = toInt(clienteId);
    const code = String(codigo ?? "").trim().toUpperCase();
    if (cid == null || !code) return { ok: false, status: 400, error: "invalid_payload" };

    const cfg = await storage.getConfig();
    const moeda = cfg.config?.moeda ?? "BRL";

    const carrinho = await storage.readCarrinho(cid);
    if (!carrinho) return { ok: false, status: 404, error: "cart_not_found" };

    const cupom = (cfg.config?.cupons ?? []).find((x) => String(x?.codigo ?? "").trim().toUpperCase() === code) ?? null;
    if (!cupom) return { ok: false, status: 404, error: "cupom_not_found" };

    carrinho.cupom = clone(cupom);
    touchCarrinho(carrinho, { moeda });
    await storage.writeCarrinho(cid, carrinho);
    return { ok: true, data: carrinho };
  }

  async removeCupom({ clienteId }) {
    const cid = toInt(clienteId);
    if (cid == null) return { ok: false, status: 400, error: "invalid_payload" };

    const cfg = await storage.getConfig();
    const moeda = cfg.config?.moeda ?? "BRL";

    const carrinho = await storage.readCarrinho(cid);
    if (!carrinho) return { ok: false, status: 404, error: "cart_not_found" };

    carrinho.cupom = null;
    touchCarrinho(carrinho, { moeda });
    await storage.writeCarrinho(cid, carrinho);
    return { ok: true, data: carrinho };
  }

  async createCheckoutSessao({ clienteId, contato, enderecoEntrega }) {
    const cid = toInt(clienteId);
    if (cid == null) return { ok: false, status: 400, error: "invalid_payload" };

    const cfg = await storage.getConfig();
    const moeda = cfg.config?.moeda ?? "BRL";

    const carrinho = await storage.readCarrinho(cid);
    if (!carrinho) return { ok: false, status: 404, error: "cart_not_found" };
    if (!Array.isArray(carrinho.itens) || carrinho.itens.length === 0) {
      return { ok: false, status: 409, error: "empty_cart" };
    }

    const resumoBase = computeResumoFromItens(carrinho.itens, carrinho.cupom, 0, moeda);
    const checkoutId = await storage.nextSeq("checkoutId");

    const checkout = {
      checkoutId,
      clienteId: cid,
      carrinhoId: toInt(carrinho.carrinhoId),
      snapshot: {
        itens: clone(carrinho.itens),
        cupom: clone(carrinho.cupom),
        resumoBase: {
          subtotal: resumoBase.subtotal,
          desconto: resumoBase.desconto,
          totalItens: resumoBase.totalItens,
          moeda: resumoBase.moeda,
        },
      },
      contato: {
        nome: String(contato?.nome ?? "").trim() || "",
        email: String(contato?.email ?? "").trim().toLowerCase() || "",
        telefone: String(contato?.telefone ?? "").trim() || "",
      },
      entrega: {
        endereco: sanitizeEndereco(enderecoEntrega),
        freteSelecionado: null,
      },
      pagamento: null,
      resumoFinal: {
        subtotal: resumoBase.subtotal,
        desconto: resumoBase.desconto,
        frete: 0,
        total: Math.max(0, resumoBase.subtotal - resumoBase.desconto),
        moeda: resumoBase.moeda,
      },
      status: "aberto",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    const transacao = {
      checkoutId,
      clienteId: cid,
      carrinhoId: checkout.carrinhoId,
      checkout,
      pedido: null,
    };

    await storage.writeTransacao(cid, checkoutId, transacao);
    await storage.setCheckoutIndex(checkoutId, cid);

    return { ok: true, status: 201, data: checkout };
  }

  async getCheckoutSessao(checkoutId) {
    const chk = toInt(checkoutId);
    if (chk == null) return { ok: false, status: 400, error: "invalid_payload" };

    const cid = await storage.resolveCheckoutCliente(chk);
    if (!cid) return { ok: false, status: 404, error: "checkout_not_found" };

    const transacao = await storage.readTransacao(cid, chk);
    const checkout = transacao?.checkout ?? null;
    if (!checkout) return { ok: false, status: 404, error: "checkout_not_found" };
    return { ok: true, data: checkout };
  }

  async updateCheckoutContato({ checkoutId, patch }) {
    const chk = toInt(checkoutId);
    const patchSafe = sanitizeContatoPatch(patch);
    if (chk == null || !patchSafe) return { ok: false, status: 400, error: "invalid_payload" };

    const cid = await storage.resolveCheckoutCliente(chk);
    if (!cid) return { ok: false, status: 404, error: "checkout_not_found" };

    const transacao = await storage.readTransacao(cid, chk);
    if (!transacao?.checkout) return { ok: false, status: 404, error: "checkout_not_found" };

    transacao.checkout.contato = { ...(transacao.checkout.contato ?? {}), ...patchSafe };
    touchCheckout(transacao.checkout);
    await storage.writeTransacao(cid, chk, transacao);
    return { ok: true, data: transacao.checkout };
  }

  async updateCheckoutEndereco({ checkoutId, endereco }) {
    const chk = toInt(checkoutId);
    const safeEndereco = sanitizeEndereco(endereco);
    if (chk == null || !safeEndereco) return { ok: false, status: 400, error: "invalid_payload" };

    const cid = await storage.resolveCheckoutCliente(chk);
    if (!cid) return { ok: false, status: 404, error: "checkout_not_found" };

    const transacao = await storage.readTransacao(cid, chk);
    if (!transacao?.checkout) return { ok: false, status: 404, error: "checkout_not_found" };

    transacao.checkout.entrega = { ...(transacao.checkout.entrega ?? {}), endereco: safeEndereco };
    touchCheckout(transacao.checkout);
    await storage.writeTransacao(cid, chk, transacao);
    return { ok: true, data: transacao.checkout };
  }

  async listFreteOpcoes({ checkoutId, cep }) {
    const chk = toInt(checkoutId);
    if (chk == null) return { ok: false, status: 400, error: "invalid_payload" };

    const cid = await storage.resolveCheckoutCliente(chk);
    if (!cid) return { ok: false, status: 404, error: "checkout_not_found" };

    const transacao = await storage.readTransacao(cid, chk);
    if (!transacao?.checkout) return { ok: false, status: 404, error: "checkout_not_found" };

    const hasAddress = Boolean(transacao.checkout?.entrega?.endereco?.cep);
    const cepQuery = String(cep ?? "").trim();
    if (!hasAddress && !cepQuery) return { ok: false, status: 409, error: "missing_delivery_address" };

    const cfg = await storage.getConfig();
    const opcoes = Array.isArray(cfg?.config?.frete?.opcoes) ? cfg.config.frete.opcoes : [];
    return { ok: true, data: { opcoes } };
  }

  async setFreteSelecionado({ checkoutId, codigo }) {
    const chk = toInt(checkoutId);
    const code = String(codigo ?? "").trim().toLowerCase();
    if (chk == null || !code) return { ok: false, status: 400, error: "invalid_payload" };

    const cid = await storage.resolveCheckoutCliente(chk);
    if (!cid) return { ok: false, status: 404, error: "checkout_not_found" };

    const cfg = await storage.getConfig();
    const option =
      (cfg.config?.frete?.opcoes ?? []).find((x) => String(x?.codigo ?? "").trim().toLowerCase() === code) ?? null;
    if (!option) return { ok: false, status: 404, error: "frete_option_not_found" };

    const transacao = await storage.readTransacao(cid, chk);
    if (!transacao?.checkout) return { ok: false, status: 404, error: "checkout_not_found" };

    transacao.checkout.entrega = {
      ...(transacao.checkout.entrega ?? {}),
      freteSelecionado: {
        codigo: option.codigo,
        nome: option.nome,
        preco: toNumber(option.preco, 0),
        prazoDias: toInt(option.prazoDias) ?? 0,
      },
    };

    const resumoBase = transacao.checkout?.snapshot?.resumoBase ?? {};
    const subtotal = toNumber(resumoBase.subtotal, 0);
    const desconto = toNumber(resumoBase.desconto, 0);
    const frete = toNumber(transacao.checkout?.entrega?.freteSelecionado?.preco, 0);
    transacao.checkout.resumoFinal = {
      subtotal,
      desconto,
      frete,
      total: Math.max(0, subtotal - desconto + frete),
      moeda: cfg.config?.moeda ?? "BRL",
    };

    touchCheckout(transacao.checkout);
    await storage.writeTransacao(cid, chk, transacao);
    return { ok: true, data: transacao.checkout };
  }

  async createPix({ checkoutId, ttlMinutos }) {
    const chk = toInt(checkoutId);
    const ttl = Math.max(1, toInt(ttlMinutos) ?? 30);
    if (chk == null) return { ok: false, status: 400, error: "invalid_payload" };

    const cid = await storage.resolveCheckoutCliente(chk);
    if (!cid) return { ok: false, status: 404, error: "checkout_not_found" };

    const transacao = await storage.readTransacao(cid, chk);
    if (!transacao?.checkout) return { ok: false, status: 404, error: "checkout_not_found" };

    const hasEndereco = Boolean(transacao.checkout?.entrega?.endereco?.cep);
    const hasFrete = Boolean(transacao.checkout?.entrega?.freteSelecionado?.codigo);
    if (!hasEndereco || !hasFrete) return { ok: false, status: 409, error: "missing_delivery_or_freight" };

    const pagamentoId = await storage.nextSeq("pagamentoId");
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();
    const pixCode = `000201checkout${chk}pag${pagamentoId}mockend`;

    transacao.checkout.pagamento = {
      pagamentoId,
      metodo: "pix",
      pix: {
        copiaECola: pixCode,
        qrCodeBase64: "bW9jay1waXgtcXItY29kZQ==",
        expiresAt,
      },
      status: "pendente",
    };
    transacao.checkout.status = "aguardando_pagamento";
    touchCheckout(transacao.checkout);

    await storage.writeTransacao(cid, chk, transacao);
    return { ok: true, data: { pagamento: transacao.checkout.pagamento } };
  }

  async confirmPix({ checkoutId }) {
    const chk = toInt(checkoutId);
    if (chk == null) return { ok: false, status: 400, error: "invalid_payload" };

    const cid = await storage.resolveCheckoutCliente(chk);
    if (!cid) return { ok: false, status: 404, error: "checkout_not_found" };

    const transacao = await storage.readTransacao(cid, chk);
    if (!transacao?.checkout) return { ok: false, status: 404, error: "checkout_not_found" };
    if (!transacao.checkout.pagamento || String(transacao.checkout.pagamento?.metodo ?? "") !== "pix") {
      return { ok: false, status: 409, error: "pix_not_created" };
    }

    transacao.checkout.pagamento.status = "pago";
    transacao.checkout.status = "aberto";
    touchCheckout(transacao.checkout);
    await storage.writeTransacao(cid, chk, transacao);
    return { ok: true, data: transacao.checkout };
  }

  async finalizarCheckout({ checkoutId }) {
    const chk = toInt(checkoutId);
    if (chk == null) return { ok: false, status: 400, error: "invalid_payload" };

    const cid = await storage.resolveCheckoutCliente(chk);
    if (!cid) return { ok: false, status: 404, error: "checkout_not_found" };

    const transacao = await storage.readTransacao(cid, chk);
    if (!transacao?.checkout) return { ok: false, status: 404, error: "checkout_not_found" };
    if (String(transacao.checkout?.pagamento?.status ?? "") !== "pago") {
      return { ok: false, status: 409, error: "payment_pending" };
    }

    const cfg = await storage.getConfig();
    const moeda = cfg.config?.moeda ?? "BRL";

    const pedidoId = await storage.nextSeq("pedidoId");
    const pedido = {
      pedidoId,
      checkoutId: toInt(transacao.checkout.checkoutId),
      clienteId: toInt(transacao.checkout.clienteId),
      itens: clone(transacao.checkout?.snapshot?.itens ?? []),
      entrega: clone(transacao.checkout?.entrega ?? {}),
      pagamento: clone(transacao.checkout?.pagamento ?? {}),
      resumo: clone(transacao.checkout?.resumoFinal ?? {}),
      status: "pago",
      createdAt: nowIso(),
    };

    transacao.pedido = pedido;
    transacao.checkout.status = "finalizado";
    touchCheckout(transacao.checkout);
    await storage.writeTransacao(cid, chk, transacao);
    await storage.setPedidoIndex(pedidoId, cid, chk);

    const carrinho = await storage.readCarrinho(cid);
    if (carrinho) {
      carrinho.itens = [];
      carrinho.cupom = null;
      carrinho.resumo = computeResumoFromItens([], null, 0, moeda);
      carrinho.updatedAt = nowIso();
      await storage.writeCarrinho(cid, carrinho);
    }

    return { ok: true, status: 201, data: { pedidoId, status: pedido.status } };
  }

  async getPedido(pedidoId) {
    const pid = toInt(pedidoId);
    if (pid == null) return { ok: false, status: 400, error: "invalid_payload" };

    const entry = await storage.resolvePedidoEntry(pid);
    if (!entry) return { ok: false, status: 404, error: "pedido_not_found" };

    const transacao = await storage.readTransacao(entry.clienteId, entry.checkoutId);
    const pedido = transacao?.pedido ?? null;
    if (!pedido) return { ok: false, status: 404, error: "pedido_not_found" };
    return { ok: true, data: pedido };
  }

  async listPedidos({ clienteId, page = 1, pageSize = 20 }) {
    const cid = toInt(clienteId);
    const p = Math.max(1, toInt(page) ?? 1);
    const ps = Math.min(100, Math.max(1, toInt(pageSize) ?? 20));
    if (cid == null) return { ok: false, status: 400, error: "invalid_payload" };

    const files = await storage.listTransacoes(cid);
    const pedidos = [];
    for (const name of files) {
      const chk = toInt(String(name).replace(/\.json$/i, ""));
      if (!chk) continue;
      const transacao = await storage.readTransacao(cid, chk);
      if (transacao?.pedido) pedidos.push(transacao.pedido);
    }

    const paged = paginate(pedidos, { page: p, pageSize: ps });
    return {
      ok: true,
      data: paged.data,
      page: paged.page,
      pageSize: paged.pageSize,
      total: paged.total,
      totalPages: paged.totalPages,
    };
  }
}

