# Plano — Testar o front alternando fonte (mock vs lopes) com o mínimo de fallback

## Objetivo
Permitir testar o front usando:
- **mock**: endpoints atuais `/api/produtos/*`
- **lopes**: endpoints implementados `/api/lopes/produtos/*`

E validar o fluxo real (sem “chutar” dados):
- `/categorias`
- `/categoria/<slug>` (ex.: `/categoria/bebidas`)
- `/produtos/<slug>` **com id no final** (ex.: `/produtos/heineken-lata-269ml-8`)

> Observação: **produto por slug sem id** não existe no back e não será suportado no modo lopes (mínimo de fallback).

## Estado atual (baseado no repo)
- Páginas consomem store (`stores/produtos-store.ts`) → client API (`lib/api/produtos.ts`).
- Categorias “lopes” já estão completas via `categorias.json` local:
  - `/api/lopes/produtos/categorias`
  - `/api/lopes/produtos/categorias/[idCategoria]`
  - `/api/lopes/produtos/categorias/by-slug/[...slug]`
- Produtos “lopes” já existem:
  - `/api/lopes/produtos/by-categoria/[idCategoria]` (usa `getBackListProdutoLoja({ idCategoria })`, paginação local)
  - `/api/lopes/produtos/by-id/[idProduto]` (usa `getBackProdutoLoja({ codProd })`)
  - `/api/lopes/produtos/by-slug/[slug]` (hoje exige `-<id>` no final)
- Tradução de produto (lookup sem alterar JSONs):
  - usa `lib/mockups/data/categorias.json` e `lib/mockups/data/brands.json` apenas como lookup para montar `category` e `brand`
  - não altera snapshots
- Ponto pendente para não quebrar o front no modo lopes:
  - **brands**: o front sempre chama `loadBrands()` na página de produto.

## Decisões (para evitar erro)
1) **Categorias**: slug é resolvido pelo JSON local → `by-slug` funciona sem id.
2) **Produtos**: slug do produto **precisa** conter id (`...-<id>`) para chamar o back por `codProd`.
3) Sem fallback “buscar por nome” no modo lopes.
4) A troca mock/lopes será centralizada em `lib/api/produtos.ts` (um único ponto).

## Implementação (5 passos)
### 1) Implementar brands no modo lopes (sem inventar dados)
- Criar `GET /api/lopes/produtos/brands`
  - lê `lib/mockups/data/brands.json`
  - retorna `{ success:true, data: Brand[] }`
- (Opcional, só se precisar para telas de marca) criar `GET /api/lopes/produtos/brands/[idBrand]`
  - retorna o contrato mínimo esperado pela UI (brand do JSON + products vazio/paginado)
  - sem tentar “deduzir marca” do back nesta fase

### 2) Criar o seletor de fonte no client API (um único switch)
- Editar `lib/api/produtos.ts`
- Criar helper `baseProdutosPath()`:
  - `mock` → `/produtos`
  - `lopes` → `/lopes/produtos`
- Aplicar em todas as funções:
  - `getCategoriasTree()`
  - `getCategoriaBySlug()`
  - `getCategoriaById()`
  - `getProdutosByCategoria()`
  - `getProdutoById()`
  - `getProdutoBySlug()`
  - `getBrands()`
  - `getBrandById()` (se endpoint existir)

### 3) Ajustar store para não ter “atalhos” (usar sempre o client API)
- Editar `stores/produtos-store.ts`
- Remover/evitar qualquer caminho especial que force `/api/lopes/categorias`.
- `loadCategoriasTree`, `loadCategoriaBySlug`, `loadProdutosByCategoria`, `loadProdutoBySlug`, `loadBrands` devem depender apenas de `lib/api/produtos.ts`.

### 4) Regras de URL para teste (sem erro)
- `/categorias`: depende só de `getCategoriasTree()` (lopes ou mock).
- `/categoria/bebidas`: depende de:
  - `getCategoriaBySlug("/categoria/bebidas")`
  - `getProdutosByCategoria(id, includeDescendants=1, page, pageSize)`
- `/produtos/heineken-lata-269ml-8`:
  - `getProdutoBySlug("/produtos/heineken-lata-269ml-8")` → no modo lopes extrai id e chama `by-id`.
  - **No modo lopes**, `/produtos/heineken-lata-269ml` (sem id) deve retornar erro (sem fallback).

### 5) Verificação manual (sem testes automatizados)
1) Rodar com fonte=mock e validar:
  - `/categorias`
  - `/categoria/bebidas`
  - `/produtos/<slug-do-mock>`
2) Rodar com fonte=lopes e validar:
  - `/categorias`
  - `/categoria/bebidas`
  - `/produtos/<slug-com-id>` (ex.: `...-8`)
3) Confirmar via Network:
  - chamadas indo para `/api/lopes/produtos/*` no modo lopes
  - `by-slug` (produto) sem id retorna 400/404 (mínimo fallback)

## Critérios de aceite
- Trocar fonte altera somente endpoints chamados (sem mudar páginas).
- As 3 rotas do site funcionam no modo lopes:
  - `/categorias`
  - `/categoria/bebidas`
  - `/produtos/<slug>-<id>`
- Nenhuma modificação em `categorias.json` e `brands.json` é feita pelo fluxo do front.

