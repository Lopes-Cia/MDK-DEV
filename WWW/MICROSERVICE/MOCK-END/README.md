# MOCK-END (microservice) — Arquitetura atual

## Objetivo

O MOCK-END atua como uma camada HTTP em `localhost:4000` para:

- Espelhar o Connect-site mantendo o mesmo “shape” de URLs por base.
- Fazer proxy para upstreams reais quando aplicável.
- Permitir comportamento local por endpoint de forma explícita e navegável.

## Entrypoint

- Servidor HTTP: [server.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/server.mjs)
- Porta: `PORT` (padrão `4000`)
- CORS: [cors.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/lib/cors.mjs)

Fluxo por request (alto nível):

1. `OPTIONS` responde `204`.
2. Resolve `projectDir/basePrefix` pelo `pathname` (bases).
3. Carrega `routes.mjs` do projeto (quando existir).
4. Executa `routes/proxy.mjs` (proxy por base).
5. Executa `routes/connect.mjs` (rotas internas `/api/*`).
6. Fallback `404 not_found`.

Roteador principal: [routes/index.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/routes/index.mjs)

## Estrutura de diretórios

- `lib/`: utilitários do server (CORS, cookies, parse body, env, response).
- `routes/`: roteamento “core” do server (proxy + connect + index).
- `PROJETOS/`: “bases” com `.env` e rotas declarativas por base.
- `LEGADO/`: código isolado que não deve impactar o caminho principal.
- `postman/`: collections.
- `scripts/`: scripts utilitários (geração de catálogos, postman, verificações internas).

## PROJETOS (bases)

As bases oficiais suportadas hoje são:

- AUTH base: `/ApiLopes/webservice/api`
  - projeto: `PROJETOS/ApiLopes/webservice/api`
- INTEGRATION base: `/connect`
  - projeto: `PROJETOS/connect`

Resolução de projeto por path: [project.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/lib/project.mjs)

### Artefatos obrigatórios por base

Para cada base/projeto devem existir:

- `.env` (config de upstream e parâmetros do integrador quando necessário)
- `routes.mjs` (catálogo de rotas da base)
- `handlers/` (módulos chamados diretamente por rota)

Exemplos:

- `PROJETOS/connect/.env` e `PROJETOS/connect/routes.mjs`
- `PROJETOS/connect/handlers/api/auth.mjs`
- `PROJETOS/ApiLopes/webservice/api/.env` e `PROJETOS/ApiLopes/webservice/api/routes.mjs`
- `PROJETOS/ApiLopes/webservice/api/handlers/auth.mjs`

## Regras de `.env` (sem fallback do modelo antigo)

- O proxy NÃO deve depender do `.env` global da raiz para URLs de upstream.
- Se o `.env` do projeto/base não existir, o proxy responde:
  - `500 { error: "proxy_not_configured", env: "<ENV_KEY>" }`

Leitura de `.env` por projeto: [env.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/lib/env.mjs)

## Rotas declarativas (modelo “classe + função”)

Arquivo: `PROJETOS/<base>/routes.mjs`

Cada rota define:

- `method`: `GET` | `POST` | ...
- `uri`: path do endpoint
- `execution.mode`: `original` | `mock` | `hybrid` (no momento só `original` executa; os outros retornam `501`)
- `handler_class`: caminho relativo dentro de `handlers/` (estilo “Controller”)
- `handler_function`: chave/função dentro do módulo (estilo “method”)

Exemplo (conceito):

```js
export const routes = [
  {
    method: "POST",
    uri: "/api/auth/verify-token",
    execution: { mode: "original" },
    handler_class: "api/auth",
    handler_function: "verify-token",
  },
];
```

## Handlers (módulos por base)

Arquivo: `PROJETOS/<base>/handlers/<handler_class>.mjs`

Contrato:

- Exportar `handlers` (objeto)
- A chave deve existir em `handler_function`
- O valor deve ser uma função async `(req, res, ctx) => void`

