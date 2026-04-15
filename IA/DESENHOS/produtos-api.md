# Produtos API (DESENHO)

## Objetivo

Definir uma API de **Categorias + Produtos** a partir de arquivos JSON locais, com foco em:

- Categorias em **árvore** (pai → filhos → netos).
- Busca de categoria por id (pai + filhos).
- Busca de produtos por categoria (inclui produtos das subcategorias).
- Busca de produto único por `id` e por `slug`.

## Fontes de dados (mock)

- Categorias: [categorias.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/categorias.json)
- Produtos: [produtos.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/produtos.json)

---

## Modelos (contrato)

### Categoria (entrada)

Campos mínimos vindos do JSON:

- `id: number`
- `name: string`
- `slug: string`
- `parentId: number` (0 = raiz)
- `image: string`
- `order: number`

### CategoriaNode (saída em árvore)

Categoria com filhos:

- todos os campos de Categoria
- `children: CategoriaNode[]`

Regras da árvore:

- Raízes são `parentId === 0`.
- Um nó é filho de outro quando `child.parentId === parent.id`.
- Ordenação:
  - `children` ordenado por `order ASC` e, em empate, por `id ASC`.

### Produto (entrada)

Campos mínimos vindos do JSON:

- `id: number`
- `sku: string`
- `name: string`
- `slug: string`
- `categoryId: number`
- `brand: string`
- `unitLabel: string`
- `sizeLabel: string`
- `price: number`
- `compareAtPrice: number | null`
- `badges: string[]`
- `image: string`
- `stock: number`
- `inStock: boolean`

---

## Endpoints (propostos)

Base recomendada (externa/legada):

- `/Servidor/webservice/integration/produtos/`

Regra de naming:

- Evitar `getAlgo` no path.
- Agrupar por recurso (categorias/produtos) embaixo de `/produtos/`.

### 1) GET Categorias (árvore completa)

**GET** `/Servidor/webservice/integration/produtos/categorias`

