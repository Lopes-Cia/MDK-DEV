# Refatorar Páginas de Catálogo (Produtos/Categorias/Marcas) Spec

## Why
O front já possui páginas antigas (incluindo uma página “estranha” em `/products`) que servem como referência visual/funcional, mas o catálogo novo passou a ter URLs amigáveis via `slug` (ex.: `/produtos/<slug>`, `/categoria/<slug>`, `/marca/<slug>`). Precisamos refatorar para usar o nosso formato final, sem compatibilidade com código legado.

## What Changes
- Analisar as páginas existentes de catálogo e produto (incluindo `/products`) para identificar componentes reutilizáveis (filtro, busca, grid, paginação).
- Refatorar a página “catálogo” (atual `/products`) para usar o domínio final de produtos/categorias/marcas (via BFF `/api/produtos/*` e store final).
- Criar uma página de categoria baseada no layout do `/products`, capaz de representar:
  - categoria pai, filho ou neto
  - busca/filtragem local
  - listagem paginada de produtos
- Criar uma página de marca baseada no layout do `/products`, exibindo produtos da marca (paginado).
- Garantir navegação por links usando o `slug` já no formato de rota (ex.: `href={produto.slug}` e `href={categoria.slug}`).
- Implementar estados `loading/empty/error` coerentes com o layout atual.
- **BREAKING** Remover dependências de chamadas/contratos antigos no fluxo principal dessas páginas (sem fallback/compatibilidade).

## Impact
- Affected specs: navegação por slug, catálogo/coleções, páginas de listagem.
- Affected code (front referência):
  - `WWW/REFERENCIAS/connect-ecommerce/app/(shop)/products/page.tsx`
  - Novas rotas:
    - `app/(shop)/categoria/[...slug]/page.tsx` (ou equivalente)
    - `app/(shop)/marca/[...slug]/page.tsx` (ou equivalente)
    - `app/(shop)/produtos/[...slug]/page.tsx` (produto detalhado, se necessário)
  - Componentes de grid/listagem e cards já existentes
  - Store de produtos: `stores/produtos-store.ts`

## ADDED Requirements
### Requirement: Página de categoria baseada no layout do catálogo
O sistema SHALL fornecer uma página de categoria que reutilize o layout/UX do catálogo (base `/products`) para exibir produtos por categoria.

#### Scenario: Categoria pai/filho/neto
- **WHEN** o usuário navega para `/categoria/<slug>`
- **THEN** a página carrega a categoria e lista produtos da categoria
- **AND** suporta categoria em qualquer nível (pai/filho/neto)

#### Scenario: Busca e filtro local
- **WHEN** o usuário digita busca e/ou filtra
- **THEN** a lista exibida é filtrada sem quebrar paginação/estado

### Requirement: Página de marca baseada no layout do catálogo
O sistema SHALL fornecer uma página de marca que reutilize o layout/UX do catálogo para exibir produtos de uma marca.

#### Scenario: Marca com produtos
- **WHEN** o usuário navega para `/marca/<slug>`
- **THEN** a página carrega a marca e lista seus produtos (paginado)

### Requirement: Navegação por slug amigável
O sistema SHALL usar o `slug` (já contendo o path) como fonte única de link.

#### Scenario: Card de produto
- **WHEN** um produto é exibido em um card
- **THEN** o link do card aponta para `produto.slug`

#### Scenario: Card/link de categoria
- **WHEN** uma categoria é exibida
- **THEN** o link aponta para `categoria.slug`

## MODIFIED Requirements
### Requirement: `/products` deixa de ser “estranho”
A página `/products` passa a ser a base funcional e visual de catálogo (referência), alimentada pelo store e endpoints finais.

## REMOVED Requirements
### Requirement: Compatibilidade com fluxo antigo de catálogo
**Reason**: reduz duplicação e evita divergência de regra.
**Migration**: páginas devem consumir store `/produtos` e usar `slug` como path final.

