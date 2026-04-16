# Falta de campos no Produto (`/api/produtos/by-slug`) vs layout rico (`summary/info/activity`)

## Contexto

Hoje, o “produto por slug” que existe no mock-end retorna basicamente o item do arquivo de dados (mock) e um envelope simples.

- Fonte de dados (mock): [produtos.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/produtos.json)
- Handler (mock-end): [produtos.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/produtos.mjs#L146-L168)
- Controller (mock-end): [ProdutosController.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/ProdutosController.mjs#L184-L204)

Este documento lista:

1) o payload atual do produto (por slug)  
2) o que um layout rico precisa em blocos `summary`, `info` e `activity`  
3) fallbacks/tolerâncias já existentes no front (quando aplicável)  
4) o que falta implementar no backend para suportar os blocos ricos sem “gambiarras” no client

## Payload atual (estado real)

### Envelope e erros

Hoje o endpoint retorna:

- **200**: `{ success: true, data: <produto> }`
- **400** (slug vazio): `{ error: "slug is required" }`
- **404** (não encontrado): `{ error: "not_found" }`

Observação: os payloads de erro não seguem o mesmo envelope (`success: false`), o que força tolerância extra no consumidor.

### Produto (campos atuais em `data`)

O objeto de produto (mock) hoje contém, na prática:

- `id: number`
- `sku: string`
- `name: string`
- `slug: string` (com prefixo `/produtos/`)
- `unitLabel: string`
- `sizeLabel: string`
- `price: number`
- `compareAtPrice: number | null`
- `badges: string[]`
- `image: string` (URL absoluta hoje)
- `stock: number`
- `inStock: boolean`
- `category: { id: number; name: string; slug: string; familia: { id: number; name: string; slug: string }[] }`
- `brand: { id: number; name: string; slug: string; image: string }`

Não há (no payload atual) campos de descrição rica, galeria, specs/atributos e nem dados de atividade (reviews etc).

## Layout rico (blocos) e campos faltantes

Abaixo, os blocos do layout rico são descritos como **necessidades de UI**. Onde algo dá para derivar do payload atual, está marcado como “derivável”.

### Bloco `summary` (cabeçalho da PDP + compra)

O `summary` concentra: galeria (ou imagem principal), identificação, preço/estoque e CTA.

Campos desejados (UI):

- Identidade:
  - `id` (OK)
  - `slug` (OK)
  - `sku` (OK)
  - `title/name` (OK: `name`)
  - `brand`: `name`, `slug`, `image` (OK hoje como objeto)
  - `badges` (OK)
- Mídia:
  - `images[]: { url, alt? }` (**FALTA**)  
    - Hoje só existe `image` (1 imagem).
    - Derivável: `images = [{ url: image, alt: name }]` como fallback, mas não cobre galeria real.
- Preço:
  - `price` (OK)
  - `compareAtPrice` (OK)
  - `currency` (**FALTA**) (assumido como BRL no front hoje)
  - `priceValidUntil?` (**FALTA**)
- Estoque / disponibilidade:
  - `inStock` (OK)
  - `stock` (OK)
  - `availabilityText` (**FALTA**) (ex.: “Disponível”, “Indisponível”, “Poucas unidades”)
- Contexto de navegação:
  - `breadcrumbs[]: { label, href }` (**DERIVÁVEL**) via `category.familia`
  - `category` (OK hoje) e `familia` (OK)

### Bloco `info` (descrição + detalhes técnicos)

O `info` concentra: descrição, especificações, informações legais/ingredientes etc.

Campos desejados (UI):

- Descrição rica:
  - `descriptionHtml` **ou** `descriptionMarkdown` (**FALTA**)
  - `shortDescription` (**FALTA**)
- Especificações:
  - `specs[]: { label, value }` (**FALTA**)
  - `attributes` estruturados (**FALTA**) (ex.: `volumeMl`, `pesoG`, `unidade`, `embalagem`, etc.)
- Informações de consumo (quando aplicável):
  - `ingredients` (**FALTA**)
  - `allergens` (**FALTA**)
  - `nutritionFacts` (**FALTA**)
- Mídia complementar:
  - `videoUrl?` (**FALTA**)
  - `documents[]` (PDF/manual) (**FALTA**)

