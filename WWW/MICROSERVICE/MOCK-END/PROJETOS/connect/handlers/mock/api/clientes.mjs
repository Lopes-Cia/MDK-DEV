import { readRequestJson } from "../../../../../lib/body.mjs";
import { json } from "../../../../../lib/response.mjs";

import { ClientesController } from "./ClientesController.mjs";

function ensurePost(req, res, cors) {
  if (String(req.method ?? "").toUpperCase() === "POST") return true;
  json(res, 405, { error: "method_not_allowed" }, cors);
  return false;
}

const controller = new ClientesController();

async function cadastro(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensurePost(req, res, cors)) return;

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
  if (!ensurePost(req, res, cors)) return;

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

export const handlers = {
  cadastro,
  login,
};
