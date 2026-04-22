import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import crypto from "node:crypto";

import { loadDotEnv } from "../lib/env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

await loadDotEnv(ROOT, ".env");

const PORT = Number.parseInt(String(process.env.PORT ?? "").trim(), 10);
const baseUrl = new URL(String(process.env.BASE_URL_API ?? "").trim() || "http://localhost");
const produtoName = String(process.env.PRODUTO ?? "CONNECT").trim();

const origin = baseUrl.port ? baseUrl.origin : `${baseUrl.origin}:${PORT || 80}`;
const base = `${origin}/connect`;

const runId = new Date().toISOString().replace(/[:.]/g, "-");
const evidenceDir = path.join(ROOT, "evidence", runId);
await fs.mkdir(evidenceDir, { recursive: true });

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: String(err?.message ?? err) };
  }
}

function nowMs() {
  return Date.now();
}

async function writeText(rel, text) {
  const filePath = path.join(evidenceDir, rel);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, text ?? "", "utf8");
}

async function writeJson(rel, obj) {
  await writeText(rel, JSON.stringify(obj, null, 2) + "\n");
}

async function httpCall({ id, method, url, headers = {}, body = null }) {
  const startedAt = nowMs();
  let status = 0;
  let ok = false;
  let text = "";
  let jsonBody = null;
  let error = null;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body == null ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    status = res.status;
    ok = res.ok;
    text = await res.text();
    const parsed = safeJsonParse(text);
    if (parsed.ok) jsonBody = parsed.value;
  } catch (err) {
    error = String(err?.message ?? err);
  }

  const endedAt = nowMs();
  const entry = {
    id,
    method,
    url,
    status,
    ok,
    durationMs: endedAt - startedAt,
    error,
  };

  await writeJson(`calls/${id}.meta.json`, entry);
  if (body != null) await writeJson(`calls/${id}.request.json`, body);
  await writeText(`calls/${id}.response.txt`, text);
  if (jsonBody != null) await writeJson(`calls/${id}.response.json`, jsonBody);

  return { entry, text, json: jsonBody };
}

function flattenCategorias(tree) {
  const out = [];
  const stack = Array.isArray(tree) ? [...tree] : [];
  while (stack.length) {
    const node = stack.shift();
    if (!node || typeof node !== "object") continue;
    out.push(node);
    const children = Array.isArray(node.children) ? node.children : [];
    for (const c of children) stack.push(c);
  }
  return out;
}

function pickFirstId(list) {
  for (const item of list) {
    const id = Number.parseInt(String(item?.id ?? item?.category?.id ?? "").trim(), 10);
    if (Number.isFinite(id) && id > 0) return id;
  }
  return null;
}

function pickFirstString(list, keys) {
  for (const item of list) {
    for (const k of keys) {
      const v = String(item?.[k] ?? "").trim();
      if (v) return v;
    }
  }
  return "";
}

async function startServer() {
  const child = spawn(process.execPath, [path.join(ROOT, "server.mjs")], {
    cwd: ROOT,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let out = "";
  let err = "";

  child.stdout.on("data", (d) => {
    out += d.toString("utf8");
  });
  child.stderr.on("data", (d) => {
    err += d.toString("utf8");
  });

  const ready = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 4000);
    const interval = setInterval(() => {
      if (out.includes("listening")) {
        clearTimeout(timer);
        clearInterval(interval);
        resolve(true);
      }
      if (child.exitCode != null) {
        clearTimeout(timer);
        clearInterval(interval);
        resolve(false);
      }
    }, 50);
  });

  await writeText("server.stdout.txt", out);
  await writeText("server.stderr.txt", err);

  return { child, ready };
}

const report = {
  produtoName,
  origin,
  base,
  startedAt: new Date().toISOString(),
  calls: [],
  errors: [],
  skipped: [],
  derived: {},
};

const server = await startServer();
report.serverReady = server.ready;

async function step(call) {
  const res = await httpCall(call);
  report.calls.push(res.entry);
  if (!res.entry.ok) report.errors.push(res.entry);
  return res;
}

function skip(id, reason) {
  report.skipped.push({ id, reason: String(reason ?? "") });
}

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

let categoriasFlat = [];
let idCategoria = null;
let slugCategoria = "";
let produtoId = null;
let produtoSlug = "";
let brandId = null;
let cliente = { id: null, email: "", senha: "" };
let enderecoId = null;
let checkoutId = null;
let itemId = null;
let pedidoId = null;
let freteCodigo = null;
let cupomCodigo = "";

