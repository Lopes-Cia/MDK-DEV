# MOCK-END - Modelo de Rota (IA-Friendly)

Este guia explica como criar uma nova rota no MOCK-END seguindo o mesmo padrao da rota `home` em `PROJETOS/connect/routes.mjs`.

Referencia de modelo:
- [routes.mjs (rota home)](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs#L102-L112)

## Objetivo

Padronizar a criacao de rotas para:
- manter contrato consistente (`method`, `uri`, `auth`, `execution`, `handler_class`, `handler_function`);
- facilitar manutencao e leitura;
- permitir que IA gere novas rotas sem quebrar o fluxo existente.

## Estrutura Minima da Rota

Toda rota deve seguir este shape:

```js
{
  method: "GET|POST|PUT|DELETE",
  uri: "/path/completo",
  auth: {
    mode: "required|none",
    label: "Descricao curta da auth.",
  },
  execution: { mode: "mock|original|hybrid" },
  handler_class: "api/nome-do-handler",
  handler_function: "nomeDaFuncao",
}
```

## Significado de Cada Campo

- `method`: verbo HTTP da rota.
- `uri`: caminho exato da URL.
- `auth.mode`:
  - `required`: rota exige token/autorizacao conforme contrato do projeto.
  - `none`: rota publica.
- `auth.label`: explicacao humana da regra de autenticacao.
- `execution.mode`:
  - `mock`: executa `handlers/mock/<handler_class>.mjs`.
  - `original`: executa `handlers/<handler_class>.mjs`.
  - `hybrid`: executa ambos (original + mock).
- `handler_class`: caminho relativo do arquivo de handler (sem `.mjs`).
- `handler_function`: nome da funcao exportada dentro de `handlers`.

## Exemplo Real (Mesmo Padrao da Home)

```js
{
  method: "GET",
  uri: "/Servidor/webservice/integration/home",
  auth: {
    mode: "required",
    label: "Token da integradora (quando em modo original).",
  },
  execution: { mode: "mock" },
  handler_class: "api/home",
  handler_function: "home",
}
```

Arquivo alvo dessa configuracao:
- `PROJETOS/connect/handlers/mock/api/home.mjs`

Funcao alvo dentro do arquivo:
- `handlers.home`

## Template Pronto Para Nova Rota

Copie e ajuste:

```js
{
  method: "GET",
  uri: "/Servidor/webservice/integration/<recurso>",
  auth: {
    mode: "required",
    label: "Token da integradora (quando em modo original).",
  },
  execution: { mode: "mock" },
  handler_class: "api/<arquivo-handler>",
  handler_function: "<funcao-handler>",
}
```

## Template de Handler (Compativel com o Dispatcher)

Crie/edite o arquivo:
- `PROJETOS/connect/handlers/mock/api/<arquivo-handler>.mjs`

Exemplo minimo:

```js
import { json } from "../../../../../lib/response.mjs";

function ensureGet(req, res, cors) {
  if (String(req.method ?? "").toUpperCase() === "GET") return true;
  json(res, 405, { error: "method_not_allowed" }, cors);
  return false;
}

async function <funcao-handler>(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const data = { ok: true };
  json(res, 200, { success: true, data }, cors);
}

export const handlers = {
  "<funcao-handler>": <funcao-handler>,
};
```

## Template de Controller (Padrao HomeController)

Quando a rota le JSON de arquivo, prefira separar em:
- `Controller`: responsavel por leitura/cache dos dados.
- `Handler`: responsavel por HTTP (metodo, status, json).

Exemplo no projeto atual:
- [HomeController.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/HomeController.mjs)

Template base:

```js
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, "..", "<arquivo>.json");

let cache = null;

async function readJsonFile(filePath, label) {
  let raw = "{}";
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} nao conseguiu ler arquivo (${filePath}): ${String(err?.message ?? err)}\n`
    );
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} JSON invalido (${filePath}): ${String(err?.message ?? err)}\n`
    );
    return {};
  }
}

async function loadData() {
  if (cache) return cache;
  const parsed = await readJsonFile(DATA_FILE, "mock/<nome>(<arquivo>)");
  cache = parsed && typeof parsed === "object" ? parsed : {};
  return cache;
}

export class <NomeController> {
  async <metodo>() {
    return loadData();
  }
}
```

