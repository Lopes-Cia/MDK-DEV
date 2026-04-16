import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.MOCK_END_BASE_URL ?? "http://localhost:4000";
const endpoint = `${BASE_URL}/connect/Servidor/webservice/integration/clientes/login`;

async function postJson(payload) {
  const res = await fetch(endpoint, {
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

async function run() {
  const scenarios = [
    {
      file: "01-login-ok.response.json",
      payload: { email: "teste@exemplo.com", senha: "123456" },
      expectStatus: 200,
    },
    {
      file: "02-login-email-invalido.error.json",
      payload: { email: "nao-existe@exemplo.com", senha: "123456" },
      expectStatus: 401,
    },
    {
      file: "03-login-senha-invalida.error.json",
      payload: { email: "teste@exemplo.com", senha: "senha_errada" },
      expectStatus: 401,
    },
    {
      file: "04-login-inativo.error.json",
      payload: { email: "inativo@exemplo.com", senha: "123456" },
      expectStatus: 403,
    },
  ];

  const results = [];

  for (const s of scenarios) {
    const startedAt = nowIso();
    const res = await postJson(s.payload);

    const evidence = {
      request: { method: "POST", url: endpoint, body: s.payload },
      response: { status: res.status, body: res.json },
      expected: { status: s.expectStatus },
      startedAt,
      finishedAt: nowIso(),
    };

    await writeJson(s.file, evidence);
    results.push({ file: s.file, status: res.status, expected: s.expectStatus });
  }

  const failures = results.filter((r) => r.status !== r.expected);

  const lines = [];
  lines.push("# Relatório final — mock-clientes-login");
  lines.push("");
  lines.push(`- Base URL: ${BASE_URL}`);
  lines.push(`- Endpoint: ${endpoint}`);
  lines.push("");
  lines.push("## Resultados");
  for (const r of results) {
    lines.push(`- ${r.file}: ${r.status} (esperado ${r.expected})`);
  }
  lines.push("");
  lines.push("## Conclusão");
  if (failures.length) {
    lines.push(`Falhou: ${failures.map((f) => `${f.file} (${f.status} != ${f.expected})`).join(", ")}.`);
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
