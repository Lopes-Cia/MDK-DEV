# MOCK-END: Endpoints Connect (Auth + Produtos + Integração) Spec

## Why
O projeto depende de serviços externos (AUTH_BASE_URL e INTEGRATION_URL_API) e de rotas internas `/api/*`. Para desenvolvimento local previsível, o MOCK-END deve simular esses contratos sem exigir os serviços reais.

## What Changes
- Adicionar no microservice `WWW/MICROSERVICE/MOCK-END` rotas com **paths exatos** descritos em `IA/DESENHOS/ENDPOINTS.md`:
  - Internos: `/api/auth/*` e `/api/products*`
  - Externos: `/tokenService`, `/postAutenteicaAplicativo`, `/enviarToken`, `/verificarTokenSistema`, `/getOperadorSistemaForId`
  - Integração: `/Servidor/webservice/integration/getIntegradora`, `/getListProdutoLoja`, `/getProdutoLoja`
- Ajustar CORS do MOCK-END para suportar `POST` e `Authorization`, além de permitir cookies quando necessário.
- Manter compatibilidade com as rotas existentes por tenant (`/api/:tenant/*`) sem quebrar o comportamento atual.
- Criar um gerador (script) de JSON compatível com Postman (collection v2.1) para testar o MOCK-END.

## Impact
- Affected specs: mock de autenticação, mock de integração, catálogo/consulta de produtos, testes manuais via Postman.
- Affected code:
  - `WWW/MICROSERVICE/MOCK-END/server.mjs`
  - `WWW/MICROSERVICE/MOCK-END/package.json`
  - `WWW/MICROSERVICE/MOCK-END/scripts/*` (novo script)
  - Artefatos Postman (novo(s) arquivo(s) JSON em local definido na implementação)

## ADDED Requirements

### Requirement: Roteamento sem conflito
O sistema SHALL rotear os endpoints do Connect **antes** do roteamento atual baseado em tenant, garantindo que `/api/auth/*` e `/api/products*` não sejam interpretados como `tenant=auth`/`tenant=products`.

#### Scenario: Chamada para endpoint interno
- **WHEN** um cliente chama `POST /api/auth/register`
- **THEN** a request SHALL ser tratada pelo handler do Connect e não pelo handler de tenant

### Requirement: CORS para desenvolvimento local
O sistema SHALL responder preflight `OPTIONS` e SHALL anunciar métodos e headers necessários para testes locais.

#### Scenario: Preflight com POST e Authorization
- **WHEN** o browser envia `OPTIONS` com `Access-Control-Request-Method: POST` e `Access-Control-Request-Headers: authorization, content-type`
- **THEN** a resposta SHALL incluir `Access-Control-Allow-Methods` com `POST` e `Access-Control-Allow-Headers` incluindo `Authorization` e `Content-Type`

### Requirement: Endpoints internos de Auth
O sistema SHALL expor os seguintes endpoints internos:
- `POST /api/auth/register`
- `POST /api/auth/send-token`
- `POST /api/auth/verify-token`
- `POST /api/auth/logout`
- `GET /api/auth/me`

#### Scenario: verify-token cria sessão
- **WHEN** o cliente chama `POST /api/auth/verify-token` com `{ token }` válido
- **THEN** a resposta SHALL ser `{ success: true, data: { verification, operador } }`
- **AND** o servidor SHALL setar cookie `session` (httpOnly) com JSON `{ userId, email, token, name? }`

#### Scenario: me sem sessão
- **WHEN** o cliente chama `GET /api/auth/me` sem cookie `session`
- **THEN** o servidor SHALL responder `401`

### Requirement: Endpoints internos de Produtos
O sistema SHALL expor os seguintes endpoints internos:
- `GET /api/products?idIntegradora?=number`
- `GET /api/products/:codProd?idIntegradora?=number`

#### Scenario: Lista de produtos
- **WHEN** o cliente chama `GET /api/products`
- **THEN** a resposta SHALL ser `{ success: true, data: Product[], total: number }`

### Requirement: Resolução de tenant para produtos (fonte do catálogo)
O sistema SHALL obter os produtos a partir de `CATALOGO/produtos.json` de um tenant do MOCK-END.

#### Scenario: Seleção de tenant
- **WHEN** `tenant` for informado via query (`?tenant=...`) ou header (`X-Tenant`)
- **THEN** o servidor SHALL usar esse tenant (se existir)
- **ELSE** o servidor SHALL usar `MOCKEND_TENANT_DEFAULT` (se definido) ou o primeiro tenant disponível

### Requirement: Endpoints externos de autenticação (AUTH_BASE_URL)
O sistema SHALL expor os endpoints externos abaixo. `POST /tokenService` SHALL **não** exigir `Authorization`. Os demais endpoints SHALL exigir `Authorization` (token cru ou `Bearer <token>`):
- `POST /tokenService` (geração e refresh)
- `POST /postAutenteicaAplicativo`
- `POST /enviarToken`
- `POST /verificarTokenSistema`
- `GET /getOperadorSistemaForId`

#### Scenario: Authorization ausente
- **WHEN** o cliente chama um endpoint externo que exige `Authorization` sem `Authorization`
- **THEN** o servidor SHALL responder `401`

#### Scenario: tokenService (geração)
- **WHEN** o cliente chama `POST /tokenService` com body `{ produto, ean, idIntegradora, codCli }`
- **THEN** o servidor SHALL retornar no mínimo `{ hashToken, dtExpira, refreshToken? }`

#### Scenario: tokenService (refresh)
- **WHEN** o cliente chama `POST /tokenService` com body `{ refreshToken }`
- **THEN** o servidor SHALL retornar `{ hashToken, dtExpira, refreshToken? }` renovado

### Requirement: Endpoints externos de integração (INTEGRATION_URL_API)
O sistema SHALL expor e exigir `Authorization` nos endpoints:
- `GET /Servidor/webservice/integration/getIntegradora?id=...`
- `GET /Servidor/webservice/integration/getListProdutoLoja?idIntegradora=...`
- `GET /Servidor/webservice/integration/getProdutoLoja?idIntegradora=...&codProd=...`

#### Scenario: Respostas tolerantes
- **WHEN** o cliente chama `getListProdutoLoja`
- **THEN** o servidor MAY retornar array direto ou encapsular em `data|produtos|products|lista|itens`

### Requirement: Artefatos Postman (collection v2.1)
O sistema SHALL fornecer um JSON de collection compatível com Postman (schema v2.1) para testar todos os endpoints implementados.

#### Scenario: Variáveis da collection
- **WHEN** o usuário importar a collection
- **THEN** ela SHALL conter variáveis como `baseUrl`, `authBaseUrl`, `integrationBaseUrl`, `authorizationToken` e `tenant`

## MODIFIED Requirements
### Requirement: Rotas atuais por tenant continuam funcionando
O sistema SHALL manter o comportamento existente para:
- `/api/:tenant/catalogo/*`
- `/api/:tenant/json*`
- `/api/:tenant/assets*`

## REMOVED Requirements
N/A

## Como testar (manual)
- Subir o server do MOCK-END em `WWW/MICROSERVICE/MOCK-END` (porta padrão `4000`).
- Importar no Postman a collection gerada em `WWW/MICROSERVICE/MOCK-END/postman/mock-end-connect.postman_collection.json`.
- Executar na ordem: Auth Register → Auth Send Token (copiar `tokenPreview`) → Auth Verify Token → Auth Me → Auth Logout.
- Executar Products List e Products Detail (ajustar `tenant` se necessário).
- Executar `tokenService` e depois endpoints externos com `Authorization: {{authorizationToken}}`.