Resposta `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "name": "Bebidas",
      "slug": "bebidas",
      "parentId": 0,
      "image": "/assets/categories/bebidas.webp",
      "order": 10,
      "children": [
        {
          "id": 20,
          "name": "Cervejas",
          "slug": "cervejas",
          "parentId": 10,
          "image": "/assets/categories/cervejas.webp",
          "order": 20,
          "children": [
            {
              "id": 30,
              "name": "Lager",
              "slug": "lager",
              "parentId": 20,
              "image": "/assets/categories/lager.webp",
              "order": 30,
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

Erros:

- `500`: `{ "success": false, "message": "..." }`

### 2) GET Categoria por id (pai + filhos)

**GET** `/Servidor/webservice/integration/produtos/categorias/:idCategoria`

Path params:

- `idCategoria: number` (obrigatório)

Regras:

- Retorna a categoria “pai” e seus filhos diretos.
- Não inclui netos (se quiser, adicionar `includeDescendants=1` no futuro).

Resposta `200`:

```json
{
  "success": true,
  "data": {
    "category": {
      "id": 20,
      "name": "Cervejas",
      "slug": "cervejas",
      "parentId": 10,
      "image": "/assets/categories/cervejas.webp",
      "order": 20
    },
    "children": [
      {
        "id": 30,
        "name": "Lager",
        "slug": "lager",
        "parentId": 20,
        "image": "/assets/categories/lager.webp",
        "order": 30
      },
      {
        "id": 31,
        "name": "IPA",
        "slug": "ipa",
        "parentId": 20,
        "image": "/assets/categories/ipa.webp",
        "order": 31
      }
    ]
  }
}
```

Erros:

- `400` se `idCategoria` não for número válido
- `404` se não existir categoria com esse id

### 3) GET Produtos por categoria (inclui descendentes)

**GET** `/Servidor/webservice/integration/produtos/by-categoria/:idCategoria`

Path params:

- `idCategoria: number` (obrigatório)

Query params:

- `includeDescendants: 0 | 1` (opcional, padrão `1`)
- `page: number` (opcional, padrão `1`)
- `pageSize: number` (opcional, padrão `24`, máximo `100`)

Regras:

- Se `includeDescendants=1`, coletar todos os `categoryId` da subárvore (pai + filhos + netos...) e retornar produtos cujo `product.categoryId` esteja nessa lista.
- Se `includeDescendants=0`, retornar apenas produtos cujo `categoryId === idCategoria`.

Resposta `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "sku": "HEINEKEN-LATA-269",
      "name": "Heineken Lata 269ml",
      "slug": "heineken-lata-269ml",
      "categoryId": 30,
      "brand": "Heineken",
      "unitLabel": "lata",
      "sizeLabel": "269ml",
      "price": 8.26,
      "compareAtPrice": 9.5,
      "badges": ["gelada", "promo"],
      "image": "/assets/adega-lopes/images/produtos/heineken-lata-269ml-1df8fe.jpg",
      "stock": 124,
      "inStock": true
    }
  ],
  "page": 1,
  "pageSize": 24,
  "total": 1,
  "totalPages": 1
}
```

Erros:

- `400` se `idCategoria` não for número válido
- `404` se não existir categoria com esse id
- `400` se `page` ou `pageSize` não forem números válidos

### 4) GET Produto por id

**GET** `/Servidor/webservice/integration/produtos/by-id/:idProduto`

Path params:

- `idProduto: number` (obrigatório)

Resposta `200`:

```json
{
  "success": true,
  "data": {
    "id": 1001,
    "sku": "HEINEKEN-LATA-269",
    "name": "Heineken Lata 269ml",
    "slug": "heineken-lata-269ml",
    "categoryId": 30,
    "brand": "Heineken",
    "unitLabel": "lata",
    "sizeLabel": "269ml",
    "price": 8.26,
    "compareAtPrice": 9.5,
    "badges": ["gelada", "promo"],
    "image": "/assets/adega-lopes/images/produtos/heineken-lata-269ml-1df8fe.jpg",
    "stock": 124,
    "inStock": true
  }
}
```

Erros:

- `400` se `idProduto` não for número válido
- `404` se não existir produto com esse id

### 5) GET Produto por slug

**GET** `/Servidor/webservice/integration/produtos/by-slug/:slug`

Path params:

- `slug: string` (obrigatório)

Regras:

- `slug` deve ser comparado em minúsculas (case-insensitive).

Resposta `200`: igual ao endpoint por id.

Erros:

- `400` se `slug` estiver vazio
- `404` se não existir produto com esse slug

---

## Critérios de pronto

- Categorias retornam árvore pai/filhos/netos.
- Categoria por id retorna pai + filhos.
- Produtos por categoria inclui descendentes por padrão.
- Produto por id e por slug retornam um único item.

---

## Classe (DESENHO)

Objetivo: transformar este desenho em uma **classe única** que concentra:

- leitura de `categorias.json` e `produtos.json`
- montagem da árvore de categorias
- filtros (categoria + descendentes)
- paginação
- buscas por id/slug

### Nome sugerido

- `ProdutosController`

### Responsabilidades

- API de leitura (read-only) dos dados.
- Cache em memória (process-level) para evitar ler arquivo a cada request.
- Funções puras para construir árvore/paginar.

### Assinatura (Node ESM / .mjs)

```js
export class ProdutosController {
  constructor({ categoriasFilePath, produtosFilePath }) {}

  async getCategoriasTree() {}
  async getCategoriaByIdWithChildren(idCategoria) {}

  async getProdutosByCategoria(idCategoria, { includeDescendants = 1, page = 1, pageSize = 24 } = {}) {}
  async getProdutoById(idProduto) {}
  async getProdutoBySlug(slug) {}
}
```

### Implementação (referência no desenho)

```js
import fs from "node:fs/promises";

function assertInt(value, label) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) {
    const err = new Error(`${label} must be a valid integer`);
    err.statusCode = 400;
    throw err;
  }
  return n;
}

function assertSlug(value) {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) {
    const err = new Error("slug must be a non-empty string");
    err.statusCode = 400;
    throw err;
  }
  return s;
}

function clampPageSize(pageSize) {
  const n = Number.parseInt(String(pageSize ?? ""), 10);
  if (!Number.isFinite(n)) return 24;
  if (n < 1) return 1;
  if (n > 100) return 100;
  return n;
}

