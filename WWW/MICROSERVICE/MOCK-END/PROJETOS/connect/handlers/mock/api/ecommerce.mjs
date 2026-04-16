import path from "node:path";
import { fileURLToPath } from "node:url";

import { json } from "../../../../../lib/response.mjs";

import { EcommerceController } from "./EcommerceController.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, "..");

const controller = new EcommerceController({ baseDir });

async function config(req, res, ctx) {
  const cors = ctx.cors ?? {};
  const out = await controller.getConfig();
  json(res, out.status, out.body, cors);
}

export const handlers = {
  config,
};

