# Plano — Aplicar tradução de PRODUTOS usando `categorias.json` + `brands.json` (Passo 1/2/3)

## Resumo
Aplicar a mesma lógica de tradução (produto do back → contrato do front) para **todos os pontos de produtos** no fluxo Lopes, garantindo que:
- **Não há mudança** nos snapshots de categorias/marcas (nenhuma alteração em `categorias.json` e `brands.json`).
- O produto traduzido **usa** os JSONs locais apenas como **lookup** para montar `category` e `brand` no retorno.

## Estado atual (confirmado no repo)
- Snapshots locais:
  - `WWW/REFERENCIAS/connect-ecommerce/lib/mockups/data/categorias.json`
  - `WWW/REFERENCIAS/connect-ecommerce/lib/mockups/data/brands.json`
- Categorias via JSON local (runtime):
  - `GET /api/lopes/produtos/categorias`
  - `GET /api/lopes/produtos/categorias/[idCategoria]`
  - `GET /api/lopes/produtos/categorias/by-slug/[...slug]`
- Atualização manual do snapshot de categorias (botão no /dev):
  - `POST /api/dev/categorias/update-json` grava `lib/mockups/data/categorias.json`
- Produto (1 item) já está sendo usado como modelo de teste:
  - `GET /api/lopes/produto-loja?codProd=...` (fonte Lopes Back via `getBackProdutoLoja`)
- Endpoints de produtos a completar/alinhar:
  - `GET /api/lopes/produtos/by-id/[idProduto]`
  - `GET /api/lopes/produtos/by-slug/[slug]`
  - `GET /api/lopes/produtos/by-categoria/[idCategoria]?includeDescendants=0|1&page=&pageSize=`

## Objetivo (critérios de sucesso)
- Todos os endpoints de **produtos** (acima) retornam produto(s) no **mesmo shape do mock** (referência: `lib/mockups/data/produtos.json`), com:
  - `category: { id, name, slug, familia: [...] }`
  - `brand: { id, name, slug, image }`
- `category` e `brand` são montados consultando **apenas** `categorias.json` e `brands.json` (lookup), sem alterar esses arquivos.
- `by-categoria` aplica paginação local (back não pagina) e suporta `includeDescendants`.

## Decisões (para deixar o plano executável)
### 1) Categoria (lookup sem modificar snapshot)
- Entrada do back: `categoriaPrinciapal` (número).
- Regra:
  - Se `categoriaPrinciapal` existir no `categorias.json`: usar `name/slug` reais e montar `familia` subindo `parentId`.
  - Se não existir no snapshot: **não inventar categoria**; manter fallback de texto (`sem categoria`) e:
    - `category.id` permanece como o `categoriaPrinciapal` recebido (se vier 0, fica 0).
    - `familia` fica com 1 item usando o mesmo `id` (e nome/slug de fallback).
- Importante: isso não altera `categorias.json`, apenas muda como o produto monta o retorno.

### 2) Brand (lookup sem modificar snapshot)
- Nesta fase, o back não fornece uma marca confiável para mapear por id.
- Regra:
  - Sempre usar o item `id:0` do `brands.json` como fallback para `brand`.
  - Quando (e se) surgir um id/campo confiável de marca no retorno do back, o tradutor passa a resolver pelo `brands.json`.

### 3) Campos do produto (compat com referência do mock)
- `slug` e `sku` seguem o padrão do tradutor base (`tradutorBACKvcMOCK.mjs`):
  - `slug = /produtos/${slugify(name)}-${id}`
  - `sku = ${ean}-${id}` (fallback para `${slugify(name)}-${id}` se ean vazio/"null")
- `price`: número quando parseável, senão `null`
- `badges`: manter `[]` nesta fase (sem classificação automática)
- `image`: usar retorno do back, com fallback `/assets/images/semImagem.png` quando vazio

