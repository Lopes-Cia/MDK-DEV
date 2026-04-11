# Scraper de Imagens + Geração de Criativos (MOCK-END) — Spec

## Why
Os catálogos do MOCK-END possuem imagens placeholder (ex.: `/assets/products/placeholder.webp`) e precisamos automatizar a obtenção de imagens reais para produtos e categorias, além de gerar **assets criativos** (banners) por IA para uso na “fábrica de ecommerce”.

Scraping é inerentemente instável (bloqueios, captchas, rate limit), então o design precisa prever **múltiplas estratégias**, cache/retentativa e rastreabilidade.

## What Changes
- Criar um recurso de scraping (scripts) para:
  - coletar imagens na internet para produtos e categorias existentes no MOCK-END
  - baixar as imagens (download) ou salvar URL de origem (conforme modo)
  - atualizar os mesmos JSONs de catálogo (`produtos.json` / `categorias.json`) com os novos caminhos/URLs
- Implementar um pipeline de **2 ou mais abordagens** para coleta:
  - abordagem A: “background” (HTTP fetch + parsing + fontes com API quando disponível)
  - abordagem B: “simulação humana” (browser automation com Playwright)
  - opcional: abordagem C: extração de imagens via metadados (OpenGraph/JSON-LD) em páginas oficiais
- Adicionar pesquisa e plano de **geração de imagens por IA** para **assets** (banners/criativos), não para produto:
  - usar dados de categorias + contexto/branding do tenant (quando disponível) para gerar prompts
  - gerar imagens e salvar em diretório de assets do tenant, atualizando o JSON de tema/estrutura (definido na implementação)
- Salvar pesquisa (fontes, termos, trade-offs) em `IA/` durante a implementação (reaproveitável em outros frontends).

## Impact
- Affected specs: pipeline de dados do MOCK-END (catálogo) e base de assets para ecommerce.
- Affected code (quando implementar):
  - `WWW/MICROSERVICE/MOCK-END/scripts/**` (novos scripts de scraping/geração)
  - `WWW/MICROSERVICE/MOCK-END/*/CATALOGO/produtos.json` (update de `image`)
  - `WWW/MICROSERVICE/MOCK-END/*/CATALOGO/categorias.json` (update de `image`)
  - possivelmente `WWW/MICROSERVICE/MOCK-END/*/THEMA/**` (assets de banners/criativos)

## Contexto do dado (observado no repo)
- Produtos exemplo: `image` hoje aponta para placeholder. Ex.: [produtos.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/adega-lopes/CATALOGO/produtos.json#L1-L20)
- Categorias exemplo: `image` aponta para `/assets/categories/<slug>.webp`. Ex.: [categorias.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/adega-lopes/CATALOGO/categorias.json#L1-L25)
- MOCK-END hoje expõe somente API JSON e não serve assets estáticos. Ex.: [server.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/server.mjs#L98-L171)
  - Portanto, o pipeline deve **persistir arquivos no disco** e atualizar JSON com um path/URL que o builder/ecommerce consumirá (definir no design).

## Pesquisa (rascunho — métodos e riscos)
### Estratégia A (background / HTTP)
**Objetivo**: obter imagens sem abrir browser, reduzindo custo e complexidade.
- Fontes possíveis (preferência por “API-first”):
  - provedores de busca de imagens com API e chave (ex.: Bing Image Search / Google CSE / SerpAPI)
  - fontes públicas com licença clara (ex.: Wikimedia Commons) quando aplicável
- Técnica:
  - montar query com `brand + name + sizeLabel + unitLabel`
  - baixar imagem principal do resultado e validar MIME/dimensões
  - deduplicar por hash (evitar duplicar a mesma imagem em vários produtos)
- Risco:
  - APIs podem exigir custo/chave; fontes podem mudar; resultados podem ser irrelevantes sem boa query.

### Estratégia B (simulação humana / Playwright)
**Objetivo**: fallback quando o background falhar por bloqueios/JS.
- Técnica:
  - abrir navegador headless, simular navegação/scroll, capturar URL do “best image result”
  - baixar a imagem via request do próprio browser context (menos chance de bloqueio)
- Risco:
  - maior custo, mais lento, mais suscetível a captcha/anti-bot; precisa rate limiting.

### Estratégia C (opcional — extração de metadados)
**Objetivo**: reduzir chance de imagem errada consultando páginas oficiais.
- Técnica:
  - buscar página do produto (primeiro resultado) e extrair `og:image` / `twitter:image` / JSON-LD `image`
- Risco:
  - páginas variam; pode retornar imagem de “marca”/banner em vez do produto.

### IA (banners/criativos — não produto)
**Objetivo**: gerar assets (ex.: banners de categoria, hero) coerentes com categoria/branding.
- Técnica:
  - gerar prompts por categoria com variações (1:1, 4:3, 16:9)
  - salvar em diretório do tenant (ex.: `THEMA/assets/banners/`)
  - registrar no JSON de tema/estrutura (definir)
- Pré-requisito:
  - chave/credencial (ex.: `GEMINI_API_KEY`) via env, sem commitar segredo
- Risco:
  - consistência visual; necessidade de curadoria; evitar texto embutido na imagem.

## ADDED Requirements
### Requirement: Pipeline de Scraping com múltiplas estratégias
O sistema SHALL suportar no mínimo **2 estratégias** de coleta de imagens (background e browser automation) e selecionar automaticamente fallback quando uma falhar.

#### Scenario: Falha por bloqueio
- **WHEN** a estratégia A falhar (403/429/captcha/página vazia)
- **THEN** a estratégia B é tentada com backoff e limite de tentativas

### Requirement: Atualização dos JSONs do MOCK-END
O sistema SHALL atualizar:
- `produtos.json`: campo `image` do produto
- `categorias.json`: campo `image` da categoria
Mantendo o restante do schema intacto.

#### Scenario: Atualizar imagem de produto
- **WHEN** uma imagem válida for encontrada/baixada
- **THEN** o item do produto recebe o novo path/URL em `image`

### Requirement: Persistência e rastreabilidade
O sistema SHALL registrar metadados mínimos por imagem:
- origem (URL)
- método usado (A/B/C)
- timestamp
- checksum/hash (para dedupe)

#### Scenario: Dedupe
- **WHEN** duas buscas retornarem a mesma imagem
- **THEN** o pipeline reutiliza o mesmo arquivo e evita duplicação

### Requirement: Geração de assets por IA (banners/criativos)
O sistema SHALL gerar assets por IA a partir de dados de categorias e contexto/branding do tenant, e salvar os resultados para consumo no ecommerce.

#### Scenario: Criar banner por categoria
- **WHEN** um tenant for processado
- **THEN** o pipeline gera pelo menos 1 banner por categoria principal e registra o path no JSON alvo

## MODIFIED Requirements
Nenhum.

## REMOVED Requirements
Nenhum.