async function loadCheckoutConfig() {
  const filePath = path.join(ROOT, "PRODUTO", produtoName, "data", "checkout", "checkout.json");
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

await step({ id: "health", method: "GET", url: `${origin}/health`, headers: { Accept: "application/json" } });

const home = await step({ id: "ecommerce", method: "GET", url: `${base}/ecommerce`, headers });
report.derived.ecommerce = home.json;

const categorias = await step({ id: "categorias", method: "GET", url: `${base}/produtos/categorias`, headers });
const categoriasData = categorias.json?.data ?? null;
categoriasFlat = flattenCategorias(categoriasData);
idCategoria = pickFirstId(categoriasFlat);
slugCategoria = pickFirstString(categoriasFlat, ["slug"]);
report.derived.idCategoria = idCategoria;
report.derived.slugCategoria = slugCategoria;

if (idCategoria != null) {
  await step({ id: "categoriaById", method: "GET", url: `${base}/produtos/categorias/${idCategoria}`, headers });
  await step({
    id: "produtosByCategoria",
    method: "GET",
    url: `${base}/produtos/by-categoria/${idCategoria}?includeDescendants=1&page=1&pageSize=5`,
    headers,
  });
}

if (slugCategoria) {
  const slugPath = slugCategoria.replace(/^\/+/, "");
  await step({
    id: "categoriaBySlug",
    method: "GET",
    url: `${base}/produtos/categorias/by-slug/${slugPath}`,
    headers,
  });
}

const brands = await step({ id: "brands", method: "GET", url: `${base}/produtos/brands`, headers });
brandId = pickFirstId(brands.json?.data ?? []);
report.derived.brandId = brandId;

if (brandId != null) {
  await step({ id: "brandById", method: "GET", url: `${base}/produtos/brands/${brandId}?page=1&pageSize=5`, headers });
}

const produtosCat = await step({
  id: "produtosByCategoria_forProductPick",
  method: "GET",
  url: `${base}/produtos/by-categoria/${idCategoria ?? 1}?includeDescendants=1&page=1&pageSize=5`,
  headers,
});
const produtosList = Array.isArray(produtosCat.json?.data) ? produtosCat.json.data : [];
produtoId = pickFirstId(produtosList);
produtoSlug = pickFirstString(produtosList, ["slug"]);
report.derived.produtoId = produtoId;
report.derived.produtoSlug = produtoSlug;

if (produtoId != null) {
  await step({ id: "produtoById", method: "GET", url: `${base}/produtos/by-id/${produtoId}`, headers });
}
if (produtoSlug) {
  const slugOne = String(produtoSlug).trim().replace(/^\/+/, "").replace(/^produtos\//, "").split("/")[0];
  await step({ id: "produtoBySlug", method: "GET", url: `${base}/produtos/by-slug/${encodeURIComponent(slugOne)}`, headers });
}

const uniq = crypto.randomBytes(6).toString("hex");
cliente.email = `mock-${uniq}@local.test`;
cliente.senha = `Senha-${uniq}`;

const cadastroBody = {
  meus_dados: {
    tipoPessoa: "PF",
    documento: `0000000000${String(Date.now()).slice(-3)}`,
    nome: `Cliente Mock ${uniq}`,
    email: cliente.email,
    whatsapp: "5511999999999",
    senha: cliente.senha,
    status: "ativo",
  },
  enderecos: [
    {
      cep: "01001000",
      logradouro: "Rua Mock",
      numero: "123",
      bairro: "Centro",
      cidade: "Sao Paulo",
      uf: "SP",
      pais: "BR",
    },
  ],
  privacidade: {
    aceitaMarketing: false,
    aceitaTermos: true,
    aceitaCookies: true,
    canalPreferido: "email",
    doisFatores: { habilitado: false, metodo: "email" },
  },
};

const cadastro = await step({
  id: "clientes_cadastro",
  method: "POST",
  url: `${base}/usuarios/cadastro`,
  headers,
  body: cadastroBody,
});
cliente.id = Number.parseInt(String(cadastro.json?.data?.meus_dados?.id ?? ""), 10) || null;
report.derived.clienteId = cliente.id;

await step({
  id: "clientes_login",
  method: "POST",
  url: `${base}/usuarios/login`,
  headers,
  body: { email: cliente.email, senha: cliente.senha },
});

if (cliente.id != null) {
  const enderecos = await step({
    id: "clientes_listEnderecos",
    method: "GET",
    url: `${base}/usuarios/enderecos/${cliente.id}`,
    headers,
  });

  const enderecoList = Array.isArray(enderecos.json?.data) ? enderecos.json.data : [];

  const createdEndereco = await step({
    id: "clientes_createEndereco",
    method: "POST",
    url: `${base}/usuarios/enderecos`,
    headers,
    body: {
      clienteId: cliente.id,
      endereco: {
        cep: "01001000",
        logradouro: "Rua Mock 2",
        numero: "456",
        bairro: "Centro",
        cidade: "Sao Paulo",
        uf: "SP",
        pais: "BR",
      },
    },
  });

  const listAfter = Array.isArray(createdEndereco.json?.data) ? createdEndereco.json.data : enderecoList;
  enderecoId = pickFirstId(listAfter);
  report.derived.enderecoId = enderecoId;

  if (enderecoId != null) {
    await step({
      id: "clientes_updateEndereco",
      method: "PUT",
      url: `${base}/usuarios/enderecos/${enderecoId}`,
      headers,
      body: { clienteId: cliente.id, patch: { referencia: "teste" } },
    });

    await step({
      id: "clientes_deleteEndereco",
      method: "DELETE",
      url: `${base}/usuarios/enderecos/${enderecoId}`,
      headers,
      body: { clienteId: cliente.id },
    });
  }

  await step({
    id: "clientes_updateMeusDados",
    method: "PUT",
    url: `${base}/usuarios/meus-dados`,
    headers,
    body: { clienteId: cliente.id, patch: { nome: `Cliente Mock Updated ${uniq}` } },
  });

  await step({
    id: "clientes_updatePrivacidade",
    method: "PUT",
    url: `${base}/usuarios/privacidade`,
    headers,
    body: { clienteId: cliente.id, patch: { aceitaMarketing: true } },
  });
}

if (cliente.id != null) {
  const carrinho = await step({
    id: "checkout_getCarrinho",
    method: "GET",
    url: `${base}/carrinho/${cliente.id}`,
    headers,
  });
  report.derived.carrinho = carrinho.json;

  if (produtoId != null) {
    const checkoutCfg = await loadCheckoutConfig();
    cupomCodigo = String(checkoutCfg?.config?.cupons?.[0]?.codigo ?? "").trim();
    report.derived.cupomCodigo = cupomCodigo;

    const addItem = await step({
      id: "checkout_addCarrinhoItem",
      method: "POST",
      url: `${base}/carrinho/itens`,
      headers,
      body: { clienteId: cliente.id, item: { produtoId, quantidade: 1 } },
    });

    const itens = Array.isArray(addItem.json?.data?.itens) ? addItem.json.data.itens : [];
    itemId = pickFirstId(itens.map((x) => ({ id: x?.itemId })));
    report.derived.itemId = itemId;

    if (itemId != null) {
      await step({
        id: "checkout_updateCarrinhoItem",
        method: "PUT",
        url: `${base}/carrinho/itens/${itemId}`,
        headers,
        body: { clienteId: cliente.id, patch: { quantidade: 2 } },
      });
    }

    if (cupomCodigo) {
      await step({
        id: "checkout_applyCupom",
        method: "POST",
        url: `${base}/carrinho/cupom`,
        headers,
        body: { clienteId: cliente.id, codigo: cupomCodigo },
      });
    } else {
      skip("checkout_applyCupom", "no_coupon_configured");
    }

    await step({
      id: "checkout_removeCupom",
      method: "DELETE",
      url: `${base}/carrinho/cupom`,
      headers,
      body: { clienteId: cliente.id },
    });

    const sessao = await step({
      id: "checkout_createSessao",
      method: "POST",
      url: `${base}/checkout/sessoes`,
      headers,
      body: {
        clienteId: cliente.id,
        contato: { nome: `Cliente ${uniq}`, email: cliente.email, telefone: "5511999999999" },
        enderecoEntrega: {
          cep: "01001000",
          logradouro: "Rua Mock",
          numero: "123",
          bairro: "Centro",
          cidade: "Sao Paulo",
          uf: "SP",
          pais: "BR",
        },
      },
    });

    checkoutId = Number.parseInt(String(sessao.json?.data?.checkoutId ?? ""), 10) || null;
    report.derived.checkoutId = checkoutId;

    if (checkoutId != null) {
      await step({ id: "checkout_getSessao", method: "GET", url: `${base}/checkout/sessoes/${checkoutId}`, headers });
      await step({
        id: "checkout_updateContato",
        method: "PUT",
        url: `${base}/checkout/sessoes/${checkoutId}/contato`,
        headers,
        body: { patch: { telefone: "5511888888888" } },
      });
      await step({
        id: "checkout_updateEndereco",
        method: "PUT",
        url: `${base}/checkout/sessoes/${checkoutId}/entrega/endereco`,
        headers,
        body: {
          endereco: {
            cep: "01001000",
            logradouro: "Rua Mock 3",
            numero: "999",
            bairro: "Centro",
            cidade: "Sao Paulo",
            uf: "SP",
            pais: "BR",
          },
        },
      });

      const frete = await step({
        id: "checkout_listFreteOpcoes",
        method: "GET",
        url: `${base}/checkout/sessoes/${checkoutId}/entrega/frete/opcoes?cep=01001000`,
        headers,
      });
      const opcoes = frete.json?.data?.opcoes;
      freteCodigo = Array.isArray(opcoes) ? String(opcoes?.[0]?.codigo ?? "").trim() : "";
      report.derived.freteCodigo = freteCodigo;

      if (freteCodigo) {
        await step({
          id: "checkout_setFrete",
          method: "PUT",
          url: `${base}/checkout/sessoes/${checkoutId}/entrega/frete`,
          headers,
          body: { codigo: freteCodigo },
        });
      }

      await step({
        id: "checkout_createPix",
        method: "POST",
        url: `${base}/checkout/sessoes/${checkoutId}/pagamento/pix`,
        headers,
        body: { ttlMinutos: 5 },
      });
      await step({
        id: "checkout_confirmPix",
        method: "POST",
        url: `${base}/checkout/sessoes/${checkoutId}/pagamento/pix/confirmar`,
        headers,
      });

      const fin = await step({
        id: "checkout_finalizar",
        method: "POST",
        url: `${base}/checkout/sessoes/${checkoutId}/finalizar`,
        headers,
      });
      pedidoId = Number.parseInt(String(fin.json?.data?.pedidoId ?? fin.json?.data?.pedido?.id ?? ""), 10) || null;
      report.derived.pedidoId = pedidoId;

      if (pedidoId != null) {
        await step({ id: "checkout_getPedido", method: "GET", url: `${base}/pedidos/${pedidoId}`, headers });
      }
      await step({
        id: "checkout_listPedidos",
        method: "GET",
        url: `${base}/pedidos?clienteId=${encodeURIComponent(String(cliente.id))}&page=1&pageSize=5`,
        headers,
      });

      const carrinhoFinal = await step({
        id: "checkout_getCarrinho_after",
        method: "GET",
        url: `${base}/carrinho/${cliente.id}`,
        headers,
      });
      const itensFinal = Array.isArray(carrinhoFinal.json?.data?.itens) ? carrinhoFinal.json.data.itens : [];
      const itemFinalId = pickFirstId(itensFinal.map((x) => ({ id: x?.itemId })));
      if (itemFinalId != null) {
        await step({
          id: "checkout_deleteCarrinhoItem",
          method: "DELETE",
          url: `${base}/carrinho/itens/${itemFinalId}`,
          headers,
          body: { clienteId: cliente.id },
        });
      } else {
        skip("checkout_deleteCarrinhoItem", "no_cart_item_to_delete");
      }
    }
  }
}

report.finishedAt = new Date().toISOString();
report.summary = {
  total: report.calls.length,
  ok: report.calls.filter((c) => c.ok).length,
  failed: report.calls.filter((c) => !c.ok).length,
};

await writeJson("report.json", report);
await writeText(
  "report.md",
  [
    `# MOCK-END-MICRO Test Report`,
    ``,
    `- startedAt: ${report.startedAt}`,
    `- finishedAt: ${report.finishedAt}`,
    `- produtoName: ${produtoName}`,
    `- origin: ${origin}`,
    `- base: ${base}`,
    `- total: ${report.summary.total}`,
    `- ok: ${report.summary.ok}`,
    `- failed: ${report.summary.failed}`,
    ``,
    `## Derived`,
    "```json",
    JSON.stringify(report.derived, null, 2),
    "```",
    ``,
    `## Skipped`,
    "```json",
    JSON.stringify(report.skipped, null, 2),
    "```",
    ``,
    `## Failures`,
    "```json",
    JSON.stringify(report.errors, null, 2),
    "```",
    ``,
  ].join("\n")
);

if (server.child && server.child.exitCode == null) {
  server.child.kill();
}

process.stdout.write(`evidence: ${evidenceDir}\n`);
process.stdout.write(`failed: ${report.summary.failed}\n`);