function clampPage(page) {
  const n = Number.parseInt(String(page ?? ""), 10);
  if (!Number.isFinite(n)) return 1;
  if (n < 1) return 1;
  return n;
}

function paginate(items, { page, pageSize }) {
  const total = items.length;
  const offset = (page - 1) * pageSize;
  const data = items.slice(offset, offset + pageSize);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return { data, page, pageSize, total, totalPages };
}

function sortCategorias(a, b) {
  const ao = Number(a?.order ?? 0);
  const bo = Number(b?.order ?? 0);
  if (ao !== bo) return ao - bo;
  return Number(a?.id ?? 0) - Number(b?.id ?? 0);
}

export class ProdutosController {
  constructor({ categoriasFilePath, produtosFilePath }) {
    this.categoriasFilePath = categoriasFilePath;
    this.produtosFilePath = produtosFilePath;

    this._categoriasCache = null;
    this._produtosCache = null;

    this._categoriasById = null;
    this._childrenByParentId = null;
    this._produtosById = null;
    this._produtosBySlug = null;
    this._produtosByCategoryId = null;
  }

  async _loadCategorias() {
    if (this._categoriasCache) return this._categoriasCache;
    const raw = await fs.readFile(this.categoriasFilePath, "utf8");
    const parsed = JSON.parse(raw);
    const data = Array.isArray(parsed) ? parsed : [];
    this._categoriasCache = data;

    const byId = new Map();
    const childrenByParentId = new Map();
    for (const c of data) {
      const id = Number(c?.id);
      if (!Number.isFinite(id)) continue;
      byId.set(id, c);
      const parentId = Number(c?.parentId ?? 0);
      const list = childrenByParentId.get(parentId) ?? [];
      list.push(c);
      childrenByParentId.set(parentId, list);
    }
    for (const [, list] of childrenByParentId) list.sort(sortCategorias);
    this._categoriasById = byId;
    this._childrenByParentId = childrenByParentId;

    return data;
  }

  async _loadProdutos() {
    if (this._produtosCache) return this._produtosCache;
    const raw = await fs.readFile(this.produtosFilePath, "utf8");
    const parsed = JSON.parse(raw);
    const data = Array.isArray(parsed) ? parsed : [];
    this._produtosCache = data;

    const byId = new Map();
    const bySlug = new Map();
    const byCategoryId = new Map();
    for (const p of data) {
      const id = Number(p?.id);
      if (Number.isFinite(id)) byId.set(id, p);
      const slug = String(p?.slug ?? "").trim().toLowerCase();
      if (slug) bySlug.set(slug, p);
      const categoryId = Number(p?.categoryId);
      if (Number.isFinite(categoryId)) {
        const list = byCategoryId.get(categoryId) ?? [];
        list.push(p);
        byCategoryId.set(categoryId, list);
      }
    }
    this._produtosById = byId;
    this._produtosBySlug = bySlug;
    this._produtosByCategoryId = byCategoryId;

    return data;
  }

  _buildNode(category) {
    const id = Number(category?.id);
    const children = (this._childrenByParentId?.get(id) ?? []).map((c) => this._buildNode(c));
    return { ...category, children };
  }

  _collectDescendantsIds(rootId) {
    const out = [];
    const queue = [rootId];
    while (queue.length) {
      const current = queue.shift();
      const children = this._childrenByParentId?.get(current) ?? [];
      for (const c of children) {
        const id = Number(c?.id);
        if (!Number.isFinite(id)) continue;
        out.push(id);
        queue.push(id);
      }
    }
    return out;
  }

  async getCategoriasTree() {
    await this._loadCategorias();
    const roots = this._childrenByParentId?.get(0) ?? [];
    return roots.map((c) => this._buildNode(c));
  }

  async getCategoriaByIdWithChildren(idCategoria) {
    const id = assertInt(idCategoria, "idCategoria");
    await this._loadCategorias();
    const found = this._categoriasById?.get(id) ?? null;
    if (!found) {
      const err = new Error("category not found");
      err.statusCode = 404;
      throw err;
    }
    const children = this._childrenByParentId?.get(id) ?? [];
    return { category: found, children };
  }