## Mudanças propostas (arquivos e o que fazer)
### A) Consolidar a tradução em um módulo único (Passo 2)
- Arquivo: `WWW/REFERENCIAS/connect-ecommerce/lib/mockups/translateLopesProdutosToProdutos.ts`
- Ajustar para:
  - Retornar shape compatível com `lib/mockups/data/produtos.json` (category/brand como objeto).
  - Aplicar as regras de categoria/brand descritas acima (lookup em `categorias.json` e `brands.json`).

### B) Endpoints de produtos (Passo 1/3)
1) `GET /api/lopes/produto-loja?codProd=...` (modelo de validação)
- Arquivo: `WWW/REFERENCIAS/connect-ecommerce/app/api/lopes/produto-loja/route.ts`
- Garantir que:
  - Faz Passo 1 chamando `getBackProdutoLoja(query)`
  - Faz Passo 2 chamando o tradutor + lookups dos JSONs locais
  - Faz Passo 3 retornando `{ success:true, data: produtoTraduzido }`

2) `GET /api/lopes/produtos/by-id/[idProduto]`
- Criar novo route handler em `app/api/lopes/produtos/by-id/[idProduto]/route.ts`
- Implementar:
  - Passo 1: `getBackProdutoLoja({ codProd: idProduto })`
  - Passo 2: traduzir usando lookups dos JSONs
  - Passo 3: `{ success:true, data }` ou `{ success:false, message }` (404 quando não encontrar)

3) `GET /api/lopes/produtos/by-slug/[slug]`
- Criar novo route handler em `app/api/lopes/produtos/by-slug/[slug]/route.ts`
- Implementar:
  - Passo 1: extrair `idProduto` do final do slug (`...-<id>`). Se falhar → 400.
  - Passo 2/3: delegar para o mesmo fluxo do `by-id`.

4) `GET /api/lopes/produtos/by-categoria/[idCategoria]`
- Arquivo: `WWW/REFERENCIAS/connect-ecommerce/app/api/lopes/produtos/by-categoria/[idCategoria]/route.ts`
- Ajustar para:
  - Passo 1: chamar `getBackListProdutoLoja({ idCategoria })`
    - `includeDescendants=1`: calcular descendentes via `categorias.json` e repetir chamadas, mesclar.
  - Passo 2: traduzir lista usando lookups dos JSONs locais
  - Passo 3: ordenar determinístico (ex.: por `id` asc) + paginação local + retorno no shape:
    - `{ success:true, data, page, pageSize, total, totalPages }`

### C) /dev para validar rápido
- Arquivo: `WWW/REFERENCIAS/connect-ecommerce/app/(shop)/dev/page.tsx`
- Adicionar links para:
  - `/api/lopes/produtos/by-id/<id>`
  - `/api/lopes/produtos/by-slug/<slug>`
  - (manter) `/api/lopes/produtos/by-categoria/<idCategoria>?...`
- Objetivo: você validar manualmente, clicando e observando retorno (incluindo o header `x-data-source`).

## Verificação (manual, sem testes automatizados)
1) No `/dev`, atualizar `categorias.json` pelo botão já existente.
2) Testar `GET /api/lopes/produto-loja?codProd=8` e comparar com o shape esperado do `lib/mockups/data/produtos.json`.
3) Testar:
  - `/api/lopes/produtos/by-id/<id>`
  - `/api/lopes/produtos/by-slug/<slug-com-id-no-final>`
  - `/api/lopes/produtos/by-categoria/<idCategoria>?includeDescendants=1&page=1&pageSize=24`
4) Confirmar que:
  - `category` e `brand` são objetos (não `categoryId`/string), e vieram de lookup dos JSONs (sem alterar os JSONs).
  - Em caso de categoria não resolvida, `category.id` preserva o id do back e nomes/slugs ficam fallback.

## Fora de escopo (por enquanto)
- Atualização automática de `brands.json`
- Classificação inteligente de marca/categoria por texto usando regras (`p_cat.json` / `p_marca.json`)
- Alterar estrutura de `categorias.json` e `brands.json` (somente consumo/lookup)

