import { json } from "../../../../../lib/response.mjs";

import { HomeController } from "./HomeController.mjs";

function ensureGet(req, res, cors) {
  if (String(req.method ?? "").toUpperCase() === "GET") return true;
  json(res, 405, { error: "method_not_allowed" }, cors);
  return false;
}

const controller = new HomeController();

async function home(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const data = await controller.home();
  json(res, 200, { success: true, data }, cors);
}

export const handlers = {
  home,
};

