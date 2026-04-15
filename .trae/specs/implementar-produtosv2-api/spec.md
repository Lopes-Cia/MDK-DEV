# ProdutosV2 API (Mock-end + Next BFF) Spec

## Why

Precisamos padronizar uma API de produtos/categorias baseada em endpoints externos (legado) no mock-end, e expor um contrato interno estável no Next (`/api/produtosV2/...`) consumido via store, com suporte a paginação e evolução para mix Mock+Real.

## What Changes

- Implementar endpoints externos no mock-end no namespace `/Servidor/webservice/integration/produtos/...` conforme desenho em [produtos-api.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/produtos-api.md).
- Implementar `ProdutosController` (mock JSON local) e handlers mock que traduzem `req/res/ctx` → controller → JSON.
- Preparar modo “original/proxy” reutilizando um util de proxy compartilhado (extração de `proxyToIntegration`) para suportar evolução.
- Criar rotas internas no Next `connect-ecommerce` em `app/api/produtosV2/*` que chamam os endpoints externos com token via `lib/integration/*`.
- Criar client interno `lib/api/produtosV2.ts` e store `stores/produtosV2-store.ts` para consumo no front via `control-store`.
- Manter rotas antigas (ex.: `/Servidor/webservice/integration/getListProdutoLoja`) temporariamente para compatibilidade até migração completa para `produtosV2`.

## Impact

- Affected specs: Mock-end Connect routes/handlers; Next.js App Router API routes; Zustand store pattern via `control-store`.
- Affected code:
  - Mock-end: `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs`, `PROJETOS/connect/handlers/*`, `MOCK-END/lib/*`
  - Next: `WWW/REFERENCIAS/connect-ecommerce/app/api/*`, `lib/integration/*`, `lib/api/*`, `stores/*`
  - Desenho fonte: [produtos-api.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/produtos-api.md)

## ADDED Requirements

### Requirement: External Produtos API (mock-end)

O sistema SHALL expor endpoints externos para categorias e produtos, com paginação, operando em modo mock inicialmente.

#### Scenario: Categorias em árvore
- **WHEN** chamar `GET /Servidor/webservice/integration/produtos/categorias`
- **THEN** retornar `200` com `{ success: true, data: CategoriaNode[] }`, onde `data` é uma árvore (pai → filhos → netos), ordenada por `order ASC` e `id ASC`.

#### Scenario: Categoria por id (pai + filhos)
- **WHEN** chamar `GET /Servidor/webservice/integration/produtos/categorias/:idCategoria`
- **THEN** retornar `200` com `{ success: true, data: { category, children } }`
- **AND** retornar `400` se `idCategoria` inválido
- **AND** retornar `404` se não existir

#### Scenario: Produtos por categoria com paginação
- **WHEN** chamar `GET /Servidor/webservice/integration/produtos/by-categoria/:idCategoria?includeDescendants=1&page=1&pageSize=24`
- **THEN** retornar `200` com `{ success: true, data: Produto[], page, pageSize, total, totalPages }`
- **AND** aplicar `page>=1`, `pageSize>=1`, `pageSize<=100`
- **AND** incluir descendentes quando `includeDescendants=1` (padrão)
- **AND** retornar `400` para params inválidos e `404` para categoria inexistente

#### Scenario: Produto por id
- **WHEN** chamar `GET /Servidor/webservice/integration/produtos/by-id/:idProduto`
- **THEN** retornar `200` com `{ success: true, data: Produto }`
- **AND** `400` se inválido; `404` se não existir

#### Scenario: Produto por slug
- **WHEN** chamar `GET /Servidor/webservice/integration/produtos/by-slug/:slug`
- **THEN** retornar `200` com `{ success: true, data: Produto }`
- **AND** slug é case-insensitive
- **AND** `400` se vazio; `404` se não existir

### Requirement: Internal ProdutosV2 BFF (Next)

O sistema SHALL expor rotas internas no Next em `app/api/produtosV2/*` para consumo pelo browser, chamando os endpoints externos com token.

#### Scenario: Rotas internas V2
- **WHEN** chamar `GET /api/produtosV2/categorias`
- **THEN** o Next deve chamar `businessGet('/Servidor/webservice/integration/produtos/categorias', ...)` e devolver resposta normalizada via `NextResponse.json`.
- **AND** nenhuma rota interna deve exigir que o browser envie token.

### Requirement: Store produtosV2 (Zustand)

O sistema SHALL disponibilizar um store `produtosV2` consumindo apenas as rotas internas do Next (`/api/produtosV2/...`).

#### Scenario: Consumo via control-store
- **WHEN** o front precisar de produtos/categorias
- **THEN** deve acessar via `useControlStore().PRODUTOSV2STORE(...)` (sem fetch direto no componente).

## MODIFIED Requirements

### Requirement: Produtos (V1) continua funcionando durante migração

- Rotas e serviços atuais (`/api/products` no Next) permanecem funcionais durante a migração.
- `produtosV2` não quebra o fluxo existente; ele é introduzido em paralelo.

## REMOVED Requirements

### Requirement: UI chamar endpoints externos diretamente
**Reason**: evita CORS, vazamento de detalhes de integração e dependência de token no client.
**Migration**: mover chamadas para `app/api/produtosV2/*` e consumir via store `produtosV2`.

