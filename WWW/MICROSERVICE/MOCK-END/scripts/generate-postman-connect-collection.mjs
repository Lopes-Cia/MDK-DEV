import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "postman");
const OUT_FILE = path.join(OUT_DIR, "mock-end-dynamic.postman_collection.json");

const DEFAULT_BODIES = {
  "/api/auth/register": {
    responsavel: "Operador Mock",
    cnpj: "00.000.000/0000-00",
    email: "operador@mock.local",
    whatsapp: "5511999999999",
  },
  "/api/auth/send-token": {
    email: "operador@mock.local",
  },
  "/api/auth/verify-token": {
    token: "123456",
  },
  "/tokenService": {
    raw: "{\n  \"produto\": \"{{PRODUTO}}\",\n  \"ean\": {{EAN}},\n  \"idIntegradora\": {{IDINTEGRADORA}},\n  \"codCli\": {{CODCLI}}\n}",
  },
  "/postAutenteicaAplicativo": {
    chaveAtivacao: "{{KEY}}",
    responsavel: "Operador Mock",
    cnpj: "00.000.000/0000-00",
    email: "operador@mock.local",
    whatsapp: "5511999999999",
  },
};

function request({
  name,
  method,
  url,
  headers = [],
  bodyJson,
  bodyRaw,
  description,
}) {
  return {
    name,
    ...(description ? { description } : {}),
    request: {
      method,
      header: headers,
      url,
      ...(bodyRaw
        ? {
            body: {
              mode: "raw",
              raw: bodyRaw,
              options: { raw: { language: "json" } },
            },
          }
        : bodyJson
          ? {
              body: {
                mode: "raw",
                raw: JSON.stringify(bodyJson, null, 2),
                options: { raw: { language: "json" } },
              },
            }
          : {}),
    },
  };
}

async function loadProjectRoutes(projectDirName) {
  const routesFile = path.join(ROOT, "PROJETOS", projectDirName, "routes.mjs");
  try {
    const fileUrl = pathToFileURL(routesFile).href;
    const mod = await import(fileUrl);
    return mod.routes || [];
  } catch (err) {
    return [];
  }
}

function parseUrlVariables(uri) {
  // Substitui :param por {{param}} para o Postman
  return uri.replace(/:([a-zA-Z0-9_]+)/g, "{{$1}}");
}

async function main() {
  const collection = {
    info: {
      name: "MOCK-END - Projetos Dinâmicos",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    variable: [
      { key: "baseUrl", value: "http://localhost:4000" },
      { key: "authorizationToken", value: "mock-integrator-token" },
      { key: "PRODUTO", value: "CONNECT" },
      { key: "EAN", value: 7890000002998 },
      { key: "IDINTEGRADORA", value: 8 },
      { key: "CODCLI", value: 1219 },
      { key: "KEY", value: "ODtDT05ORUNUOzEyMTk=" },
      { key: "codProd", value: 2001 }
    ],
    item: [],
  };

  // 1. Carrega rotas do 'connect'
  const connectRoutes = await loadProjectRoutes("connect");
  if (connectRoutes.length > 0) {
    const connectFolder = {
      name: "Connect (Internos)",
      item: connectRoutes.map(r => {
        const authHeader = r.auth?.mode === "required" 
          ? [{ key: "Authorization", value: "{{authorizationToken}}" }] 
          : [];

        return request({
          name: `${r.handler_class} - ${r.handler_function}`,
          method: String(r.method).toUpperCase(),
          url: `{{baseUrl}}${parseUrlVariables(r.uri)}`,
          headers: [
            { key: "Content-Type", value: "application/json" },
            ...authHeader
          ],
          description: `Execution mode: ${r.execution?.mode}\nAuth mode: ${r.auth?.mode}`,
          ...(String(r.method).toUpperCase() === "POST" 
              ? (DEFAULT_BODIES[r.uri]?.raw
                  ? { bodyRaw: DEFAULT_BODIES[r.uri].raw }
                  : { bodyJson: DEFAULT_BODIES[r.uri] || {} })
              : {})
        });
      })
    };
    collection.item.push(connectFolder);
  }

  // 2. Carrega rotas da 'ApiLopes/webservice/api' (usam {{baseUrl}}/ApiLopes/webservice/api)
  const apiLopesRoutes = await loadProjectRoutes(path.join("ApiLopes", "webservice", "api"));
  if (apiLopesRoutes.length > 0) {
    const apiLopesFolder = {
      name: "ApiLopes (Auth Base)",
      item: apiLopesRoutes.map(r => {
        const authHeader = r.auth?.mode === "required" 
          ? [{ key: "Authorization", value: "{{authorizationToken}}" }] 
          : [];
          
        return request({
          name: `${r.handler_class} - ${r.handler_function}`,
          method: String(r.method).toUpperCase(),
          url: `{{baseUrl}}/ApiLopes/webservice/api${parseUrlVariables(r.uri)}`,
          headers: [
            { key: "Content-Type", value: "application/json" },
            ...authHeader
          ],
          description: `Execution mode: ${r.execution?.mode}\nAuth mode: ${r.auth?.mode}`,
          ...(String(r.method).toUpperCase() === "POST" 
              ? (DEFAULT_BODIES[r.uri]?.raw
                  ? { bodyRaw: DEFAULT_BODIES[r.uri].raw }
                  : { bodyJson: DEFAULT_BODIES[r.uri] || {} })
              : {})
        });
      })
    };
    collection.item.push(apiLopesFolder);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(collection, null, 2) + "\n", "utf8");
  process.stdout.write(`Postman collection gerada dinamicamente em: ${OUT_FILE}\n`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
