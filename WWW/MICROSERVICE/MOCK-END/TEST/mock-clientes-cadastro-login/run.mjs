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

function hasSenhaLeak(obj) {
  const stack = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (Object.prototype.hasOwnProperty.call(cur, "senha")) return true;
    for (const v of Object.values(cur)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return false;
}

async function run() {
  const seed = uniqueSeed();
  const email = `cadastro.login.${seed}@exemplo.com`;
  const documento = `DOC-${seed}`;
  const senha = "123456";

  const cadastroPayload = {
    tipoPessoa: "PF",
    documento,
    nome: "Cliente Cadastro Login",
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

  const results = [];

  const cadastroStartedAt = nowIso();
  const cadastroRes = await postJson(endpointCadastro, cadastroPayload);
  const cadastroEvidence = {
    request: { method: "POST", url: endpointCadastro, body: cadastroPayload },
    response: { status: cadastroRes.status, body: cadastroRes.json },
    expected: { status: 201 },
    startedAt: cadastroStartedAt,
    finishedAt: nowIso(),
  };
  await writeJson("01-cadastro.response.json", cadastroEvidence);
  results.push({ step: "cadastro", status: cadastroRes.status, expected: 201, file: "01-cadastro.response.json" });

  let createdClienteId = null;
  if (cadastroRes.status === 201) {
    const id = cadastroRes.json?.data?.cliente?.id;
    createdClienteId = typeof id === "number" ? id : null;
  }

  const loginPayload = { email, senha };
  const loginStartedAt = nowIso();
  const loginRes = cadastroRes.status === 201 ? await postJson(endpointLogin, loginPayload) : { status: 0, json: { error: "skipped_because_cadastro_failed" } };
  const loginEvidence = {
    request: { method: "POST", url: endpointLogin, body: loginPayload },
    response: { status: loginRes.status, body: loginRes.json },
    expected: { status: 200 },
    startedAt: loginStartedAt,
    finishedAt: nowIso(),
  };
  await writeJson("02-login.response.json", loginEvidence);
  results.push({ step: "login", status: loginRes.status, expected: 200, file: "02-login.response.json" });

  const validations = [];
  const loginClienteId = loginRes.json?.data?.cliente?.id;
  const loginEmail = loginRes.json?.data?.cliente?.email;

  validations.push({
    name: "cadastro-retorna-cliente-id",
    ok: createdClienteId != null,
    details: { createdClienteId },
  });
  validations.push({
    name: "login-retorna-mesmo-id",
    ok: createdClienteId != null && loginRes.status === 200 && loginClienteId === createdClienteId,
    details: { createdClienteId, loginClienteId },
  });
  validations.push({
    name: "login-retorna-mesmo-email",
    ok: loginRes.status === 200 && loginEmail === email,
    details: { email, loginEmail },
  });
  validations.push({
    name: "nao-vaza-senha-no-login",
    ok: loginRes.status !== 200 ? true : !hasSenhaLeak(loginRes.json),
    details: { senhaLeak: loginRes.status === 200 ? hasSenhaLeak(loginRes.json) : null },
  });

  await writeJson("03-validacoes.json", { validations });

  const failures = results.filter((r) => r.status !== r.expected);
  const validationFailures = validations.filter((v) => !v.ok);

  const lines = [];
  lines.push("# Relatório final — mock-clientes-cadastro-login");
  lines.push("");
  lines.push(`- Base URL: ${BASE_URL}`);
  lines.push(`- Endpoint cadastro: ${endpointCadastro}`);
  lines.push(`- Endpoint login: ${endpointLogin}`);
  lines.push(`- Seed: ${seed}`);
  lines.push("");
  lines.push("## Resultados");
  for (const r of results) {
    lines.push(`- ${r.step}: ${r.status} (esperado ${r.expected}) — ${r.file}`);
  }
  lines.push("");
  lines.push("## Validações");
  for (const v of validations) {
    lines.push(`- ${v.name}: ${v.ok ? "OK" : "FALHOU"}`);
  }
  lines.push("");
  lines.push("## Conclusão");
  if (failures.length || validationFailures.length) {
    const parts = [];
    if (failures.length) parts.push(`status divergentes: ${failures.map((f) => f.step).join(", ")}`);
    if (validationFailures.length) parts.push(`validações falharam: ${validationFailures.map((v) => v.name).join(", ")}`);
    lines.push(`Falhou: ${parts.join(" | ")}.`);
  } else {
    lines.push("OK: cadastro e login do cliente recém-cadastrado validados.");
  }
  lines.push("");

  await writeText("relatorio-final.md", lines.join("\n"));

  if (failures.length || validationFailures.length) {
    process.exitCode = 1;
    return;
  }

  process.stdout.write("OK: evidências geradas.\n");
}

run().catch((err) => {
  process.stderr.write(`Erro ao executar cenários: ${String(err?.message ?? err)}\n`);
  process.exitCode = 1;
});

