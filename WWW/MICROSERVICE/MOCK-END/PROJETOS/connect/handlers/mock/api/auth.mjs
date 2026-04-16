import path from "node:path";
import { fileURLToPath } from "node:url";

import { readRequestJson } from "../../../../../lib/body.mjs";
import { parseCookies, serializeCookie } from "../../../../../lib/cookies.mjs";
import { json } from "../../../../../lib/response.mjs";

import { AuthController } from "./AuthController.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, "..");

const controller = new AuthController({ baseDir });

function authHeaders() {
  return {
    mode: "required",
    label: "Token da integradora (quando em modo original).",
  };
}

async function register(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const body = await readRequestJson(req);
  const out = await controller.register(body ?? {});
  json(res, out.status, out.body, cors);
}

async function sendToken(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const body = await readRequestJson(req);
  const out = await controller.sendToken(body ?? {});
  json(res, out.status, out.body, cors);
}

async function verifyToken(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const body = await readRequestJson(req);
  const out = await controller.verifyToken(body ?? {});
  if (!out.ok) {
    json(res, out.status, out.body, cors);
    return;
  }

  const cookie = serializeCookie("session", JSON.stringify(out.sessionCookie), {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
  });
  json(res, out.status, out.body, { ...cors, "Set-Cookie": cookie });
}

async function me(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const cookies = parseCookies(req);
  const out = await controller.me({ rawSession: cookies.session });
  json(res, out.status, out.body, cors);
}

async function logout(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const out = await controller.logout();
  const cookie = serializeCookie("session", "", {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    maxAge: 0,
  });
  json(res, out.status, out.body, { ...cors, "Set-Cookie": cookie });
}

async function updateMe(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const cookies = parseCookies(req);
  const body = await readRequestJson(req);
  const payload = body ?? {};
  const enderecos = payload.enderecos ?? (payload.endereco ? [payload.endereco] : undefined);
  const out = await controller.updateMe({ rawSession: cookies.session, ...payload, enderecos });
  json(res, out.status, out.body, cors);
}

async function forgotPassword(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const body = await readRequestJson(req);
  const out = await controller.forgotPassword(body ?? {});
  json(res, out.status, out.body, cors);
}

async function resetPassword(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const body = await readRequestJson(req);
  const out = await controller.resetPassword(body ?? {});
  json(res, out.status, out.body, cors);
}

async function privacyDelete(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const cookies = parseCookies(req);
  const out = await controller.privacyDelete({ rawSession: cookies.session });
  const cookie = serializeCookie("session", "", {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    maxAge: 0,
  });
  json(res, out.status, out.body, { ...cors, "Set-Cookie": cookie });
}

export const handlers = {
  register,
  "send-token": sendToken,
  "verify-token": verifyToken,
  me,
  logout,
  "update-me": updateMe,
  "forgot-password": forgotPassword,
  "reset-password": resetPassword,
  "privacy-delete": privacyDelete,
  authHeaders,
};
