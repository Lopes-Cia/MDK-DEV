# Plano — HTTP_SERVER (BACK + MOCK) com Token (MVP)

## Resumo

Criar em `WWW/MICROSERVICE/LEAR_LOPES/HTTP_SERVER` um microserviço (Node.js, `.mjs`, sem dependências) que permita:

1) **Reproduzir geração e regeneração de token** (mesma lógica do legado) usando `AUTH_BASE_URL/tokenService`.
2) **Subir 2 servidores** (BACK e MOCK), cada um lendo o seu próprio `.env`:
   - `WWW/MICROSERVICE/LEAR_LOPES/BACK/.env`
   - `WWW/MICROSERVICE/LEAR_LOPES/MOCK/.env`
3) Oferecer **HTTP + CLI** para executar requisições com `Authorization` automático e salvar `request.json/result.json`.

## Estado atual (fatos do repo)

- `HTTP_SERVER/` está vazio (diretório existe, sem arquivos).
- Existem dois ambientes com `.env`:
  - BACK: `AUTH_BASE_URL=https://gp.lopesecia.com.br:9002/ApiLopes/webservice/api` e `INTEGRATION_URL_API=https://gp.lopesecia.com.br:9004`
  - MOCK: `AUTH_BASE_URL=http://localhost:4000/ApiLopes/webservice/api` e `INTEGRATION_URL_API=http://localhost:4000/connect`
- O legado já tem o fluxo de token (gerar/refresh) em `LEGADO/gerar-token-acesso.mjs` e persistência em `LEGADO/token-acesso.json`.
- Você quer:
  - **Fixar portas no .env** (porque BACK e MOCK hoje têm `PORT=3000`).
  - Persistir tokens em **BACK/token-acesso.json** e **MOCK/token-acesso.json**.
  - Interface **HTTP + CLI**.

## Objetivo e critérios de sucesso

### Objetivo (MVP)

- Ter 2 servidores rodando ao mesmo tempo:
  - `HTTP_SERVER` (BACK) → usa `BACK/.env`
  - `HTTP_SERVER` (MOCK) → usa `MOCK/.env`
- Ambos expõem endpoints mínimos para:
  - gerar token
  - refresh token
  - executar request na `INTEGRATION_URL_API` (ou `AUTH_BASE_URL`) com `Authorization`
  - salvar `request.json` e `result.json` por chamada

### Sucesso

- Um único comando por ambiente sobe o servidor e responde `/health`.
- Um comando CLI por ambiente gera/refresh token e grava `token-acesso.json` dentro do diretório do ambiente.
- Uma chamada HTTP ou CLI faz requisição e grava:
  - `<ENV_DIR>/data/<id>/request.json`
  - `<ENV_DIR>/data/<id>/result.json`

## Decisões

- Portas serão fixadas nos `.env` via nova variável `HTTP_SERVER_PORT` (uma por ambiente).
- Token persistido em:
  - `WWW/MICROSERVICE/LEAR_LOPES/BACK/token-acesso.json`
  - `WWW/MICROSERVICE/LEAR_LOPES/MOCK/token-acesso.json`
- Implementação Node.js puro (ESM), usando `fetch` nativo.

## Mudanças propostas (arquivos)

### 1) Criar base do HTTP_SERVER

Criar os arquivos em `WWW/MICROSERVICE/LEAR_LOPES/HTTP_SERVER`:

- `lib/env.mjs`
  - `loadEnvFrom(dir)` → lê `<dir>/.env` (parser simples estilo legado) e retorna objeto env.
- `lib/token-manager.mjs` (classe)
  - Responsável por:
    - `generate()` → POST `${AUTH_BASE_URL}/tokenService` com `{ produto, ean, idIntegradora, codCli }`
    - `refresh()` → POST `${AUTH_BASE_URL}/tokenService` com `{ refreshToken }`
    - persistir em `<ENV_DIR>/token-acesso.json`
    - carregar token persistido e validar expiração (`dtExpira`) quando existir
- `lib/http-server.mjs` (classe)
  - Recebe `envDir`, `env`, `tokenManager`, `port`.
  - Rotas HTTP (MVP):
    - `GET /health`
    - `POST /token/generate`
    - `POST /token/refresh`
    - `GET /token` (retorna metadados, sem vazar token se você preferir; por default retorna token)
    - `POST /request` (executa request contra upstream e salva request/result)
      - body: `{ base: "integration"|"auth", method, path, query, headers?, body? }`
      - adiciona `Authorization` automaticamente quando `authRequired=true` ou quando `headers.Authorization` estiver ausente
    - `GET /captures` (lista últimas capturas do diretório `data/`)

### 2) Entrypoints (CLI + servidor)

Criar em `HTTP_SERVER/`:

- `start-back.mjs`
  - carrega `BACK/.env`
  - usa `HTTP_SERVER_PORT` do BACK
  - sobe o servidor do BACK
- `start-mock.mjs`
  - carrega `MOCK/.env`
  - usa `HTTP_SERVER_PORT` do MOCK
  - sobe o servidor do MOCK
- `start-dual.mjs`
  - sobe os dois servidores no mesmo processo (BACK e MOCK), cada um com sua porta
- `cli-token.mjs`
  - `node cli-token.mjs --env=BACK --generate`
  - `node cli-token.mjs --env=MOCK --refresh`
- `cli-request.mjs`
  - `node cli-request.mjs --env=MOCK --base=integration --method=GET --path=/Servidor/webservice/integration/produtos/categorias`
  - grava request/result em `<ENV_DIR>/data/...`

### 3) Ajustar os .env para porta do HTTP_SERVER

Editar:

- `WWW/MICROSERVICE/LEAR_LOPES/BACK/.env`
  - adicionar `HTTP_SERVER_PORT=3100`
- `WWW/MICROSERVICE/LEAR_LOPES/MOCK/.env`
  - adicionar `HTTP_SERVER_PORT=3101`

### 4) Documentar uso (MVP)

Atualizar `WWW/MICROSERVICE/LEAR_LOPES/IA/AGENTS.md` com:

- Como subir:
  - `node .../HTTP_SERVER/start-back.mjs`
  - `node .../HTTP_SERVER/start-mock.mjs`
  - `node .../HTTP_SERVER/start-dual.mjs`
- Como gerar/refresh token (CLI e HTTP).
- Como executar request e onde ficam os `request.json/result.json`.

## Regras de segurança (MVP)

- Nunca logar token em claro em console por padrão (somente quando você pedir).
- Nos `request.json`, redigir `Authorization`.

## Verificação

1) Subir dois servidores:
   - BACK: `http://localhost:3100/health`
   - MOCK: `http://localhost:3101/health`
2) Gerar token em BACK e MOCK:
   - Confirmar `token-acesso.json` criado em cada pasta.
3) Executar 1 request simples (GET) em MOCK:
   - Confirmar criação de `<MOCK>/data/<id>/request.json` e `result.json`.