## Criacao de JSON de Dados (Obrigatorio Quando a Rota Le Arquivo)

Se a rota depende de arquivo JSON (como a `home`), o desenho precisa incluir tambem o arquivo de dados.

### Onde criar

- Pasta padrao de dados mock do projeto:
  - `PROJETOS/connect/handlers/mock/`
- Exemplo real:
  - `PROJETOS/connect/handlers/mock/colections.json`

### Regra de acoplamento

- O nome do arquivo deve bater com o que o handler/controller le via `fs.readFile(...)`.
- Exemplo atual da home:
  - `handlers/mock/api/HomeController.mjs` le `../colections.json`.
- Se renomear JSON, atualizar o caminho no controller/handler no mesmo commit.

### Estrutura minima recomendada

- Para `home` (`colections.json`): objeto JSON (nao array).
- Para `produtos` (`produtos.json`, `categorias.json`, `brands.json`): array JSON.
- Sempre manter JSON valido (sem comentarios, sem virgula sobrando).

### Template base para `colections.json`

```json
{
  "banners": [],
  "colecoes": []
}
```

### Exemplo de payload inicial util

```json
{
  "banners": [
    {
      "id": 1,
      "titulo": "Banner Principal",
      "imagem": "/assets/images/banners/banner-1.webp",
      "link": "/"
    }
  ],
  "colecoes": [
    {
      "id": "mais-vendidos",
      "titulo": "Mais Vendidos",
      "produtos": []
    }
  ]
}
```

### Checklist do JSON

- Arquivo foi criado no caminho correto (`handlers/mock/`).
- Formato (objeto/array) bate com o esperado pelo controller.
- Chaves usadas no front existem no JSON.
- Caminhos de imagem apontam para assets existentes.
- JSON abre sem erro de parse.

## Checklist Rapido (Antes de Salvar)

- A rota foi adicionada dentro de `export const routes = [ ... ]`.
- `handler_class` bate exatamente com o caminho do arquivo.
- `handler_function` existe dentro de `export const handlers = { ... }`.
- `execution.mode` esta coerente com o local do handler.
- `uri` nao conflita com outra rota existente.
- Se rota le arquivo, o JSON foi criado/atualizado e validado.

## Erros Comuns

- `handler_class` com caminho errado (ex.: faltando `api/`).
- `handler_function` diferente do nome exportado no handler.
- usar `mock` na rota, mas criar arquivo em `handlers/api` (original).
- esquecer validacao do metodo HTTP e retornar status incorreto.

## Prompt IA Pronto (Copiar e Colar)

Use este prompt para pedir a criacao de rota no mesmo padrao:

```txt
Crie uma nova rota em PROJETOS/connect/routes.mjs seguindo exatamente o padrao da rota /Servidor/webservice/integration/home:
- manter auth.label igual;
- execution.mode = "mock";
- handler_class no formato "api/<nome>";
- handler_function coerente com o handler.

Depois crie o arquivo PROJETOS/connect/handlers/mock/api/<nome>.mjs
com export const handlers = { "<funcao>": async (...) => ... }.
Inclua validacao de metodo HTTP e resposta JSON padrao { success: true, data }.
```

## Exemplo Completo (Vitrine com JSON real)

### 1) Rota no `routes.mjs`

```js
{
  method: "GET",
  uri: "/Servidor/webservice/integration/vitrine",
  auth: {
    mode: "required",
    label: "Token da integradora (quando em modo original).",
  },
  execution: { mode: "mock" },
  handler_class: "api/vitrine",
  handler_function: "vitrine",
}
```

### 2) JSON de dados `handlers/mock/vitrine.json`

```json
{
  "banners": [
    {
      "id": 1,
      "titulo": "Ofertas da Semana",
      "imagem": "/assets/images/banners/banner-1.webp",
      "link": "/ofertas"
    },
    {
      "id": 2,
      "titulo": "Destilados Premium",
      "imagem": "/assets/images/banners/banner-2.webp",
      "link": "/categoria/destilados"
    }
  ],
  "colecoes": [
    {
      "id": "mais-vendidos",
      "titulo": "Mais Vendidos",
      "produtos": [
        { "id": 101, "slug": "heineken-lata-350ml", "nome": "Heineken Lata 350ml" },
        { "id": 102, "slug": "red-bull-250ml", "nome": "Red Bull 250ml" }
      ]
    },
    {
      "id": "novidades",
      "titulo": "Novidades",
      "produtos": []
    }
  ]
}
```

