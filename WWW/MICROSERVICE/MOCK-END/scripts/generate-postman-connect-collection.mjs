import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "postman");
const OUT_FILE = path.join(OUT_DIR, "mock-end-connect.postman_collection.json");

function request({
  name,
  method,
  url,
  headers = [],
  bodyJson,
  description,
}) {
  return {
    name,
    ...(description ? { description } : {}),
    request: {
      method,
      header: headers,
      url,
      ...(bodyJson
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

function main() {
  const collection = {
    info: {
      name: "MOCK-END - Connect + Tenant",
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    variable: [
      { key: "baseUrl", value: "http://localhost:4000" },
      { key: "AUTH_BASE_URL", value: "http://localhost:4000" },
      { key: "INTEGRATION_URL_API", value: "http://localhost:4000" },
      { key: "authorizationToken", value: "mock-integrator-token" },
      { key: "PRODUTO", value: "CONNECT" },
      { key: "EAN", value: 7890000002998 },
      { key: "IDINTEGRADORA", value: 8 },
      { key: "CODCLI", value: 1219 },
      { key: "KEY", value: "ODtDT05ORUNUOzEyMTk=" },
      { key: "COD_PROD", value: 2001 },
      { key: "tenant", value: "mercearia-lopes" },
      { key: "TENANT_CATEGORY_SLUG", value: "bebidas" },
      { key: "TENANT_PRODUCT_SLUG", value: "achocolatado-nescau-400g" },
      { key: "TENANT_JSON_PATH", value: "CONTEXTO/contexto.json" },
      { key: "TENANT_JSON_DIR", value: "CATALOGO" },
      { key: "TENANT_ASSET_PATH", value: "THEMA/assets/images/produtos/test.png" },
    ],
    item: [
      {
        name: "CONNECT",
        item: [
          {
            name: "Internos (/api)",
            item: [
              request({
                name: "Auth - Register",
                method: "POST",
                url: "{{baseUrl}}/api/auth/register",
                headers: [{ key: "Content-Type", value: "application/json" }],
                bodyJson: {
                  responsavel: "Operador Mock",
                  cnpj: "00.000.000/0000-00",
                  email: "operador@mock.local",
                  whatsapp: "5511999999999",
                },
              }),
              request({
                name: "Auth - Send Token",
                method: "POST",
                url: "{{baseUrl}}/api/auth/send-token",
                headers: [{ key: "Content-Type", value: "application/json" }],
                bodyJson: {
                  email: "operador@mock.local",
                },
              }),
              request({
                name: "Auth - Verify Token",
                method: "POST",
                url: "{{baseUrl}}/api/auth/verify-token",
                headers: [{ key: "Content-Type", value: "application/json" }],
                bodyJson: {
                  token: "123456",
                },
                description:
                  "Use o tokenPreview retornado em Auth - Send Token para validar.",
              }),
              request({
                name: "Auth - Me",
                method: "GET",
                url: "{{baseUrl}}/api/auth/me",
              }),
              request({
                name: "Auth - Logout",
                method: "POST",
                url: "{{baseUrl}}/api/auth/logout",
              }),
              request({
                name: "Products - List",
                method: "GET",
                url: "{{baseUrl}}/api/products?idIntegradora={{IDINTEGRADORA}}",
              }),
              request({
                name: "Products - Detail",
                method: "GET",
                url: "{{baseUrl}}/api/products/{{COD_PROD}}?idIntegradora={{IDINTEGRADORA}}",
              }),
            ],
          },
          {
            name: "Externos - AUTH_BASE_URL",
            item: [
              request({
                name: "tokenService - Generate",
                method: "POST",
                url: "{{AUTH_BASE_URL}}/tokenService",
                headers: [{ key: "Content-Type", value: "application/json" }],
                bodyJson: {
                  produto: "{{PRODUTO}}",
                  ean: "{{EAN}}",
                  idIntegradora: "{{IDINTEGRADORA}}",
                  codCli: "{{CODCLI}}",
                },
              }),
              request({
                name: "tokenService - Refresh",
                method: "POST",
                url: "{{AUTH_BASE_URL}}/tokenService",
                headers: [{ key: "Content-Type", value: "application/json" }],
                bodyJson: {
                  refreshToken: "mock-refresh-token",
                },
              }),
              request({
                name: "postAutenteicaAplicativo",
                method: "POST",
                url: "{{AUTH_BASE_URL}}/postAutenteicaAplicativo",
                headers: [
                  { key: "Content-Type", value: "application/json" },
                  { key: "Authorization", value: "{{authorizationToken}}" },
                ],
                bodyJson: {
                  chaveAtivacao: "{{KEY}}",
                  responsavel: "Operador Mock",
                  cnpj: "00.000.000/0000-00",
                  email: "operador@mock.local",
                  whatsapp: "5511999999999",
                },
              }),
              request({
                name: "enviarToken",
                method: "POST",
                url: "{{AUTH_BASE_URL}}/enviarToken?email=operador%40mock.local",
                headers: [{ key: "Authorization", value: "{{authorizationToken}}" }],
              }),
              request({
                name: "verificarTokenSistema",
                method: "POST",
                url: "{{AUTH_BASE_URL}}/verificarTokenSistema?token=123456",
                headers: [{ key: "Authorization", value: "{{authorizationToken}}" }],
                description:
                  "Use o tokenPreview retornado em enviarToken (ou no fluxo interno) para validar.",
              }),
              request({
                name: "getOperadorSistemaForId",
                method: "GET",
                url: "{{AUTH_BASE_URL}}/getOperadorSistemaForId?id=1",
                headers: [{ key: "Authorization", value: "{{authorizationToken}}" }],
              }),
            ],
          },
          {
            name: "Externos - INTEGRATION_URL_API",
            item: [
              request({
                name: "getIntegradora",
                method: "GET",
                url: "{{INTEGRATION_URL_API}}/Servidor/webservice/integration/getIntegradora?id={{IDINTEGRADORA}}",
                headers: [{ key: "Authorization", value: "{{authorizationToken}}" }],
              }),
              request({
                name: "getListProdutoLoja",
                method: "GET",
                url: "{{INTEGRATION_URL_API}}/Servidor/webservice/integration/getListProdutoLoja?idIntegradora={{IDINTEGRADORA}}",
                headers: [{ key: "Authorization", value: "{{authorizationToken}}" }],
              }),
              request({
                name: "getProdutoLoja",
                method: "GET",
                url: "{{INTEGRATION_URL_API}}/Servidor/webservice/integration/getProdutoLoja?idIntegradora={{IDINTEGRADORA}}&codProd={{COD_PROD}}",
                headers: [{ key: "Authorization", value: "{{authorizationToken}}" }],
              }),
            ],
          },
        ],
      },
      {
        name: "TENANT",
        item: [
          request({
            name: "Categorias (list)",
            method: "GET",
            url: "{{baseUrl}}/api/tenant/{{tenant}}/catalogo/categorias",
          }),
          request({
            name: "Categorias (detail)",
            method: "GET",
            url: "{{baseUrl}}/api/tenant/{{tenant}}/catalogo/categorias/{{TENANT_CATEGORY_SLUG}}",
          }),
          request({
            name: "Produtos (list)",
            method: "GET",
            url: "{{baseUrl}}/api/tenant/{{tenant}}/catalogo/produtos",
          }),
          request({
            name: "Produtos (detail)",
            method: "GET",
            url: "{{baseUrl}}/api/tenant/{{tenant}}/catalogo/produtos/{{TENANT_PRODUCT_SLUG}}",
          }),
          request({
            name: "JSON (get)",
            method: "GET",
            url: "{{baseUrl}}/api/tenant/{{tenant}}/json?path={{TENANT_JSON_PATH}}",
          }),
          request({
            name: "JSON (list)",
            method: "GET",
            url: "{{baseUrl}}/api/tenant/{{tenant}}/json/list?dir={{TENANT_JSON_DIR}}",
          }),
          request({
            name: "JSON (put)",
            method: "PUT",
            url: "{{baseUrl}}/api/tenant/{{tenant}}/json?path={{TENANT_JSON_PATH}}",
            headers: [{ key: "Content-Type", value: "application/json" }],
            bodyJson: {
              tenantId: "{{tenant}}",
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
          }),
          request({
            name: "JSON (delete)",
            method: "DELETE",
            url: "{{baseUrl}}/api/tenant/{{tenant}}/json?path={{TENANT_JSON_PATH}}",
          }),
          request({
            name: "Assets (put)",
            method: "PUT",
            url: "{{baseUrl}}/api/tenant/{{tenant}}/assets?path={{TENANT_ASSET_PATH}}",
            description:
              "Envie o body como binary (ex.: PNG) para salvar em THEMA/assets/images/.",
          }),
          request({
            name: "Assets (delete)",
            method: "DELETE",
            url: "{{baseUrl}}/api/tenant/{{tenant}}/assets?path={{TENANT_ASSET_PATH}}",
          }),
        ],
      },
    ],
  };

  return collection;
}

const collection = main();
await fs.mkdir(OUT_DIR, { recursive: true });
await fs.writeFile(OUT_FILE, JSON.stringify(collection, null, 2) + "\n", "utf8");
process.stdout.write(`Postman collection gerada em: ${OUT_FILE}\n`);
