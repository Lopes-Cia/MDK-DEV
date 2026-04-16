import path from "node:path";
import { fileURLToPath } from "node:url";

import { readRequestJson } from "../../../../../lib/body.mjs";
import { parseCookies } from "../../../../../lib/cookies.mjs";
import { json } from "../../../../../lib/response.mjs";

import { CartController } from "./CartController.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, "..");

const controller = new CartController({ baseDir });

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

async function get(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const session = getSession(req);
  const out = await controller.getCart({ userId: session?.userId ?? "" });
  json(res, out.status, out.body, cors);
}

async function put(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const session = getSession(req);
  const body = await readRequestJson(req);
  const out = await controller.putCart({ userId: session?.userId ?? "", items: body?.items });
  json(res, out.status, out.body, cors);
}

export const handlers = {
  get,
  put,
};

