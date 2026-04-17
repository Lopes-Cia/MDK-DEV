import { readRequestJson } from "../../../../../lib/body.mjs";
import { json } from "../../../../../lib/response.mjs";

import { ClientesController } from "./ClientesController.mjs";

function ensureMethod(req, res, cors, expected) {
  if (String(req.method ?? "").toUpperCase() === String(expected ?? "").toUpperCase()) return true;
  json(res, 405, { error: "method_not_allowed" }, cors);
  return false;
}

const controller = new ClientesController();

async function cadastro(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "POST")) return;

  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    json(res, 400, { error: "invalid_body" }, cors);
    return;
  }

  const result = await controller.cadastro(body);
  if (!result?.ok) {
    json(res, Number(result?.status ?? 500), { error: result?.error ?? "internal_error" }, cors);
    return;
  }

  json(res, 201, { success: true, data: result.data }, cors);
}

async function login(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "POST")) return;

  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    json(res, 400, { error: "invalid_body" }, cors);
    return;
  }

  const email = String(body?.email ?? "").trim();
  const senha = String(body?.senha ?? "");

  const result = await controller.login(email, senha);
  if (!result?.ok) {
    json(res, Number(result?.status ?? 500), { error: result?.error ?? "internal_error" }, cors);
    return;
  }

  json(res, 200, { success: true, data: result.data }, cors);
}

async function updateMeusDados(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "PUT")) return;

  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    json(res, 400, { success: false, message: "invalid_body" }, cors);
    return;
  }

  const clienteId = Number.parseInt(String(body?.clienteId ?? "").trim(), 10);
  const patch = body?.patch ?? null;
  if (!Number.isFinite(clienteId) || !patch || typeof patch !== "object" || Array.isArray(patch)) {
    json(res, 400, { success: false, message: "invalid_payload" }, cors);
    return;
  }

  const result = await controller.updateMeusDados({ clienteId, patch });
  if (!result?.ok) {
    json(res, Number(result?.status ?? 500), { success: false, error: result?.error ?? "internal_error" }, cors);
    return;
  }

  json(res, 200, { success: true, data: result.data }, cors);
}

async function updatePrivacidade(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "PUT")) return;

  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    json(res, 400, { success: false, message: "invalid_body" }, cors);
    return;
  }

  const clienteId = Number.parseInt(String(body?.clienteId ?? "").trim(), 10);
  const patch = body?.patch ?? null;
  if (!Number.isFinite(clienteId) || !patch || typeof patch !== "object" || Array.isArray(patch)) {
    json(res, 400, { success: false, message: "invalid_payload" }, cors);
    return;
  }

  const result = await controller.updatePrivacidade({ clienteId, patch });
  if (!result?.ok) {
    json(res, Number(result?.status ?? 500), { success: false, error: result?.error ?? "internal_error" }, cors);
    return;
  }

  json(res, 200, { success: true, data: result.data }, cors);
}

async function listEnderecos(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "GET")) return;

  const clienteId = Number.parseInt(String(ctx?.routeParams?.clienteId ?? "").trim(), 10);
  if (!Number.isFinite(clienteId)) {
    json(res, 400, { success: false, message: "invalid_payload" }, cors);
    return;
  }

  const result = await controller.listEnderecos({ clienteId });
  if (!result?.ok) {
    json(res, Number(result?.status ?? 500), { success: false, error: result?.error ?? "internal_error" }, cors);
    return;
  }

  json(res, 200, { success: true, data: result.data }, cors);
}

async function createEndereco(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "POST")) return;

  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    json(res, 400, { success: false, message: "invalid_body" }, cors);
    return;
  }

  const clienteId = Number.parseInt(String(body?.clienteId ?? "").trim(), 10);
  const endereco = body?.endereco ?? null;
  if (!Number.isFinite(clienteId) || !endereco || typeof endereco !== "object" || Array.isArray(endereco)) {
    json(res, 400, { success: false, message: "invalid_payload" }, cors);
    return;
  }

  const result = await controller.createEndereco({ clienteId, endereco });
  if (!result?.ok) {
    json(res, Number(result?.status ?? 500), { success: false, error: result?.error ?? "internal_error" }, cors);
    return;
  }

  json(res, 201, { success: true, data: result.data }, cors);
}

async function updateEndereco(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "PUT")) return;

  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    json(res, 400, { success: false, message: "invalid_body" }, cors);
    return;
  }

  const enderecoId = Number.parseInt(String(ctx?.routeParams?.enderecoId ?? "").trim(), 10);
  const clienteIdRaw = String(body?.clienteId ?? "").trim();
  const clienteId = clienteIdRaw ? Number.parseInt(clienteIdRaw, 10) : null;
  const patch = body?.patch ?? null;

  if (!Number.isFinite(enderecoId) || !patch || typeof patch !== "object" || Array.isArray(patch)) {
    json(res, 400, { success: false, message: "invalid_payload" }, cors);
    return;
  }
  if (clienteIdRaw && !Number.isFinite(clienteId)) {
    json(res, 400, { success: false, message: "invalid_payload" }, cors);
    return;
  }

  const result = await controller.updateEndereco({ enderecoId, clienteId, patch });
  if (!result?.ok) {
    json(res, Number(result?.status ?? 500), { success: false, error: result?.error ?? "internal_error" }, cors);
    return;
  }

  json(res, 200, { success: true, data: result.data }, cors);
}

async function deleteEndereco(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureMethod(req, res, cors, "DELETE")) return;

  let body = null;
  try {
    body = await readRequestJson(req);
  } catch {
    body = null;
  }

  const enderecoId = Number.parseInt(String(ctx?.routeParams?.enderecoId ?? "").trim(), 10);
  const clienteIdRaw = String(body?.clienteId ?? "").trim();
  const clienteId = clienteIdRaw ? Number.parseInt(clienteIdRaw, 10) : null;

  if (!Number.isFinite(enderecoId)) {
    json(res, 400, { success: false, message: "invalid_payload" }, cors);
    return;
  }
  if (clienteIdRaw && !Number.isFinite(clienteId)) {
    json(res, 400, { success: false, message: "invalid_payload" }, cors);
    return;
  }

  const result = await controller.deleteEndereco({ enderecoId, clienteId });
  if (!result?.ok) {
    json(res, Number(result?.status ?? 500), { success: false, error: result?.error ?? "internal_error" }, cors);
    return;
  }

  json(res, 200, { success: true, data: result.data }, cors);
}

export const handlers = {
  cadastro,
  login,
  updateMeusDados,
  updatePrivacidade,
  listEnderecos,
  createEndereco,
  updateEndereco,
  deleteEndereco,
};
