import { readRequestJson } from "../../../../../lib/body.mjs";
import { json } from "../../../../../lib/response.mjs";

import { CheckoutController } from "./CheckoutController.mjs";

const controller = new CheckoutController();

function ensureMethod(req, res, cors, expected) {
  if (String(req.method ?? "").toUpperCase() === String(expected ?? "").toUpperCase()) return true;
  json(res, 405, { error: "method_not_allowed" }, cors);
  return false;
}

function sendResult(res, cors, result, successStatus = 200) {
  if (!result?.ok) {
    json(res, Number(result?.status ?? 500), { error: result?.error ?? "internal_error" }, cors);
    return;
  }

  const body = { success: true, data: result.data };
  if (result.page != null) body.page = result.page;
  if (result.pageSize != null) body.pageSize = result.pageSize;
  if (result.total != null) body.total = result.total;
  if (result.totalPages != null) body.totalPages = result.totalPages;
  json(res, Number(result?.status ?? successStatus), body, cors);
}

async function getCarrinho(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "GET")) return;
  const clienteId = ctx?.routeParams?.clienteId;
  const result = await controller.getCarrinho(clienteId);
  sendResult(res, cors, result, 200);
}

async function addCarrinhoItem(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "POST")) return;
  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    json(res, 400, { error: "invalid_body" }, cors);
    return;
  }
  const result = await controller.addCarrinhoItem({ clienteId: body?.clienteId, item: body?.item });
  sendResult(res, cors, result, 201);
}

async function updateCarrinhoItem(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "PUT")) return;
  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    json(res, 400, { error: "invalid_body" }, cors);
    return;
  }
  const result = await controller.updateCarrinhoItem({
    clienteId: body?.clienteId,
    itemId: ctx?.routeParams?.itemId,
    patch: body?.patch,
  });
  sendResult(res, cors, result, 200);
}

async function deleteCarrinhoItem(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "DELETE")) return;
  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    body = {};
  }
  const result = await controller.deleteCarrinhoItem({
    clienteId: body?.clienteId,
    itemId: ctx?.routeParams?.itemId,
  });
  sendResult(res, cors, result, 200);
}

async function applyCupom(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "POST")) return;
  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    json(res, 400, { error: "invalid_body" }, cors);
    return;
  }
  const result = await controller.applyCupom({ clienteId: body?.clienteId, codigo: body?.codigo });
  sendResult(res, cors, result, 200);
}

async function removeCupom(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "DELETE")) return;
  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    body = {};
  }
  const result = await controller.removeCupom({ clienteId: body?.clienteId });
  sendResult(res, cors, result, 200);
}

async function createCheckoutSessao(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "POST")) return;
  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    json(res, 400, { error: "invalid_body" }, cors);
    return;
  }
  const result = await controller.createCheckoutSessao({
    clienteId: body?.clienteId,
    contato: body?.contato,
    enderecoEntrega: body?.enderecoEntrega,
  });
  sendResult(res, cors, result, 201);
}

async function getCheckoutSessao(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "GET")) return;
  const result = await controller.getCheckoutSessao(ctx?.routeParams?.checkoutId);
  sendResult(res, cors, result, 200);
}

async function updateCheckoutContato(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "PUT")) return;
  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    json(res, 400, { error: "invalid_body" }, cors);
    return;
  }
  const result = await controller.updateCheckoutContato({
    checkoutId: ctx?.routeParams?.checkoutId,
    patch: body?.patch,
  });
  sendResult(res, cors, result, 200);
}

async function updateCheckoutEndereco(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "PUT")) return;
  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    json(res, 400, { error: "invalid_body" }, cors);
    return;
  }
  const result = await controller.updateCheckoutEndereco({
    checkoutId: ctx?.routeParams?.checkoutId,
    endereco: body?.endereco,
  });
  sendResult(res, cors, result, 200);
}

async function listFreteOpcoes(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "GET")) return;
  const result = await controller.listFreteOpcoes({
    checkoutId: ctx?.routeParams?.checkoutId,
    cep: ctx?.url?.searchParams?.get("cep"),
  });
  sendResult(res, cors, result, 200);
}

async function setFrete(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "PUT")) return;
  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    json(res, 400, { error: "invalid_body" }, cors);
    return;
  }
  const result = await controller.setFreteSelecionado({
    checkoutId: ctx?.routeParams?.checkoutId,
    codigo: body?.codigo,
  });
  sendResult(res, cors, result, 200);
}

async function createPix(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "POST")) return;
  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    body = {};
  }
  const result = await controller.createPix({
    checkoutId: ctx?.routeParams?.checkoutId,
    ttlMinutos: body?.ttlMinutos,
  });
  sendResult(res, cors, result, 200);
}

async function confirmPix(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "POST")) return;
  const result = await controller.confirmPix({
    checkoutId: ctx?.routeParams?.checkoutId,
  });
  sendResult(res, cors, result, 200);
}

async function finalizarCheckout(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "POST")) return;
  const result = await controller.finalizarCheckout({
    checkoutId: ctx?.routeParams?.checkoutId,
  });
  sendResult(res, cors, result, 201);
}

async function getPedido(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "GET")) return;
  const result = await controller.getPedido(ctx?.routeParams?.pedidoId);
  sendResult(res, cors, result, 200);
}

async function listPedidos(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "GET")) return;
  const result = await controller.listPedidos({
    clienteId: ctx?.url?.searchParams?.get("clienteId"),
    page: ctx?.url?.searchParams?.get("page"),
    pageSize: ctx?.url?.searchParams?.get("pageSize"),
  });
  sendResult(res, cors, result, 200);
}

export const handlers = {
  getCarrinho,
  addCarrinhoItem,
  updateCarrinhoItem,
  deleteCarrinhoItem,
  applyCupom,
  removeCupom,
  createCheckoutSessao,
  getCheckoutSessao,
  updateCheckoutContato,
  updateCheckoutEndereco,
  listFreteOpcoes,
  setFrete,
  createPix,
  confirmPix,
  finalizarCheckout,
  getPedido,
  listPedidos,
};
