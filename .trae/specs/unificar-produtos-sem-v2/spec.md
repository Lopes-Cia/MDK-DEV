# Unificar Produtos Sem V2 Spec

## Why
Hoje coexistem dois conjuntos de APIs e código no front (`products` legado e `produtosV2`). Isso aumenta duplicação e confusão. O objetivo é ficar com **uma única** superfície: `produtos` (sem V2) e remover todo legado.

## What Changes
- Renomear a API interna BFF de `produtosV2` para `produtos` (mesma semântica, novo path).
- Renomear store e client API para remover `V2` de nomes de arquivo, exports e chaves do `control-store`.
- Remover rotas/arquivos/referências antigas (`produtosV2` e `products` legado) sem manter compatibilidade.
- Ajustar o painel `/(shop)/dev` para testar somente as rotas finais.

## Impact
- Affected specs: catálogo (`produtos`, categorias, marcas), home (links).
- Affected code (front referência):
  - `WWW/REFERENCIAS/connect-ecommerce/app/api/produtosV2/**` → `app/api/produtos/**`
  - `WWW/REFERENCIAS/connect-ecommerce/lib/api/produtosV2.ts` → `lib/api/produtos.ts`
  - `WWW/REFERENCIAS/connect-ecommerce/stores/produtosV2-store.ts` → `stores/produtos-store.ts`
  - `WWW/REFERENCIAS/connect-ecommerce/stores/control-store.ts` (registro do store)
  - `WWW/REFERENCIAS/connect-ecommerce/app/api/products/**` (manter como referência por enquanto)
  - `WWW/REFERENCIAS/connect-ecommerce/lib/api/products.ts` (manter como referência por enquanto)
  - `WWW/REFERENCIAS/connect-ecommerce/lib/integration/productsService.ts` (manter como referência por enquanto)
  - páginas que consomem `/products` e `getProducts()` (não migrar agora)

## ADDED Requirements
### Requirement: Rotas finais de produtos (BFF)
O sistema SHALL expor rotas internas finais sem V2:
- `GET /api/produtos/categorias`
- `GET /api/produtos/categorias/:idCategoria`
- `GET /api/produtos/by-categoria/:idCategoria?includeDescendants=1&page=1&pageSize=24`
- `GET /api/produtos/by-id/:idProduto`
- `GET /api/produtos/by-slug/:slug`
- `GET /api/produtos/brands`
- `GET /api/produtos/brands/:idBrand?page=1&pageSize=24`

#### Scenario: Consumo no browser
- **WHEN** o front precisa buscar catálogo/categorias/marcas
- **THEN** ele chama somente `/api/produtos/*` (nunca `/api/produtosV2/*` e nunca `/api/products/*`)

### Requirement: Store final sem V2
O sistema SHALL expor um store único para produtos/categorias/marcas sem sufixo V2.

#### Scenario: Uso via control-store
- **WHEN** UI consome dados de produtos/categorias/marcas
- **THEN** consome via `control-store` registrando `PRODUTOSSTORE` (ou equivalente sem V2)

## MODIFIED Requirements
### Requirement: Migração da superfície antiga
Rotas e código legados `produtosV2` deixam de existir após a migração. O legado `products` permanece temporariamente como referência.

## REMOVED Requirements
### Requirement: Compatibilidade com rotas V2 e products
**Reason**: considerado legado e fonte de duplicação.
**Migration**: atualizar import paths e chamadas para usar apenas a superfície final `/api/produtos/*` e store final. O legado `products` não deve ser usado em código novo.
