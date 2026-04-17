import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = __dirname;
const specPath = path.join(docsDir, "api-docs.json");
const contractReportPath = path.join(docsDir, "contract", "report.md");

const outReportPath = path.join(docsDir, "PRODUTOS_GET.md");
const outSchemasDir = path.join(docsDir, "schemas");
const outEndpointsPath = path.join(docsDir, "endpoints.produtos.get.txt");

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));

const baseUrls = Array.isArray(spec?.servers)
  ? spec.servers.map((s) => s?.url).filter(Boolean)
  : [];
const baseUrl = baseUrls[0] ?? "";

function stableJson(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function refName(ref) {
  const prefix = "#/components/schemas/";
  if (typeof ref !== "string") return null;
  if (!ref.startsWith(prefix)) return null;
  return ref.slice(prefix.length);
}

function collectRefs(node, acc) {
  if (!node || typeof node !== "object") return;
  if (typeof node.$ref === "string") {
    const name = refName(node.$ref);
    if (name) acc.add(name);
  }
  if (Array.isArray(node)) {
    for (const item of node) collectRefs(item, acc);
    return;
  }
  for (const v of Object.values(node)) collectRefs(v, acc);
}

function schemaToType(schema) {
  if (!schema || typeof schema !== "object") return "";
  if (schema.$ref) return refName(schema.$ref) ?? schema.$ref;
  const t = schema.type ?? "";
  const f = schema.format ? `(${schema.format})` : "";
  if (Array.isArray(schema.enum)) return `${t}${f} enum[${schema.enum.length}]`;
  return `${t}${f}`.trim();
}

function safeFileName(name) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_");
}

const endpoints = [];

for (const [p, item] of Object.entries(spec.paths ?? {})) {
  const op = item?.get;
  if (!op) continue;
  const tags = Array.isArray(op.tags) ? op.tags : [];
  if (!tags.includes("Produto")) continue;

  const params = Array.isArray(op.parameters) ? op.parameters : [];
  const responses = op.responses ?? {};
  const responsesSlim = {};
  for (const [code, r] of Object.entries(responses)) {
    const content = r?.content?.["application/json"] ?? r?.content?.["*/*"];
    const schema = content?.schema ?? null;
    responsesSlim[code] = {
      description: r?.description ?? "",
      schema,
    };
  }

  endpoints.push({
    method: "GET",
    path: p,
    operationId: op.operationId ?? "",
    summary: op.summary ?? "",
    description: op.description ?? "",
    parameters: params.map((pp) => ({
      name: pp?.name ?? "",
      in: pp?.in ?? "",
      required: Boolean(pp?.required),
      description: pp?.description ?? "",
      schema: pp?.schema ?? null,
    })),
    responses: responsesSlim,
  });
}

endpoints.sort((a, b) => a.path.localeCompare(b.path));

const schemaNames = new Set();
for (const e of endpoints) {
  for (const r of Object.values(e.responses)) {
    collectRefs(r?.schema, schemaNames);
  }
  for (const p of e.parameters) {
    collectRefs(p?.schema, schemaNames);
  }
}

fs.mkdirSync(outSchemasDir, { recursive: true });

const schemas = spec?.components?.schemas ?? {};
const toProcess = new Set(schemaNames);
for (;;) {
  const before = toProcess.size;
  for (const name of Array.from(toProcess)) {
    const schema = schemas[name];
    if (!schema) continue;
    const nested = new Set();
    collectRefs(schema, nested);
    for (const n of nested) toProcess.add(n);
  }
  if (toProcess.size === before) break;
}

const writtenSchemas = [];
for (const name of Array.from(toProcess).sort((a, b) => a.localeCompare(b))) {
  const schema = schemas[name];
  if (!schema) continue;
  const fileName = safeFileName(name) + ".json";
  const outPath = path.join(outSchemasDir, fileName);
  fs.writeFileSync(outPath, stableJson(schema), "utf8");
  writtenSchemas.push({ name, file: `schemas/${fileName}` });
}

const endpointLines = endpoints.map((e) => `${e.method} ${e.path} opId=${e.operationId}`) .join("\n") + "\n";
fs.writeFileSync(outEndpointsPath, endpointLines, "utf8");