  async getProdutosByCategoria(idCategoria, { includeDescendants = 1, page = 1, pageSize = 24 } = {}) {
    const id = assertInt(idCategoria, "idCategoria");
    const p = clampPage(page);
    const ps = clampPageSize(pageSize);
    const include = Number(includeDescendants) === 0 ? 0 : 1;

    await this._loadCategorias();
    await this._loadProdutos();

    const exists = this._categoriasById?.has(id);
    if (!exists) {
      const err = new Error("category not found");
      err.statusCode = 404;
      throw err;
    }

    const ids = include ? [id, ...this._collectDescendantsIds(id)] : [id];
    const items = [];
    for (const cid of ids) {
      const list = this._produtosByCategoryId?.get(cid) ?? [];
      for (const p of list) items.push(p);
    }

    return paginate(items, { page: p, pageSize: ps });
  }

  async getProdutoById(idProduto) {
    const id = assertInt(idProduto, "idProduto");
    await this._loadProdutos();
    const found = this._produtosById?.get(id) ?? null;
    if (!found) {
      const err = new Error("product not found");
      err.statusCode = 404;
      throw err;
    }
    return found;
  }

  async getProdutoBySlug(slug) {
    const s = assertSlug(slug);
    await this._loadProdutos();
    const found = this._produtosBySlug?.get(s) ?? null;
    if (!found) {
      const err = new Error("product not found");
      err.statusCode = 404;
      throw err;
    }
    return found;
  }
}
```

### Regras internas

#### Cache

- `categoriasCache: Categoria[] | null`
- `produtosCache: Produto[] | null`

#### Montagem da árvore

- `getCategoriasTree()` retorna `CategoriaNode[]` (raízes + children recursivo).
- Ordenar `children` por `order ASC` e depois `id ASC`.

#### Categoria por id (pai + filhos)

- `getCategoriaByIdWithChildren(idCategoria)` retorna:
  - `category` (objeto da categoria)
  - `children` (lista de filhos diretos)

#### Produtos por categoria (com descendentes) + paginação

- Quando `includeDescendants=1`, coletar todos os ids da subárvore:
  - `ids = [idCategoria, ...descendants]`
  - filtrar produtos por `product.categoryId ∈ ids`
- Paginação:
  - `page` mínimo 1
  - `pageSize` mínimo 1, máximo 100
  - `offset = (page - 1) * pageSize`
  - `data = items.slice(offset, offset + pageSize)`
  - `totalPages = Math.ceil(total / pageSize)` (mínimo 1 quando `total > 0`)

### Erros (contrato sugerido)

- `idCategoria`, `idProduto`: se inválido → `400`
- recurso não encontrado → `404`
- erro ao ler/parsear JSON → `500`

### Mapeamento endpoint → método

- `GET /Servidor/webservice/integration/produtos/categorias` → `getCategoriasTree()`
- `GET /Servidor/webservice/integration/produtos/categorias/:idCategoria` → `getCategoriaByIdWithChildren(idCategoria)`
- `GET /Servidor/webservice/integration/produtos/by-categoria/:idCategoria` → `getProdutosByCategoria(idCategoria, { includeDescendants, page, pageSize })`
- `GET /Servidor/webservice/integration/produtos/by-id/:idProduto` → `getProdutoById(idProduto)`
- `GET /Servidor/webservice/integration/produtos/by-slug/:slug` → `getProdutoBySlug(slug)`

---

## Extensão: modo original (proxy upstream)

Contexto: já existe um handler “original/proxy” de produtos em:

- [handlers/api/products.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/api/products.mjs)

Ele faz proxy para o upstream usando `INTEGRATION_URL_API` e os paths:

- `/Servidor/webservice/integration/getListProdutoLoja`
- `/Servidor/webservice/integration/getProdutoLoja`

Objetivo desta seção: permitir que a API de produtos tenha **dois backends** com a mesma interface:

- Mock (JSON local) → `ProdutosController` (deste desenho)
- Original (proxy upstream) → `ProdutosUpstreamApi` (novo desenho)

### Por que separar em camadas

Separar “regra de negócio” de “fonte de dados” evita duplicação e facilita alternar entre mock/original.

- `handler` lida com HTTP (params, query, statusCode, CORS).
- `ProdutosController` concentra regras (árvore, descendentes, paginação, busca por id/slug).
- `ProdutosProvider` encapsula como buscar dados (JSON local vs upstream real).

```mermaid
flowchart LR
  H[Handler HTTP (req/res)] --> C[ProdutosController]
  C --> P[ProdutosProvider]
  P --> J[(categorias.json / produtos.json)]
  P --> U[(Upstream via INTEGRATION_URL_API)]
