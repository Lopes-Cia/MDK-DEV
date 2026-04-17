import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.MOCK_END_BASE_URL ?? "http://localhost:4000";
const BASE_CONNECT = `${BASE_URL}/connect`;
const PREFIX = "/Servidor/webservice/integration";

const CLIENTE_ID = Number.parseInt(process.env.CHECKOUT_CLIENTE_ID ?? "999", 10);
const PRODUTO_ID = Number.parseInt(process.env.CHECKOUT_PRODUTO_ID ?? "1001", 10);

function nowIso() {
  return new Date().toISOString();
}

async function writeJson(fileName, data) {
  const fullPath = path.join(__dirname, fileName);
  await fs.mkdir(__dirname, { recursive: true });
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function writeText(fileName, text) {
  const fullPath = path.join(__dirname, fileName);
  await fs.mkdir(__dirname, { recursive: true });
  await fs.writeFile(fullPath, text, "utf8");
}

async function requestJson({ method, url, body }) {
  const res = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await res.text();
  let json = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = { raw };
  }
  return { status: res.status, json };
}

async function requestGet(url) {
  const res = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
  const raw = await res.text();
  let json = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = { raw };
  }
  return { status: res.status, json };
}

function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

async function runScenario({ file, request, expectedStatus }) {
  const startedAt = nowIso();
  let response = null;

  try {
    if (request.method === "GET") {
      response = await requestGet(request.url);
    } else {
      response = await requestJson(request);
    }
  } catch (err) {
    response = { status: 0, json: { error: "network_error", message: String(err?.message ?? err) } };
  }

  const evidence = {
    request: { method: request.method, url: request.url, body: request.body ?? null },
    response: { status: response.status, body: response.json },
    expected: { status: expectedStatus },
    startedAt,
    finishedAt: nowIso(),
  };

  await writeJson(file, evidence);
  return { file, status: response.status, expected: expectedStatus, body: response.json };
}

async function cleanupCarrinho() {
  const url = `${BASE_CONNECT}${PREFIX}/carrinho/${CLIENTE_ID}`;
  const res = await requestGet(url);
  const carrinho = asRecord(res.json?.data) ?? null;
  const itens = safeArray(carrinho?.itens);

  for (const item of itens) {
    const itemObj = asRecord(item);
    const itemId = Number.parseInt(String(itemObj?.itemId ?? "").trim(), 10);
    if (!Number.isFinite(itemId)) continue;
    await requestJson({
      method: "DELETE",
      url: `${BASE_CONNECT}${PREFIX}/carrinho/itens/${itemId}`,
      body: { clienteId: CLIENTE_ID },
    });
  }

  await requestJson({
    method: "DELETE",
    url: `${BASE_CONNECT}${PREFIX}/carrinho/cupom`,
    body: { clienteId: CLIENTE_ID },
  });
}