### 3) Controller `handlers/mock/api/VitrineController.mjs`

```js
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VITRINE_FILE = path.resolve(__dirname, "..", "vitrine.json");

let vitrineCache = null;

async function readJsonFile(filePath, label) {
  let raw = "{}";
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} nao conseguiu ler arquivo (${filePath}): ${String(err?.message ?? err)}\n`
    );
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} JSON invalido (${filePath}): ${String(err?.message ?? err)}\n`
    );
    return {};
  }
}

async function loadVitrine() {
  if (vitrineCache) return vitrineCache;
  const parsed = await readJsonFile(VITRINE_FILE, "mock/vitrine(vitrine)");
  vitrineCache = parsed && typeof parsed === "object" ? parsed : {};
  return vitrineCache;
}

export class VitrineController {
  async vitrine() {
    return loadVitrine();
  }
}
```

### 4) Handler `handlers/mock/api/vitrine.mjs` (usando controller)

```js
import { json } from "../../../../../lib/response.mjs";
import { VitrineController } from "./VitrineController.mjs";

function ensureGet(req, res, cors) {
  if (String(req.method ?? "").toUpperCase() === "GET") return true;
  json(res, 405, { error: "method_not_allowed" }, cors);
  return false;
}

const controller = new VitrineController();

async function vitrine(req, res, ctx) {
  const cors = ctx.cors ?? {};
  if (!ensureGet(req, res, cors)) return;

  const data = await controller.vitrine();
  json(res, 200, { success: true, data }, cors);
}

export const handlers = {
  vitrine,
};
```

### 5) Resultado esperado da API

`GET /connect/Servidor/webservice/integration/vitrine`

Resposta `200`:

```json
{
  "success": true,
  "data": {
    "banners": [
      { "id": 1, "titulo": "Ofertas da Semana", "imagem": "/assets/images/banners/banner-1.webp", "link": "/ofertas" }
    ],
    "colecoes": [
      { "id": "mais-vendidos", "titulo": "Mais Vendidos", "produtos": [] }
    ]
  }
}
```

## CRUD Completo (POST, PUT, DELETE)

Abaixo esta o modelo completo para recurso com CRUD. O GET ja esta validado no exemplo acima; aqui complementamos com criacao, atualizacao e remocao.

### Regra obrigatoria (corrige erro comum)

Para subrecurso (ex.: `colecoes` de `vitrine`):
- **Nao criar JSON paralelo** (`vitrine-colecoes.json`).
- **Nao criar controller paralelo** so para colecoes.
- CRUD deve operar no **mesmo arquivo base** da vitrine:
  - `PROJETOS/connect/handlers/mock/vitrine.json`
- CRUD deve usar o **mesmo controller base** da vitrine (ex.: `VitrineController.mjs`), adicionando metodos de manipulacao de `data.colecoes`.

### 1) Rotas CRUD no `routes.mjs`

```js
{
  method: "GET",
  uri: "/Servidor/webservice/integration/vitrine/colecoes",
  auth: {
    mode: "required",
    label: "Token da integradora (quando em modo original).",
  },
  execution: { mode: "mock" },
  handler_class: "api/vitrine",
  handler_function: "listColecoes",
},
{
  method: "GET",
  uri: "/Servidor/webservice/integration/vitrine/colecoes/*",
  auth: {
    mode: "required",
    label: "Token da integradora (quando em modo original).",
  },
  execution: { mode: "mock" },
  handler_class: "api/vitrine",
  handler_function: "detailColecao",
},
{
  method: "POST",
  uri: "/Servidor/webservice/integration/vitrine/colecoes",
  auth: {
    mode: "required",
    label: "Token da integradora (quando em modo original).",
  },
  execution: { mode: "mock" },
  handler_class: "api/vitrine",
  handler_function: "createColecao",
},
{
  method: "PUT",
  uri: "/Servidor/webservice/integration/vitrine/colecoes/*",
  auth: {
    mode: "required",
    label: "Token da integradora (quando em modo original).",
  },
  execution: { mode: "mock" },
  handler_class: "api/vitrine",
  handler_function: "updateColecao",
},
{
  method: "DELETE",
  uri: "/Servidor/webservice/integration/vitrine/colecoes/*",
  auth: {
    mode: "required",
    label: "Token da integradora (quando em modo original).",
  },
  execution: { mode: "mock" },
  handler_class: "api/vitrine",
  handler_function: "removeColecao",
}
```