Hoje nada disso existe no payload (precisa vir do backend ou de uma fonte de conteúdo).

### Bloco `activity` (provas sociais + pós-compra)

O `activity` concentra: avaliações, perguntas/respostas e relacionados (ou comportamento).

Campos desejados (UI):

- Reviews:
  - `reviewsSummary: { avg: number; count: number }` (**FALTA**)
  - `reviews[]` paginadas (**FALTA**)
- Q&A:
  - `questions[]` paginadas (**FALTA**)
- Relacionados:
  - `relatedProducts[]` (**FALTA**) (ids/slugs suficientes para buscar cards)
- Métricas/comportamento (opcional, mas normalmente exigido por “activity”):
  - `recentlyBought?`, `views?` (**FALTA**)

## Fallbacks já implementados (front)

No front atual do `n1`, a PDP e tiles de produto já toleram ausência de alguns campos:

- Imagem: se `image` estiver vazio, a UI não renderiza imagem (sem placeholder explícito) ([product-client.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/n1/src/components/pages/product-client.tsx#L30-L46)).
- Marca/unidade/tamanho: `brand`, `unitLabel`, `sizeLabel` são tratados como opcionais e não quebram renderização ([product-client.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/n1/src/components/pages/product-client.tsx#L49-L54)).
- Compra: botão desabilita quando `!inStock || stock <= 0` ([product-client.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/n1/src/components/pages/product-client.tsx#L62-L78)).
- Estados: `loading` e “não encontrado” já existem para o fetch do produto ([product-client.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/n1/src/components/pages/product-client.tsx#L36-L40)).

Observação importante: o `n1` consome outro contrato (`CatalogProduct`) que usa `brand?: string` (não objeto) ([catalog-client.ts](file:///c:/LOPES/www/MDK-DEV/WWW/n1/src/lib/mockend/catalog-client.ts#L9-L24)). Para reaproveitar o payload “rico” atual (com `brand` objeto), seria necessário normalizar/transformar no BFF ou ajustar o tipo do consumidor.

## O que falta implementar no backend (para suportar `summary/info/activity`)

### 1) Padronizar envelope de erro

Hoje o endpoint mistura:

- sucesso: `{ success: true, data }`
- erro: `{ error: "..." }`

Para consumo robusto (store + UI), o ideal é unificar para:

- `{ success: false, code, message }` em erros

### 2) Adicionar “mídia rica” (galeria)

Adicionar ao produto:

- `images: { url: string; alt?: string }[]`

Fallback mínimo no backend (se não tiver galeria):

- `images = image ? [{ url: image, alt: name }] : []`

### 3) Adicionar conteúdo do bloco `info`

Adicionar ao produto (mínimo viável):

- `shortDescription?: string`
- `descriptionHtml?: string` (ou `descriptionMarkdown`)
- `specs?: { label: string; value: string }[]`

Deixar ingredientes/nutrição como extensões opcionais por categoria.

### 4) Adicionar dados do bloco `activity` (ou endpoints separados)

Existem duas abordagens:

- Embutir no payload do produto:
  - `reviewsSummary`, `relatedProducts`
- Ou expor endpoints complementares (recomendado quando cresce):
  - `GET /api/produtos/:slug/reviews`
  - `GET /api/produtos/:slug/related`
  - `GET /api/produtos/:slug/questions`

### 5) Normalização de shape para o front

Se o front final for “block-driven” (`summary/info/activity`), o backend pode:

- retornar um `product` “flat” + `blocks`, ou
- retornar um `product` com campos suficientes e o front monta os blocos.

Recomendação prática (trade-off):

- **Recomendar**: retornar **produto com campos completos** + manter montagem de blocos no front.
  - Prós: flexibilidade de UI e reuso (cards/PLP/PDP).
  - Contras: o front precisa de regras consistentes de montagem (e tolerância a campo faltante).

## Checklist (pronto quando)

- `/api/produtos/by-slug` retorna `success/data` em 200 e `success:false` em erros.
- Produto retorna `images[]` (mesmo que “degenerado” a partir de `image`).
- Produto retorna `shortDescription/description/specs` (ou uma estrutura equivalente) para preencher `info`.
- Existe um caminho definido para `activity` (embutido ou endpoints dedicados).

