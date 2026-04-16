import path from "node:path";
import { fileURLToPath } from "node:url";

import { readRequestJson } from "../../../../../lib/body.mjs";
import { parseCookies } from "../../../../../lib/cookies.mjs";
import { json } from "../../../../../lib/response.mjs";

import { OrdersController } from "./OrdersController.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, "..");

const controller = new OrdersController({ baseDir });

function getSession(req) {
  const cookies = parseCookies(req);
  if (!cookies.session) return null;
  try {
    const parsed = JSON.parse(cookies.session);
    if (!parsed || typeof parsed !== "object") return null;
    const userId = String(parsed.userId ?? "").trim();
    if (!userId) return null;
    return { userId };
  } catch {
    return null;
  }
}

function parseOrderId(ctx) {
  const raw = String(ctx?.url?.pathname ?? "");
  const prefix = "/Servidor/webservice/integration/orders/";
  const idx = raw.indexOf(prefix);
  if (idx < 0) return "";
  return raw.slice(idx + prefix.length).replace(/^\/+/, "").split("/")[0] ?? "";
}

async function checkout(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const session = getSession(req);
  const body = await readRequestJson(req);
  const out = await controller.checkout({
    userId: session?.userId ?? "",
    address: body?.address ?? null,
    payment: body?.payment ?? null,
  });
  json(res, out.status, out.body, cors);
}

async function list(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const session = getSession(req);
  const out = await controller.list({ userId: session?.userId ?? "" });
  json(res, out.status, out.body, cors);
}

async function detail(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const session = getSession(req);
  const orderId = parseOrderId(ctx);
  const out = await controller.detail({ userId: session?.userId ?? "", orderId });
  json(res, out.status, out.body, cors);
}

export const handlers = {
  checkout,
  list,
  detail,
};

