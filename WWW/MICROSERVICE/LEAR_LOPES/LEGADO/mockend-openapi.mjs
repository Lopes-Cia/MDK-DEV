import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function safeString(value) {
  return String(value ?? "").trim();
}

function toLowerSafe(value) {
  return safeString(value).toLowerCase();
}

function toUpperSafe(value) {
  return safeString(value).toUpperCase();
}

function normalizeMethodList(method) {
  const raw = safeString(method);
  if (!raw) return [];
  return raw
    .split("|")
    .map((m) => toLowerSafe(m))
    .filter(Boolean);
}

function pathFromUri(uri) {
  let p = safeString(uri);
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replaceAll("<rest...>", "{rest}");
  p = p.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
  if (p.endsWith("*")) p = `${p.slice(0, -1)}{wildcard}`;
  return p;
}

function buildServerPaths(endpoint) {
  const group = safeString(endpoint?.group);
  const uri = safeString(endpoint?.uri);
  const basePrefix =
    group === "connect"
      ? "/connect"
      : group === "auth"
        ? "/ApiLopes/webservice/api"
        : "";
  return `${basePrefix}${pathFromUri(uri)}`;
}

function guessContentTypeFromResult(data) {
  if (!data) return "application/json";
  if (typeof data === "string") return "text/plain";
  return "application/json";
}

async function readJsonIfExists(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildPathParametersFromOpenApiPath(openapiPath) {
  const params = [];
  const re = /\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(openapiPath))) {
    const name = safeString(m[1]);
    if (!name) continue;
    if (params.some((p) => p.name === name)) continue;
    params.push({
      name,
      in: "path",
      required: true,
      schema: { type: "string" },
    });
  }
  return params;
}

function buildQueryParameters(keys) {
  if (!Array.isArray(keys) || !keys.length) return [];
  return keys.map((name) => ({
    name,
    in: "query",
    required: false,
    schema: { type: "string" },
  }));
}

function buildRequestBody(bodyHint) {
  if (!bodyHint?.usesJsonBody) return null;
  const keys = Array.isArray(bodyHint.keys) ? bodyHint.keys : [];
  const properties = {};
  for (const k of keys) properties[k] = { type: "string" };
  return {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties,
          additionalProperties: true,
        },
      },
    },
  };
}

function buildResponseFromExample(exampleObj) {
  const status = Number(exampleObj?.response?.status ?? 200) || 200;
  const body = exampleObj?.data ?? null;
  const contentType = guessContentTypeFromResult(body);
  return {
    status,
    response: {
      description: "Resposta (capturada).",
      content: {
        [contentType]: {
          schema: { type: "object", additionalProperties: true },
          example: body ?? {},
        },
      },
    },
  };
}

function buildResponseFromStaticExample(example, contentTypeRaw) {
  const body = example ?? {};
  const contentType = safeString(contentTypeRaw) || guessContentTypeFromResult(body);
  return {
    status: 200,
    response: {
      description: "Resposta (exemplo do mock).",
      content: {
        [contentType.includes("json") ? "application/json" : contentType]: {
          schema: { type: "object", additionalProperties: true },
          example: body,
        },
      },
    },
  };
}

function buildDefaultResponses() {
  return {
    400: { description: "Bad Request" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Not Found" },
    405: { description: "Method Not Allowed" },
    500: { description: "Internal Server Error" },
  };
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const docsDir = path.join(__dirname, "DOCS", "mock-end-deep");
  const endpointsPath = path.join(docsDir, "endpoints.json");
  const outPath = path.join(docsDir, "openapi.mock-end.json");

  const endpointsDoc = await readJsonIfExists(endpointsPath);
  const endpoints = Array.isArray(endpointsDoc?.endpoints) ? endpointsDoc.endpoints : [];

  const spec = {
    openapi: "3.0.3",
    info: {
      title: "MOCK-END",
      version: "0.1.0",
      description:
        "Swagger gerado a partir das rotas declarativas do MOCK-END e exemplos capturados em LEAR_LOPES/data.",
    },
    servers: [{ url: "http://localhost:4000" }],
    components: {
      securitySchemes: {
        Authorization: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
        },
      },
    },
    paths: {},
  };

  for (const e of endpoints) {
    const methods = normalizeMethodList(e.method);
    if (!methods.length) continue;

    const openapiPath = buildServerPaths(e);
    if (!spec.paths[openapiPath]) spec.paths[openapiPath] = {};

    const summaryParts = [];
    const summary = safeString(e.summary);
    if (summary) summaryParts.push(summary);
    const authLabel = safeString(e.authLabel);
    if (authLabel) summaryParts.push(authLabel);
    const handlerClass = safeString(e.handler?.handler_class);
    const handlerFn = safeString(e.handler?.handler_function);
    if (handlerClass && handlerFn) summaryParts.push(`handler: ${handlerClass}.${handlerFn}`);

    const queryKeys = Array.isArray(e.analysis?.queryKeys) ? e.analysis.queryKeys : [];
    const bodyHint = e.analysis?.body ?? null;
    const requestBody = buildRequestBody(bodyHint);

    const params = [
      ...buildPathParametersFromOpenApiPath(openapiPath),
      ...buildQueryParameters(queryKeys),
    ];

    const security = safeString(e.authMode) === "required" ? [{ Authorization: [] }] : [];

    let captured = null;
    if (e.example?.resultJson) {
      const resultObj = await readJsonIfExists(e.example.resultJson);
      if (resultObj) captured = buildResponseFromExample(resultObj);
    }
    if (!captured && e.response?.example) {
      captured = buildResponseFromStaticExample(e.response.example, e.response.contentType);
    }

    for (const m of methods) {
      const op = {
        tags: [safeString(e.group) || "mock-end"],
        summary: summaryParts.join(" | ") || `${toUpperSafe(m)} ${openapiPath}`,
        operationId: safeString(e.id) ? `${safeString(e.id)}__${m}` : `${m}__${openapiPath}`,
        parameters: params.length ? params : undefined,
        requestBody: requestBody ?? undefined,
        responses: {
          ...(captured ? { [String(captured.status)]: captured.response } : {}),
          ...buildDefaultResponses(),
        },
        security: security.length ? security : undefined,
      };
      spec.paths[openapiPath][m] = op;
    }
  }

  await fs.writeFile(outPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
  process.stdout.write(`OK: ${outPath}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err?.message ?? err}\n`);
  process.exitCode = 1;
});