```

### Interface comum (contrato)

```js
export class ProdutosProvider {
  async getCategoriasTree() {}
  async getCategoriaByIdWithChildren(idCategoria) {}
  async getProdutosByCategoria(idCategoria, opts) {}
  async getProdutoById(idProduto) {}
  async getProdutoBySlug(slug) {}
}
```

### Implementação “original” (desenho)

`ProdutosUpstreamApi` não lê JSON. Ela apenas chama o upstream e normaliza payload.

```js
export class ProdutosUpstreamApi extends ProdutosProvider {
  constructor({ integrationBaseUrl, fetchImpl = fetch }) {
    super();
    this.integrationBaseUrl = String(integrationBaseUrl ?? "").replace(/\/+$/, "");
    this.fetchImpl = fetchImpl;
  }

  async getProdutosByCategoria(idCategoria, { page = 1, pageSize = 24 } = {}) {}
  async getProdutoById(idProduto) {}
  async getProdutoBySlug(slug) {}
}
```

### Como reutilizar o que já existe hoje (sem duplicar lógica)

O `handlers/api/products.mjs` já tem a lógica de proxy (`proxyToIntegration`) mas ela não é exportada.

Opções de desenho:

1) Extrair `proxyToIntegration` para um util compartilhado em `WWW/MICROSERVICE/MOCK-END/lib/` e reutilizar tanto no handler atual quanto no provider upstream.
2) Manter o handler atual e criar um “adapter” que chame o próprio upstream direto (replicando join de URL + headers + tratamento de erro).

Recomendado: **opção 1**.

- Um único lugar para: montar URL (`normalizeJoin`), headers (`buildProxyRequestHeaders`), filtrar headers (`filterUpstreamHeaders`), tratar timeout/erro e padronizar `502`.
- Reduz divergência entre handlers e evita “copiar e colar proxy” em cada endpoint novo.

Regra: a classe deve continuar **independente de HTTP server** (sem `req/res`), para ser testável e reutilizável; quem traduz `req/res` → método da classe é a camada de handler.

---

## Template de aplicação (handlers)

Esta seção mostra como “plugar” o desenho no mock-end:

- Handler recebe `req/res/ctx`
- Handler valida e extrai params/query
- Handler chama `ProdutosController`
- Handler devolve via `json(res, status, payload, cors)`

### Handler mock (JSON local)

```js
import path from "node:path";
import { fileURLToPath } from "node:url";

import { json } from "../../../../../lib/response.mjs";
import { ProdutosController } from "../../../../../lib/produtos/ProdutosController.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const controller = new ProdutosController({
  categoriasFilePath: path.resolve(__dirname, "..", "categorias.json"),
  produtosFilePath: path.resolve(__dirname, "..", "produtos.json"),
});

function toInt(value) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

async function categorias(req, res, ctx) {
  const cors = ctx.cors ?? {};
  try {
    const data = await controller.getCategoriasTree();
    json(res, 200, { success: true, data }, cors);
  } catch (err) {
    json(res, err?.statusCode ?? 500, { success: false, message: String(err?.message ?? err) }, cors);
  }
}

async function categoriaById(req, res, ctx) {
  const cors = ctx.cors ?? {};
  try {
    const idCategoria = toInt(ctx?.routeParams?.idCategoria);
    if (idCategoria == null) return json(res, 400, { success: false, message: "idCategoria inválido" }, cors);
    const data = await controller.getCategoriaByIdWithChildren(idCategoria);
    json(res, 200, { success: true, data }, cors);
  } catch (err) {
    json(res, err?.statusCode ?? 500, { success: false, message: String(err?.message ?? err) }, cors);
  }
}

