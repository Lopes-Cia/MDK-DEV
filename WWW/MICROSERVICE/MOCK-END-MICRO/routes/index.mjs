import { json } from "../lib/response.mjs";
import { handlePublicAssets } from "./public-assets.mjs";
import { handleProduto } from "./produto.mjs";

export async function handleRoutes(req, res, ctx) {
  const { cors, pathname } = ctx;

  const handledPublicAssets = await handlePublicAssets(req, res, ctx);
  if (handledPublicAssets) return true;

  const handledProduto = await handleProduto(req, res, ctx);
  if (handledProduto) return true;

  if (pathname === "/health") {
    json(res, 200, { ok: true }, cors);
    return true;
  }

  return false;
}