Exemplo (conceito):

```js
export const handlers = {
  "verify-token": async (req, res, ctx) => {
    // ...
  },
};
```

## Proxy (upstream)

Arquivo: [routes/proxy.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/routes/proxy.mjs)

Comportamento:

- Preserva método, path e querystring.
- Remove hop-by-hop headers.
- Repassa `Set-Cookie` quando presente.
- `redirect: "follow"` ao falar com upstream.

### INTEGRATION base (`/connect/*`)

- Encaminha via `INTEGRATION_URL_API` (lido de `PROJETOS/connect/.env`)
- Exemplo local:
  - `http://localhost:4000/connect/Servidor/webservice/integration/getIntegradora?...`

### AUTH base (`/ApiLopes/webservice/api/*`)

Essa base usa o mesmo modelo `routes.mjs + handlers` para clareza.

- O proxy identifica o request pela base e carrega `PROJETOS/ApiLopes/webservice/api/routes.mjs`.
- Ele executa o handler correspondente em `PROJETOS/ApiLopes/webservice/api/handlers/...`.
- O handler pode:
  - responder localmente (ex.: tokenService mock)
  - ou encaminhar para o upstream (`AUTH_BASE_URL`) quando desejado

Handlers dessa base:

- [ApiLopes auth.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/ApiLopes/webservice/api/handlers/auth.mjs)

## Rotas internas do Connect (`/api/*`)

Arquivo: [routes/connect.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/routes/connect.mjs)

Esse arquivo é propositalmente um dispatcher:

- Carrega `PROJETOS/connect/routes.mjs`
- Resolve `handler_class/handler_function`
- Importa `PROJETOS/connect/handlers/<handler_class>.mjs`
- Executa `handlers[handler_function]`

Handlers do Connect:

- [connect api/auth.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/api/auth.mjs)
- [connect api/products.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/api/products.mjs)

## Respostas padrão

- JSON helper: [response.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/lib/response.mjs)
- Body JSON/Binary: [body.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/lib/body.mjs)
- Cookies: [cookies.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/lib/cookies.mjs)

## LEGADO

- Tudo que não faz parte do caminho principal fica em `LEGADO/`.
- Regra: `routes/index.mjs` não deve importar `LEGADO/` por default.

Exemplos em `LEGADO/`:

- `LEGADO/routes/tenant.mjs`
- `LEGADO/lib/*`

## Como identificar “not_implemented”

Esse payload normalmente indica que:

- A rota foi encontrada, mas `execution.mode` não é `original`, ou
- `handler_class/handler_function` não existe, ou
- O módulo do handler não foi carregado (path incorreto) ou não exporta `handlers`.

Checklist rápido:

- `PROJETOS/<base>/routes.mjs` tem `handler_class` e `handler_function` corretos?
- Existe `PROJETOS/<base>/handlers/<handler_class>.mjs`?
- O módulo exporta `export const handlers = { ... }`?
- A chave `handler_function` existe no objeto `handlers`?
- Os imports relativos dentro do handler apontam para `.../lib/*` correto (nível de diretório)?

## Auditoria (para “limpar” e evitar regressões)

1. Confirmar que cada base tem `.env` e `routes.mjs`.
2. Confirmar que não existe fallback de upstream no `.env` global da raiz.
3. Verificar que `routes/index.mjs` não referencia `LEGADO/`.
4. Verificar que handlers de `PROJETOS/` não usam imports com nível errado (isso quebra `import()` e cai em `not_implemented`).
5. Verificar que o proxy valida `.env` do projeto e retorna `proxy_not_configured` quando faltar.

## Observação (Windows/casing)

No Windows, manter consistência de casing nos paths do projeto ajuda a evitar diagnósticos do tipo “differs only in casing” (ex.: `WWW/` vs `www/`). O recomendado é sempre referenciar e navegar usando o caminho real `WWW/MICROSERVICE/MOCK-END/`.