let mockOnlyLines = [];
try {
  const report = fs.readFileSync(contractReportPath, "utf8");
  mockOnlyLines = report
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- GET /Servidor/webservice/integration/produtos"));
} catch {}

function mdEscape(s) {
  return String(s ?? "").replaceAll("\r", "");
}

function mdCode(s) {
  const v = String(s ?? "");
  return "`" + v.replaceAll("`", "\\`") + "`";
}

const lines = [];
lines.push("# Produtos GET — Análise (Lopes 9004)");
lines.push("");
lines.push("Fonte: apenas artefatos em `DOCS/lopes_9004` (OpenAPI `api-docs.json`, índices locais e `contract/report.md`).");
lines.push("");
lines.push("## Base URL e autenticação");
lines.push("");
lines.push(`- Base (OpenAPI servers[0]): ${baseUrl ? mdCode(baseUrl) : "_não informado no OpenAPI_"}`);
lines.push("- Auth: header `Authorization: <token>` (security global no OpenAPI).");
lines.push("- Observação: a pasta é rotulada 9004, mas o OpenAPI aponta 9005; trate como variação de ambiente (host/porta), mantendo o path do endpoint.");
lines.push("");
lines.push("## Guia rápido (como acessar produtos)");
lines.push("");
lines.push("Padrão dominante no OpenAPI (tag `Produto`):");
lines.push("- Quase todos os endpoints exigem `idIntegradora` (query) como parâmetro obrigatório.");
lines.push("- Para identificar produto, os filtros mais recorrentes são: `codProd`, `ean`, `skuId`, `productId`, `descricaoErp` (todos query).");
lines.push("");
const byOpId = new Map(endpoints.map((e) => [e.operationId, e]));
function response200Shape(e) {
  const r = e?.responses?.["200"]?.schema;
  if (!r || typeof r !== "object") return "";
  if (r.type === "array") return "lista";
  return "objeto";
}
const quickGroups = [
  {
    title: "Produto (lista)",
    opIds: ["getListProduto", "getListProdutoLoja", "getListProdutoOnfood", "getListProdutoPresta"],
  },
  {
    title: "Produto (detalhe)",
    opIds: ["getProduto", "getProdutoLoja", "getProdutoOnfood", "getProdutoPresta"],
  },
  {
    title: "Categoria / vínculo",
    opIds: ["getListCategoria", "getCategoria", "getListVinculoCatMercadoLivre", "getVinculoCatMercadoLivre", "getListVinculoCategoriaProdutoLoja"],
  },
  {
    title: "Preço",
    opIds: ["getListPreco", "getPreco", "getListPrecoPromo", "getListPrecoMagento", "getPrecoMagento", "getListPrecoOnfood", "getPrecoOnfood", "getListPrecoPresta", "getPrecoPresta", "getPrecoProdutoPresta"],
  },
  {
    title: "Variante / SKU",
    opIds: ["getVariante", "getProximoSkuId", "getProximoSkuIdOnfood", "getProximoSkuIdPresta"],
  },
];
for (const g of quickGroups) {
  const present = g.opIds.map((id) => byOpId.get(id)).filter(Boolean);
  if (present.length === 0) continue;
  lines.push(`**${g.title}**`);
  for (const e of present) {
    const shape = response200Shape(e);
    const descHintsList = String(e.description ?? "").toLowerCase().includes("lista");
    const mismatch = descHintsList && shape === "objeto" ? " (descrição diz lista, schema 200 não é array)" : "";
    const extra = shape ? ` (${shape})` : "";
    lines.push(`- ${mdCode(e.operationId)} → ${mdCode(e.path)}${extra}${mismatch}`);
  }
  lines.push("");
}