async function produtosByCategoria(req, res, ctx) {
  const cors = ctx.cors ?? {};
  try {
    const idCategoria = toInt(ctx?.routeParams?.idCategoria);
    if (idCategoria == null) return json(res, 400, { success: false, message: "idCategoria inválido" }, cors);

    const qp = new URLSearchParams(ctx.url?.search ?? "");
    const includeDescendants = toInt(qp.get("includeDescendants")) ?? 1;
    const page = toInt(qp.get("page")) ?? 1;
    const pageSize = toInt(qp.get("pageSize")) ?? 24;

    const out = await controller.getProdutosByCategoria(idCategoria, { includeDescendants, page, pageSize });
    json(res, 200, { success: true, ...out }, cors);
  } catch (err) {
    json(res, err?.statusCode ?? 500, { success: false, message: String(err?.message ?? err) }, cors);
  }
}

async function produtoById(req, res, ctx) {
  const cors = ctx.cors ?? {};
  try {
    const idProduto = toInt(ctx?.routeParams?.idProduto);
    if (idProduto == null) return json(res, 400, { success: false, message: "idProduto inválido" }, cors);
    const data = await controller.getProdutoById(idProduto);
    json(res, 200, { success: true, data }, cors);
  } catch (err) {
    json(res, err?.statusCode ?? 500, { success: false, message: String(err?.message ?? err) }, cors);
  }
}

async function produtoBySlug(req, res, ctx) {
  const cors = ctx.cors ?? {};
  try {
    const slug = String(ctx?.routeParams?.slug ?? "");
    const data = await controller.getProdutoBySlug(slug);
    json(res, 200, { success: true, data }, cors);
  } catch (err) {
    json(res, err?.statusCode ?? 500, { success: false, message: String(err?.message ?? err) }, cors);
  }
}

export const handlers = {
  categorias,
  categoriaById,
  produtosByCategoria,
  produtoById,
  produtoBySlug,
};
```

### Handler original (proxy upstream)

Ideia: o handler original não usa o `ProdutosController` (ele não tem o JSON local). Ele usa um helper de proxy.

```js
import { json } from "../../../../../lib/response.mjs";
import { resolveProjectEnv } from "../../../../../lib/env.mjs";
import { proxyToIntegration } from "../../../../../lib/integration-proxy.mjs";

async function listProdutoLoja(req, res, ctx) {
  const cors = ctx.cors ?? {};
  try {
    const env = await resolveProjectEnv({ projectDir: ctx.projectDir, fallback: {} });
    const baseUrl = String(env.INTEGRATION_URL_API ?? "").trim();
    if (!baseUrl) return json(res, 500, { error: "proxy_not_configured", env: "INTEGRATION_URL_API" }, cors);

    await proxyToIntegration(req, res, { ...ctx, integrationBaseUrl: baseUrl }, "/Servidor/webservice/integration/getListProdutoLoja");
  } catch (err) {
    json(res, 502, { error: "bad_gateway" }, cors);
  }
}