async function run() {
  const results = [];

  await cleanupCarrinho();

  results.push(
    await runScenario({
      file: "01-get-carrinho.response.json",
      request: {
        method: "GET",
        url: `${BASE_CONNECT}${PREFIX}/carrinho/${CLIENTE_ID}`,
      },
      expectedStatus: 200,
    })
  );

  results.push(
    await runScenario({
      file: "02-post-checkout-empty-cart.error.json",
      request: {
        method: "POST",
        url: `${BASE_CONNECT}${PREFIX}/checkout/sessoes`,
        body: { clienteId: CLIENTE_ID },
      },
      expectedStatus: 409,
    })
  );

  results.push(
    await runScenario({
      file: "03-post-carrinho-add-item.response.json",
      request: {
        method: "POST",
        url: `${BASE_CONNECT}${PREFIX}/carrinho/itens`,
        body: { clienteId: CLIENTE_ID, item: { produtoId: PRODUTO_ID, quantidade: 2 } },
      },
      expectedStatus: 201,
    })
  );

  results.push(
    await runScenario({
      file: "04-post-carrinho-apply-cupom.response.json",
      request: {
        method: "POST",
        url: `${BASE_CONNECT}${PREFIX}/carrinho/cupom`,
        body: { clienteId: CLIENTE_ID, codigo: "BEMVINDO10" },
      },
      expectedStatus: 200,
    })
  );

  const createSessao = await runScenario({
    file: "05-post-checkout-sessao.response.json",
    request: {
      method: "POST",
      url: `${BASE_CONNECT}${PREFIX}/checkout/sessoes`,
      body: {
        clienteId: CLIENTE_ID,
        contato: {
          nome: "Cliente Teste",
          email: "teste@exemplo.com",
          telefone: "11999990000",
        },
        enderecoEntrega: {
          cep: "01311000",
          logradouro: "Avenida Paulista",
          numero: "1000",
          complemento: "10º andar",
          bairro: "Bela Vista",
          cidade: "Sao Paulo",
          uf: "SP",
          pais: "BR",
          referencia: "protocolo checkout-connect-v1",
        },
      },
    },
    expectedStatus: 201,
  });
  results.push(createSessao);

  const checkoutId = Number.parseInt(String(createSessao?.body?.data?.checkoutId ?? "").trim(), 10);
  if (!Number.isFinite(checkoutId)) {
    await writeText(
      "relatorio-final.md",
      [
        "# Relatorio de Teste - checkout-connect-v1",
        "",
        `- Base URL: ${BASE_URL}`,
        `- Falhou: nao conseguiu extrair checkoutId da resposta (arquivo: ${createSessao.file}).`,
        "",
      ].join("\n")
    );
    process.exitCode = 1;
    return;
  }

  const listFrete = await runScenario({
    file: "06-get-frete-opcoes.response.json",
    request: {
      method: "GET",
      url: `${BASE_CONNECT}${PREFIX}/checkout/sessoes/${checkoutId}/entrega/frete/opcoes?cep=01311000`,
    },
    expectedStatus: 200,
  });
  results.push(listFrete);

  const opcoes = safeArray(listFrete?.body?.data?.opcoes);
  const first = asRecord(opcoes[0]) ?? null;
  const codigoFrete = String(first?.codigo ?? "").trim();
  if (!codigoFrete) {
    await writeText(
      "relatorio-final.md",
      [
        "# Relatorio de Teste - checkout-connect-v1",
        "",
        `- Base URL: ${BASE_URL}`,
        `- Falhou: nao conseguiu selecionar codigo de frete (arquivo: ${listFrete.file}).`,
        "",
      ].join("\n")
    );
    process.exitCode = 1;
    return;
  }

  results.push(
    await runScenario({
      file: "07-put-frete-selecionado.response.json",
      request: {
        method: "PUT",
        url: `${BASE_CONNECT}${PREFIX}/checkout/sessoes/${checkoutId}/entrega/frete`,
        body: { codigo: codigoFrete },
      },
      expectedStatus: 200,
    })
  );

  results.push(
    await runScenario({
      file: "08-post-finalizar-sem-pagamento.error.json",
      request: {
        method: "POST",
        url: `${BASE_CONNECT}${PREFIX}/checkout/sessoes/${checkoutId}/finalizar`,
        body: {},
      },
      expectedStatus: 409,
    })
  );

  results.push(
    await runScenario({
      file: "09-post-pix.response.json",
      request: {
        method: "POST",
        url: `${BASE_CONNECT}${PREFIX}/checkout/sessoes/${checkoutId}/pagamento/pix`,
        body: {},
      },
      expectedStatus: 200,
    })
  );

  results.push(
    await runScenario({
      file: "10-post-pix-confirmar.response.json",
      request: {
        method: "POST",
        url: `${BASE_CONNECT}${PREFIX}/checkout/sessoes/${checkoutId}/pagamento/pix/confirmar`,
        body: {},
      },
      expectedStatus: 200,
    })
  );

  const finalizar = await runScenario({
    file: "11-post-finalizar.response.json",
    request: {
      method: "POST",
      url: `${BASE_CONNECT}${PREFIX}/checkout/sessoes/${checkoutId}/finalizar`,
      body: {},
    },
    expectedStatus: 201,
  });
  results.push(finalizar);

  const pedidoId = Number.parseInt(String(finalizar?.body?.data?.pedidoId ?? "").trim(), 10);
  if (!Number.isFinite(pedidoId)) {
    await writeText(
      "relatorio-final.md",
      [
        "# Relatorio de Teste - checkout-connect-v1",
        "",
        `- Base URL: ${BASE_URL}`,
        `- Falhou: checkout finalizado sem pedidoId (arquivo: ${finalizar.file}).`,
        "",
      ].join("\n")
    );
    process.exitCode = 1;
    return;
  }

  results.push(
    await runScenario({
      file: "12-get-pedido.response.json",
      request: {
        method: "GET",
        url: `${BASE_CONNECT}${PREFIX}/pedidos/${pedidoId}`,
      },
      expectedStatus: 200,
    })
  );

  results.push(
    await runScenario({
      file: "13-get-pedidos-list.response.json",
      request: {
        method: "GET",
        url: `${BASE_CONNECT}${PREFIX}/pedidos?clienteId=${CLIENTE_ID}&page=1&pageSize=20`,
      },
      expectedStatus: 200,
    })
  );

  const failures = results.filter((r) => r.status !== r.expected);

  const lines = [];
  lines.push("# Relatorio de Teste - checkout-connect-v1");
  lines.push("");
  lines.push(`- Base URL: ${BASE_URL}`);
  lines.push(`- ClienteId: ${CLIENTE_ID}`);
  lines.push(`- ProdutoId: ${PRODUTO_ID}`);
  lines.push("");
  lines.push("## Evidencias");
  for (const r of results) {
    lines.push(`- ${r.file}: ${r.status} (esperado ${r.expected})`);
  }
  lines.push("");
  lines.push("## Conclusao");
  if (failures.length) {
    lines.push(`Falhou: ${failures.map((f) => `${f.file} (${f.status} != ${f.expected})`).join(", ")}.`);
    lines.push("");
    lines.push("Recomendacao: revisar o endpoint/handler correspondente e reexecutar este protocolo.");
  } else {
    lines.push("OK: todos os endpoints bateram com os status esperados e evidencias foram geradas.");
  }
  lines.push("");
  await writeText("relatorio-final.md", lines.join("\n"));

  if (failures.length) {
    process.exitCode = 1;
    return;
  }
}

run().catch((err) => {
  process.stderr.write(`Erro ao executar protocolo: ${String(err?.message ?? err)}\n`);
  process.exitCode = 1;
});

