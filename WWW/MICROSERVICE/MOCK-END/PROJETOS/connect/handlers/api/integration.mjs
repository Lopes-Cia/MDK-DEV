import { proxyToUpstream } from "../../../../lib/upstream-proxy.mjs";

async function listProdutoLoja(req, res, ctx) {
  const cors = ctx.cors ?? {};
  await proxyToUpstream(req, res, cors, ctx.upstreamTargetUrl);
}

async function produtoLoja(req, res, ctx) {
  const cors = ctx.cors ?? {};
  await proxyToUpstream(req, res, cors, ctx.upstreamTargetUrl);
}

export const handlers = {
  listProdutoLoja,
  produtoLoja,
};