### 2) JSON unico da vitrine

Arquivo usado por GET e CRUD:

`PROJETOS/connect/handlers/mock/vitrine.json`

```json
{
  "banners": [],
  "colecoes": [
    { "id": "mais-vendidos", "titulo": "Mais Vendidos", "produtos": [] }
  ]
}
```

### 3) Controller base (`VitrineController.mjs`) com metodos CRUD

Regra:
- manter leitura/escrita no mesmo `vitrine.json`;
- CRUD manipula `data.colecoes` dentro do objeto raiz.

Metodos esperados no controller:
- `vitrine()`
- `listColecoes()`
- `detailColecao(id)`
- `createColecao(payload)`
- `updateColecao(id, payload)`
- `removeColecao(id)`

### 4) Handler base (`vitrine.mjs`) com funcoes CRUD

Regra:
- usar o mesmo `handler_class: "api/vitrine"` para GET e CRUD;
- expor funcoes em `export const handlers = { ... }`:
  - `vitrine`
  - `listColecoes`
  - `detailColecao`
  - `createColecao`
  - `updateColecao`
  - `removeColecao`

### 5) Payloads de exemplo

POST `/connect/Servidor/webservice/integration/vitrine/colecoes`

```json
{
  "id": "promocoes",
  "titulo": "Promocoes",
  "produtos": []
}
```

PUT `/connect/Servidor/webservice/integration/vitrine/colecoes/promocoes`

```json
{
  "titulo": "Promocoes Atualizadas",
  "produtos": [{ "id": 999, "slug": "produto-x", "nome": "Produto X" }]
}
```

### 6) Status esperados por operacao

- `GET list`: `200`
- `GET detail`: `200` ou `404`
- `POST create`: `201`, `400` (id ausente), `409` (id duplicado)
- `PUT update`: `200`, `400` (id ausente), `404`
- `DELETE remove`: `200`, `400` (id ausente), `404`

## Teste Pos-Implementacao (Obrigatorio)

Depois da implementacao, sempre executar este protocolo.

### Passo a passo

1. Criar diretorio de teste em:
   - `WWW/MICROSERVICE/MOCK-END/TEST/<nome-implementacao>/`
2. Reiniciar o MOCK-END.
3. Rodar cada endpoint implementado (GET, POST, PUT, DELETE e variacoes).
4. Salvar cada retorno no diretorio de teste criado.
5. Se houver erro em um endpoint:
   - salvar o erro no mesmo diretorio;
   - continuar os testes dos proximos endpoints (nao parar o fluxo).
6. Gerar relatorio final com base nos arquivos salvos.

### Estrutura minima dos artefatos de teste

No diretorio `TEST/<nome-implementacao>/`, salvar:

- `01-get-list.response.json`
- `02-get-detail.response.json`
- `03-post-create.response.json`
- `04-put-update.response.json`
- `05-delete-remove.response.json`
- `xx-<endpoint>.error.json` (quando der erro)
- `relatorio-final.md`

### Formato recomendado para arquivo de erro

```json
{
  "endpoint": "PUT /connect/Servidor/webservice/integration/vitrine/colecoes/promocoes",
  "status": 500,
  "erro": "descricao objetiva",
  "body": {}
}
```

### Template de relatorio final (`relatorio-final.md`)

```md
# Relatorio de Teste - <nome-implementacao>

## Resumo
- Total de endpoints testados: <n>
- Sucesso: <n>
- Erro: <n>

## Evidencias
- 01-get-list.response.json
- 02-get-detail.response.json
- 03-post-create.response.json
- 04-put-update.response.json
- 05-delete-remove.response.json

## Erros encontrados
- <arquivo-erro-1>: <descricao curta>
- <arquivo-erro-2>: <descricao curta>

## Conclusao
- Implementacao correta: SIM|NAO
- Se NAO: listar correcoes recomendadas e perguntar se pode aplicar as correcoes.
```

### Regra de decisao apos os testes

- Se todos os endpoints passarem com status esperado: informar que a implementacao esta correta.
- Se houver falhas: usar o relatorio para explicar os erros e perguntar se pode aplicar as correcoes indicadas.
