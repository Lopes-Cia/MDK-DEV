# GEN-SEED — Itens para Refatorar

## Feature: Enriquecimento de categoria em produtos

### Objetivo
Adicionar em cada produto a chave `categoryName` para simplificar consumo no frontend (evitar lookup por `categoryId` no cliente).

### Estado atual
- Campo novo: `produto.categoryName`
- Regra: `categoryName` deve ser o `name` da categoria apontada por `categoryId`
- Implementação atual está no gerador em `src/index.mjs` (durante `buildProducts`), no momento de criação do objeto de produto.

### Validações atuais
- Falha (throw) se `categoryId` não existir nas categorias
- Falha (throw) se `categoryName` estiver vazio
- Falha (throw) se `categoryName` não conferir com `categorias[categoryId].name`

### O que refatorar depois (proposta)
- Extrair uma etapa explícita `enrichProductsWithCategoryInfo(products, categories)` para:
  - evitar acoplamento da criação do produto com o enrichment
  - facilitar reuso/adição de novos campos derivados
- Padronizar a política de enrichment via config:
  - `products.enrich.categoryName: boolean`
  - (futuro) `products.enrich.categoryPath: boolean`

### Extensões sugeridas (futuro)
- `categoryPath`: string (ex.: `"Vinhos > Tintos > Seco"`)
- `categoryRootName`: string
- `categoryChildName`: string
- `categoryLeafName`: string (igual a `categoryName` quando `categoryId` é sempre neta)
- `categorySlug`: string (slug da categoria apontada)

### Critérios de pronto (quando refatorar)
- Gerador continua produzindo os mesmos `categoryId/categoryName` de antes
- Validações permanecem ou ficam mais claras (mensagens de erro melhores)
- Saída (`data/produtos.json`) mantém compatibilidade com consumidores atuais

## Feature: categoryFamilia (caminho de categoria)

### Objetivo
Adicionar em cada produto a chave `categoryFamilia` para carregar, junto do produto, a hierarquia de categoria baseada no `categoryId`.

### Formato
- `produto.categoryFamilia`: array de objetos (raiz → ... → leaf), ex.:
  - `[{id,name,slug},{id,name,slug},{id,name,slug}]`

### Regras
- O último item de `categoryFamilia` deve ter `id === categoryId`
- Cada item deve existir em `categorias.json` e bater `name/slug`

### Estado atual
- Campo novo: `produto.categoryFamilia`
- Implementação atual está no gerador em `src/index.mjs` durante `buildProducts`

### O que refatorar depois (proposta)
- Consolidar `categoryName` e `categoryFamilia` em uma etapa única:
  - `enrichProductsWithCategoryInfo(products, categories)`
- Tornar configurável via `config.json`:
  - `products.enrich.categoryFamilia: boolean`

### Critérios de pronto (quando refatorar)
- Saída mantém compatibilidade e as validações continuam garantindo coerência com `categorias.json`

## Feature: URLs de imagens válidas (integração com servidor local)

### Objetivo
Garantir que `produto.image` (e futuramente `categoria.image`) aponte para uma URL realmente servida pelo ambiente local (ex.: `http://localhost:4000/...` ou rota de assets do frontend).

### Problema atual
- O seed pode gerar paths que não são servidos por `localhost:4000` em `/assets/...` diretamente.
- Dependendo do servidor em uso, o path válido muda (API do MOCK-END vs rota de assets do frontend).
- No modo rápido atual (sem tenant), foi adotado `http://localhost:4000/assets/images/...` (rota pública de static) apenas para destravar o uso do `data/*.json`. Esta decisão deve ser revertida/normalizada na refatoração.

### Opções de URL (padrões existentes no repo)

**Opção A (recomendada): assets por tenant (via rota de assets do frontend)**
- Formato: `/assets/<tenant>/images/<subpasta>/<arquivo>`
- Exemplo: `/assets/adega-lopes/images/produtos/heineken.jpg`
- Pasta física (copiar assets):
  - `WWW/MICROSERVICE/MOCK-END/<tenant>/THEMA/assets/images/<subpasta>/...`
  - alternativa: `WWW/MICROSERVICE/MOCK-END/<tenant>/COMMERCE/assets/images/<subpasta>/...`

**Opção B: assets via API do MOCK-END (porta 4000)**
- Formato: `/api/storage/<tenant>/images/<subpasta>/<arquivo>`
- Exemplo: `/api/storage/adega-lopes/images/produtos/heineken.jpg`
- Pasta física (copiar assets):
  - `WWW/MICROSERVICE/MOCK-END/<tenant>/COMMERCE/assets/images/<subpasta>/...`