lines.push("Exemplos de filtros (query) comuns:");
lines.push("");
lines.push("- `.../getListProduto?idIntegradora=1&codProd=123`");
lines.push("- `.../getProduto?idIntegradora=1&ean=789...`");
lines.push("- `.../getListProdutoLoja?idIntegradora=1&cnpjCliente=...&idCategoria=10`");
lines.push("");
lines.push("## Índice (OpenAPI — tag Produto, método GET)");
lines.push("");
lines.push("| Path | operationId | Parâmetros (query/path) |");
lines.push("|---|---|---|");
for (const e of endpoints) {
  const ps = e.parameters
    .map((p) => {
      const req = p.required ? "*" : "";
      const t = schemaToType(p.schema);
      return `${p.name}${req}:${p.in}${t ? `:${t}` : ""}`;
    })
    .join(", ");
  lines.push(`| ${mdCode(e.path)} | ${mdCode(e.operationId)} | ${mdEscape(ps)} |`);
}
lines.push("");

lines.push("## Detalhes por endpoint (OpenAPI)");
lines.push("");

for (const e of endpoints) {
  lines.push(`### GET ${e.path}`);
  lines.push("");
  if (e.operationId) lines.push(`- operationId: ${mdCode(e.operationId)}`);
  if (e.summary) lines.push(`- summary: ${mdEscape(e.summary)}`);
  if (e.description) lines.push(`- description: ${mdEscape(e.description)}`);
  lines.push("");
  lines.push("**Request**");
  lines.push("");
  const exampleUrl = baseUrl ? `${baseUrl}${e.path}` : e.path;
  lines.push("```http");
  lines.push(`GET ${exampleUrl}`);
  lines.push("Accept: application/json");
  lines.push("Authorization: <token>");
  lines.push("```");
  lines.push("");

  lines.push("**Parâmetros / filtros**");
  lines.push("");
  if (e.parameters.length === 0) {
    lines.push("- _Sem parâmetros declarados no OpenAPI._");
  } else {
    for (const p of e.parameters) {
      const req = p.required ? "required" : "optional";
      const t = schemaToType(p.schema);
      const desc = p.description ? ` — ${mdEscape(p.description)}` : "";
      lines.push(`- ${mdCode(p.name)} (${p.in}, ${req}${t ? `, ${t}` : ""})${desc}`);
    }
  }
  lines.push("");

  lines.push("**Responses**");
  lines.push("");
  const respEntries = Object.entries(e.responses);
  if (respEntries.length === 0) {
    lines.push("- _Sem responses declaradas no OpenAPI._");
  } else {
    for (const [code, r] of respEntries) {
      const desc = r?.description ? ` — ${mdEscape(r.description)}` : "";
      const schema = r?.schema ? stableJson(r.schema).trimEnd() : "";
      lines.push(`- ${mdCode(code)}${desc}`);
      if (schema) {
        lines.push("");
        lines.push("```json");
        lines.push(schema);
        lines.push("```");
      }
    }
  }
  lines.push("");
}

lines.push("## Schemas recortados (OpenAPI)");
lines.push("");
lines.push(`Arquivos gerados em ${mdCode("schemas/")} (extraídos de components.schemas e referenciados por endpoints GET tag Produto).`);
lines.push("");
if (writtenSchemas.length === 0) {
  lines.push("- _Nenhum schema referenciado via $ref foi encontrado nas respostas/params desses endpoints._");
} else {
  for (const s of writtenSchemas) {
    lines.push(`- ${mdCode(s.name)} → ${mdCode(s.file)}`);
  }
}
lines.push("");

lines.push("## Rotas mock-only (fora do OpenAPI)");
lines.push("");
lines.push("Estas rotas aparecem em `contract/report.md` como existentes no MOCK, mas não estão no `api-docs.json`. Trate como não-contratual.");
lines.push("");
if (mockOnlyLines.length === 0) {
  lines.push("- _Nenhuma rota mock-only de produtos (GET) foi encontrada no report._");
} else {
  for (const l of mockOnlyLines) lines.push(`- ${mdCode(l.replace(/^-\s+/, ""))}`);
}
lines.push("");

fs.writeFileSync(outReportPath, lines.join("\n"), "utf8");

process.stdout.write(
  stableJson({
    endpoints: endpoints.length,
    schemasWritten: writtenSchemas.length,
    out: {
      report: outReportPath,
      endpoints: outEndpointsPath,
      schemasDir: outSchemasDir,
    },
  })
);