export const handlers = { listProdutoLoja };
```

---

## Mapa: MOCK-END (rotas externas)

Objetivo: o mock-end expõe apenas endpoints externos (legado), e o frontend usa rotas internas do Next como “BFF”.

Estado alvo no Connect:

- As rotas novas ficam no namespace:
  - `/Servidor/webservice/integration/produtos/...`
- As rotas antigas podem ficar temporariamente por compatibilidade:
  - `/Servidor/webservice/integration/getListProdutoLoja`
  - `/Servidor/webservice/integration/getProdutoLoja`

Observação sobre `execution: { mode: "mock" }`:

- Hoje o dispatcher do mock-end usa `execution.mode` para escolher handler mock/original/hybrid.
- Mesmo sendo endpoint externo, esse campo continua sendo a chave para alternar entre “JSON local” e “proxy upstream”.

Checklist (gradual):

1) Publicar os 5 endpoints novos de produtos (os definidos neste desenho).
2) Manter endpoints antigos enquanto o front ainda consome o fluxo antigo.
3) Quando o front estiver 100% no `produtosV2`, remover os endpoints antigos (ou mover para LEGADO).

---

## Mapa: CONNECT-ECOMMERCE (produtosV2)

Objetivo: criar uma camada interna no Next em `app/api` que chama o mock-end/upstream com token e expõe um contrato estável para o browser.

Regras:

- Browser consome apenas `/api/...` do Next.
- Rotas internas do Next (`app/api/...`) chamam rotas externas `/Servidor/webservice/...` usando token.
- Stores consomem apenas as rotas internas do Next.

### Contrato interno (V2)

Criar novas rotas internas para evitar conflito com as já existentes:

- `GET /api/produtosV2/categorias`
- `GET /api/produtosV2/categorias/:idCategoria`
- `GET /api/produtosV2/by-categoria/:idCategoria?includeDescendants=1&page=1&pageSize=24`
- `GET /api/produtosV2/by-id/:idProduto`
- `GET /api/produtosV2/by-slug/:slug`

### Token e integração (server-only)

No `connect-ecommerce`, o padrão atual de autenticação/integração já existe em `lib/integration/*`:

- `ensureAuthReady()` gera/atualiza token e configura keyBean
- `businessGet()` injeta header `Authorization` e faz retry em `401/403`

O `produtosV2` deve reutilizar isso para chamar:

- `/Servidor/webservice/integration/produtos/...`

### Onde implementar (gradual)

1) `lib/integration/productsServiceV2.ts`
- Implementa chamadas `businessGet()` para os endpoints novos.
- Concentra parsing do payload e normaliza os formatos.

2) `app/api/produtosV2/*`
- Camada BFF: valida params/query, chama `productsServiceV2`, responde `NextResponse.json`.

3) `lib/api/produtosV2.ts`
- Client do browser usando `apiClient()` com base `/api`.

4) `stores/produtosV2-store.ts`
- Store Zustand que consome `lib/api/produtosV2.ts`.
- Expõe estado: `categoriasTree`, `categoriaAtual`, `produtos`, `page`, `pageSize`, `total`, `totalPages`, `isBusy`, `error`.

5) `stores/control-store.ts`
- Registrar `PRODUTOSV2STORE` para o consumo centralizado.

### Critérios de pronto (V2)

- Nenhum componente client chama `/Servidor/webservice/...` direto.
- O store `produtosV2` é a única origem de estado para telas de categorias/produtos.
- Rotas internas `/api/produtosV2/...` funcionam com token (inclui refresh/retry).

---

## Ponto de atenção: mix Mock + Real (futuro)

Contexto:

- Mock (JSON local) previsto para viver em: `handlers/mock/...`
- Real (proxy upstream) previsto para viver em: `handlers/api/...`

Motivação:

- O upstream real pode não retornar 100% dos dados que a UI precisa.
- No começo, o fluxo pode ficar **100% mock**, mas deve existir um caminho planejado para **misturar/enriquecer** dados.

Regra atual:

- Fase 1: **100% mock** (prioridade de entrega e estabilidade).

Previsão (gatilho para refatorar):

- Quando surgir “campo faltando” no real, ativar um modo **hybrid/enrichment**.

Estratégias possíveis (desenho)

1) Hybrid por rota (usando `execution: { mode: "hybrid" }`)
- O dispatcher já suporta `mock/original/hybrid`.
- O `hybrid` chama primeiro o handler original e depois o mock (precisa garantir que o mock não sobrescreva resposta já enviada).
- Recomendação: se for usar esse caminho, ajustar o dispatcher/handlers para um modelo “compose payload” (não “double write” em `res`).

2) Hybrid por provider (Recomendado)

Criar um provider que compõe duas fontes:

- `ProdutosUpstreamApi` (real)
- `ProdutosController` (mock JSON)

Comportamento:

- Buscar no real primeiro.
- Se o payload vier incompleto (ou campos críticos faltarem), enriquecer com mock por chave:
  - produto: `id` ou `slug`
  - categoria: `id`
- Definir política explícita de merge:
  - real tem prioridade para preço/estoque
  - mock completa imagem/badges/labels (exemplos)

Assinatura sugerida (desenho):

```js
export class ProdutosHybridProvider extends ProdutosProvider {
  constructor({ real, mock }) {
    super();
    this.real = real;
    this.mock = mock;
  }

  async getProdutoById(idProduto) {}
  async getProdutoBySlug(slug) {}
  async getProdutosByCategoria(idCategoria, opts) {}
}
```

Checklist do hybrid:

- Definir “campos mínimos” que o real precisa fornecer.
- Definir fallback de imagem/categoria/badges quando real não tiver.
- Garantir paginação consistente (se real pagina, mock só enriquece; se real não pagina, pagina no controller).