**Opção C (modo rápido, sem tenant): static público no MOCK-END**
- Formato: `http://localhost:4000/assets/images/<subpasta>/<arquivo>`
- Pasta física (copiar assets):
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/assets/images/<subpasta>/...`

### O que refatorar depois (proposta)
- Tornar configurável via `config.json`:
  - `assets.baseUrl` (ex.: `/assets/adega-lopes/images` ou `/api/storage/adega-lopes/images`)
  - `assets.productsSubdir` (default: `produtos`)
  - `assets.categoriesSubdir` (default: `categorias`)
- Criar rotina de normalização pós-geração:
  - `rewriteAssetUrls(products, categories, assetsConfig)`

### Critérios de pronto (quando refatorar)
- JSON gerado abre as imagens no browser com a URL escolhida (sem 404)
- Não quebra consumidores atuais (migração documentada)

## Feature: Brands (brands.json + brandId/brandName/brandImage)

### Objetivo
Adicionar em cada produto:
- `brandId`
- `brandName`
- `brandImage`

E criar um catálogo de marcas em `data/brands.json` para evitar duplicação e facilitar consumo.

### Formato (brands.json)
- Cada item: `{id,name,slug,image}`

### Regras
- `brandId` determinístico por hash do nome (mesmo nome → mesmo id)
- `brandName` deve ser o nome exibível
- `brandImage` inicialmente usa placeholder (ex.: `/assets/images/semImagem.png`)
- `produto.brandId/brandName/brandImage` devem existir e referenciar `brands.json`

### O que refatorar depois (proposta)
- Padronizar via `config.json`:
  - `products.enrich.brand: boolean`
  - `assets.brandsBaseUrl` (quando for colocar imagens reais)
- Separar a etapa:
  - `buildBrands(products)` e `enrichProductsWithBrandInfo(products, brands)`

## Feature: Simplificação de produtos (brand/category aninhados)

### Objetivo
Simplificar o JSON de produtos removendo chaves duplicadas e agrupando em objetos:
- `brand: {id,name,slug,image}`
- `category: {id,name,slug,familia}`

### Regras
- Remover chaves antigas do produto:
  - `brandId`, `brandName`, `brandImage`, `brand` (string)
  - `categoryId`, `categoryName`, `categoryFamilia`
- `category.familia` deve continuar sendo array de `{id,name,slug}` (raiz→...→leaf)
- `image` do produto permanece URL completa (modo rápido): `http://localhost:4000/assets/...`

### Critérios de pronto (quando refatorar)
- Consumidores leem `produto.brand.*` e `produto.category.*` sem precisar de lookup
- Validações garantem coerência com `brands.json` e `categorias.json`

## Feature: colections.json (home)

### Objetivo
Gerar `data/colections.json` com dados para a home (banners e carrosséis), de forma determinística.

### Conteúdo
- `home.banners_1`: itens `{id,image,link}` baseados nos arquivos em `MOCK-END/PROJETOS/connect/handlers/mock/assets/images/banners`
- `home.categorias_destaque`: 8 categorias aleatórias (filho ou neto), objeto completo vindo de `data/categorias.json`
- `home.produtos_maisvendidos`: `{ slug: "mais-vendidos", data: [12 produtos] }`
- `home.produtos_promocao`: `{ slug: "promocao", data: [20 produtos] }`

### Estado atual
- Script dedicado: `src/generate-colections.mjs` (não sobrescreve `categorias.json`/`produtos.json`)

### O que refatorar depois (proposta)
- Tornar configurável via `config.json`:
  - quantidades (8/12/20)
  - slugs
  - fonte de banners e `assetsBaseUrl`

## Feature: Ajustes manuais de JSON (sem regenerar)

### Contexto
- Houve alterações manuais extensas nos JSONs de catálogo.
- Decisão operacional: **não regenerar** os JSONs para evitar perda dessas alterações.

### O que foi feito no modo rápido
- Atualização manual de placeholders antigos:
  - de `http://localhost:4000/assets/products/placeholder.webp`
  - para `http://localhost:4000/assets/images/semImagem.png`
- Aplicado diretamente nos arquivos JSON de catálogo/home usados pelo mock.

- Padronização de slug amigável removendo redundância:
  - `path` removido
  - `slug` passou a carregar o caminho amigável (ex.: `/produtos/<slug>`, `/categoria/<slug>`, `/marca/<slug>`)
  - Aplicado diretamente nos arquivos JSON de catálogo/home usados pelo mock.

### Diretriz
- Evitar adicionar camadas de compatibilidade em runtime para esse caso (considerado legado).
- Corrigir na fonte de dados (JSON) e manter retorno limpo.

### Refatoração futura
- Consolidar a regra no pipeline de geração, com comando de normalização explícito e idempotente.
- Garantir que nenhum artefato publicado use `/assets/products/placeholder.webp`.
