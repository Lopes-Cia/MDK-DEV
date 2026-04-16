import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.MOCK_END_BASE_URL ?? "http://localhost:4000";
const endpointCadastro = `${BASE_URL}/connect/Servidor/webservice/integration/clientes/cadastro`;
const endpointLogin = `${BASE_URL}/connect/Servidor/webservice/integration/clientes/login`;

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
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

function nowIso() {
  return new Date().toISOString();
}

function uniqueSeed() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function run() {
  const seed = uniqueSeed();
  const email = `cadastro.${seed}@exemplo.com`;
  const documento = `DOC-${seed}`;
  const senha = "123456";

  const payloadOk = {
    tipoPessoa: "PF",
    documento,
    nome: "Cliente Cadastro",
    email,
    whatsapp: "11999990000",
    senha,
    status: "ativo",
    doisFatores: { habilitado: false, metodo: "email" },
    enderecos: [
      {
        rotulo: "Casa",
        principal: true,
        cep: "01001000",
        logradouro: "Praça da Sé",
        numero: "100",
        complemento: "lado ímpar",
        bairro: "Sé",
        cidade: "São Paulo",
        uf: "SP",
        pais: "BR",
        referencia: "Perto da catedral",
      },
    ],
    privacidade: {
      aceitaMarketing: false,
      aceitaTermos: true,
      aceitaCookies: true,
      canalPreferido: "email",
    },
  };

  const scenarios = [
    {
      name: "cadastro-sem-enderecos",
      file: "01-cadastro-sem-enderecos.error.json",
      url: endpointCadastro,
      payload: { ...payloadOk, enderecos: undefined },
      expectStatus: 400,
    },
    {
      name: "cadastro-sem-privacidade",
      file: "02-cadastro-sem-privacidade.error.json",
      url: endpointCadastro,
      payload: { ...payloadOk, privacidade: undefined },
      expectStatus: 400,
    },
    {
      name: "cadastro-ok",
      file: "03-cadastro-ok.response.json",
      url: endpointCadastro,
      payload: payloadOk,
      expectStatus: 201,
    },
  ];

  const results = [];
  let cadastroOk = null;

  for (const s of scenarios) {
    const startedAt = nowIso();
    const res = await postJson(s.url, s.payload);

    const evidence = {
      request: { method: "POST", url: s.url, body: s.payload },
      response: { status: res.status, body: res.json },
      expected: { status: s.expectStatus },
      startedAt,
      finishedAt: nowIso(),
    };

    await writeJson(s.file, evidence);
    results.push({ name: s.name, file: s.file, status: res.status, expected: s.expectStatus });

    if (s.name === "cadastro-ok" && res.status === 201) {
      cadastroOk = res.json;
    }
  }

  const loginStartedAt = nowIso();
  let loginRes = null;
  let loginEvidence = null;
  let loginStatus = null;
  let loginExpected = 200;

  if (cadastroOk) {
    loginRes = await postJson(endpointLogin, { email, senha });
    loginStatus = loginRes.status;
    loginEvidence = {
      request: { method: "POST", url: endpointLogin, body: { email, senha } },
      response: { status: loginRes.status, body: loginRes.json },
      expected: { status: loginExpected },
      startedAt: loginStartedAt,
      finishedAt: nowIso(),
    };
  } else {
    loginStatus = 0;
    loginEvidence = {
      request: { method: "POST", url: endpointLogin, body: { email, senha } },
      response: { status: 0, body: { error: "skipped_because_cadastro_failed" } },
      expected: { status: loginExpected },
      startedAt: loginStartedAt,
      finishedAt: nowIso(),
    };
  }

  await writeJson("04-login-novo-cliente.response.json", loginEvidence);
  results.push({
    name: "login-novo-cliente",
    file: "04-login-novo-cliente.response.json",
    status: loginStatus,
    expected: loginExpected,
  });

  const failures = results.filter((r) => r.status !== r.expected);

  const lines = [];
  lines.push("# Relatório final — mock-clientes-cadastro");
  lines.push("");
  lines.push(`- Base URL: ${BASE_URL}`);
  lines.push(`- Endpoint cadastro: ${endpointCadastro}`);
  lines.push(`- Endpoint login: ${endpointLogin}`);
  lines.push(`- Seed: ${seed}`);
  lines.push("");
  lines.push("## Resultados");
  for (const r of results) {
    lines.push(`- ${r.name}: ${r.status} (esperado ${r.expected}) — ${r.file}`);
  }
  lines.push("");
  lines.push(`## Conclusão`);
  if (failures.length) {
    lines.push(`Falhou: ${failures.map((f) => `${f.name} (${f.status} != ${f.expected})`).join(", ")}.`);
  } else {
    lines.push("OK: todos os cenários bateram com os status esperados.");
  }
  lines.push("");

  await writeText("relatorio-final.md", lines.join("\n"));

  if (failures.length) {
    process.stderr.write(
      `Falhou: ${failures.map((f) => `${f.file} (status ${f.status} != ${f.expected})`).join(", ")}\n`
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write("OK: evidências geradas.\n");
}

run().catch((err) => {
  process.stderr.write(`Erro ao executar cenários: ${String(err?.message ?? err)}\n`);
  process.exitCode = 1;
});

