# Microservices de Imagens (Scraping + IA) + SSE — Spec

## Why
O catálogo do MOCK-END possui imagens placeholder e paths incompletos. Para a fábrica de ecommerce, precisamos:
- automatizar **coleta** de imagens reais para produtos e categorias
- automatizar **criação** de assets (banners/criativos) por IA baseados em categorias/branding (não para produtos)
- reduzir flicker e custo de polling no DevDash com **SSE**

Scraping é instável por natureza (bloqueios, captchas, rate limit). O design tem que prever múltiplas estratégias, amostragem inicial (10%), fail-fast e rastreabilidade.

## Entregáveis deste spec (por assunto)
### 1) Microservice: `image-scraper`
Responsável por:
- consumir catálogo do MOCK-END (produtos/categorias) via HTTP
- coletar imagens na internet (2+ estratégias)
- persistir assets e atualizar JSON do tenant via HTTP (CRUD JSON do MOCK-END)

### 2) Microservice: `ia-image-generator`
Responsável por:
- gerar banners/criativos por IA usando categorias + contexto/branding do tenant
- produzir e salvar um manifesto de prompts (mesmo sem chave)
- persistir assets gerados e registrar no JSON alvo do tenant (definido no contrato)

### 3) Microservice: `sse-hub`
Responsável por:
- publicar eventos de estado/processo para reduzir polling no DevDash
- manter fallback para polling quando SSE falhar

### 4) MOCK-END: CRUD controlado de JSON (suporte)
Responsável por:
- permitir que microservices atualizem JSON do tenant de forma segura (sem editar disco manualmente)

## Impact (arquivos/projetos)
- `WWW/MICROSERVICE/image-scraper/**`
- `WWW/MICROSERVICE/ia-image-generator/**`
- `WWW/MICROSERVICE/sse-hub/**`
- `WWW/MICROSERVICE/MOCK-END/server.mjs` (CRUD JSON por tenant)
- `WWW/MICROSERVICE/MOCK-END/*/CATALOGO/produtos.json` (update de `image`)
- `WWW/MICROSERVICE/MOCK-END/*/CATALOGO/categorias.json` (update de `image`)
- possivelmente `WWW/MICROSERVICE/MOCK-END/*/THEMA/**` (assets e/ou manifesto)

## Contexto do dado (observado no repo)
- Produtos: `image` hoje aponta para placeholder. Ex.: [produtos.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/adega-lopes/CATALOGO/produtos.json#L1-L20)
- Categorias: `image` aponta para `/assets/categories/<slug>.webp`. Ex.: [categorias.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/adega-lopes/CATALOGO/categorias.json#L1-L25)
- MOCK-END não serve assets estáticos hoje. Ex.: [server.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/server.mjs#L98-L171)

## Arquitetura (microservices)
### Microservices existentes
- `MOCK-END` (porta 4000): catálogo/tenant (JSON) e leitura do catálogo
- `devdash` (porta 3003): painel de operação

### Novos microservices (deste spec)
- `image-scraper`
- `ia-image-generator`
- `sse-hub`

### Comunicação entre microservices (regras)
- `image-scraper` e `ia-image-generator` SHALL ler catálogo via:
  - `GET http://localhost:4000/api/<tenant>/catalogo/produtos`
  - `GET http://localhost:4000/api/<tenant>/catalogo/categorias`
- `image-scraper` e `ia-image-generator` SHALL atualizar JSON via CRUD do MOCK-END, não por edição direta do disco do MOCK-END.
- Quando houver erro de comunicação/bloqueio, o microservice SHALL registrar erro e seguir guardrails (fail-fast, cooldown, amostragem).

## Contratos Fechados (Arquivos e Nomenclatura)
### Contrato de Storage e Path/URL no JSON (`image`)
O MOCK-END e o ecommerce precisam de caminhos previsíveis, limpos e otimizados para SEO. 
- **Storage Físico (Local)**: As imagens coletadas e geradas serão salvas dentro do diretório do tenant no MOCK-END, especificamente na pasta permitida `THEMA/assets/images/produtos/` e `THEMA/assets/images/categorias/`.
- **Nomenclatura de Arquivo (O Desafio)**: Para garantir que o nome do arquivo faça sentido para a imagem (SEO) e não se repita (evitar colisão e permitir dedupe):
  - O nome do arquivo será um **slug do nome do produto/categoria** concatenado com um **short hash** (ex: primeiros 6 caracteres do MD5 da URL de origem ou do buffer da imagem).
  - Exemplo: `vinho-tinto-cabernet-sauvignon-a1b2c3.webp`.
- **Path no JSON**: O campo `image` armazenará o **path relativo estável** com tenant, como `/assets/<tenant>/images/produtos/vinho-tinto-cabernet-sauvignon-a1b2c3.webp`. O front-end (ecommerce) serve esses assets no próprio host (ou CDN) sem colisão entre tenants.
- **Fallback (URL Externa)**: Caso o download ou persistência local se torne um desafio técnico intransponível para uma fonte específica, o scraper poderá, como último recurso, salvar a **URL externa original** diretamente no campo `image`.

### Contrato de Metadados de Rastreio
Para não sujar excessivamente o `produtos.json` e `categorias.json`:
- Os metadados de rastreabilidade (origem, método usado A/B/C, timestamp, hash original) não ficarão no próprio objeto do produto.
- Serão salvos em um arquivo auxiliar de controle por tenant: `CATALOGO/image-meta.json` (usando o ID do produto/categoria como chave).

## Pesquisa (métodos e riscos)
### Estratégia A (background / HTTP)
Objetivo: obter imagens sem abrir browser.
- fontes “API-first” quando existir (exige chave/custo)
- fallback para fontes públicas com licença clara quando aplicável
- dedupe por hash e validação de MIME/dimensões

### Estratégia B (simulação humana / Playwright)
Objetivo: fallback quando HTTP falhar por JS/bloqueios.
- navegação headless com rate limit e backoff
- download pelo próprio browser context

### Estratégia C (metadados OpenGraph/JSON-LD)
Objetivo: reduzir chance de imagem errada consultando páginas oficiais.
- extrair `og:image`, `twitter:image`, JSON-LD `image`

### IA (banners/criativos — não produto)
Objetivo: gerar assets coerentes com categoria/branding.
- manifesto de prompts sempre (mesmo sem chave)
- geração real só quando credencial estiver disponível via env (sem commitar)

## ADDED Requirements
### Requirement: CRUD de JSON no MOCK-END (por tenant)
O MOCK-END SHALL expor endpoints para ler/escrever/listar/remover arquivos JSON do tenant, com validação e proteção contra path traversal.

Regras mínimas:
- Só permitir paths dentro do diretório do tenant e apenas em pastas allowlist (ex.: `CATALOGO/`, `THEMA/`, `COPY/`, `CONTEXTO/`, `BUILDER/`, `BLUEPRINT/`)
- Só permitir arquivos `.json`
- `PUT` cria/atualiza e grava JSON “pretty” (indent + newline)

#### Scenario: Atualizar produtos.json via HTTP
- **WHEN** o microservice precisar atualizar `CATALOGO/produtos.json`
- **THEN** ele envia `PUT /api/<tenant>/json?path=CATALOGO/produtos.json` com body JSON válido

### Requirement: Microservice `image-scraper`
O sistema SHALL fornecer um microservice dedicado (`image-scraper`) que executa scraping e integra com o MOCK-END via HTTP.

Regras mínimas:
- roda como processo independente (porta própria)
- oferece execução por CLI e/ou endpoint HTTP
- registra relatório por execução (itens processados, erros e arquivos gerados)

#### Scenario: Rodar em modo seguro (10%)
- **WHEN** o operador dispara uma execução
- **THEN** o microservice processa ~10% do catálogo e publica um relatório ao final

### Requirement: Microservice `ia-image-generator`
O sistema SHALL fornecer um microservice dedicado (`ia-image-generator`) para gerar assets por IA (banners/criativos), sem gerar imagens para produtos.

Regras mínimas:
- roda como processo independente (porta própria)
- gera manifesto de prompts sempre
- só gera imagens se credencial estiver disponível via env

#### Scenario: Manifesto sem chave
- **WHEN** não existir credencial configurada
- **THEN** o microservice gera apenas o manifesto de prompts e não falha a execução

### Requirement: Microservice SSE Hub (`sse-hub`)
O sistema SHALL fornecer um microservice dedicado (`sse-hub`) para emitir eventos SSE e reduzir polling no DevDash.

Regras mínimas:
- roda como processo independente (porta própria)
- emite eventos com heartbeat e suporta reconexão
- DevDash consome SSE via store; UI só renderiza
- fallback para polling continua existindo

#### Scenario: Estado estável sem flicker
- **WHEN** o serviço alternar estados (STARTING → UP, UP → DOWN)
- **THEN** a UI atualiza com transições previsíveis e sem “piscar” por revalidação agressiva

### Requirement: Pipeline de scraping com múltiplas estratégias
O sistema SHALL suportar no mínimo **2 estratégias** de coleta (A: background HTTP; B: Playwright) e fallback automático.

#### Scenario: Falha por bloqueio
- **WHEN** a estratégia A falhar (403/429/captcha/página vazia)
- **THEN** a estratégia B é tentada com backoff e limite de tentativas

### Requirement: Amostragem inicial (10%)
O sistema SHALL suportar execução parcial, processando apenas uma fração do catálogo por execução (default: **10%**).

### Requirement: Fail-fast (não insistir em buscas com erro)
O sistema SHALL aplicar regras de “não insistir”:
- limite de tentativas por item (ex.: 3 tentativas totais combinando A/B/C)
- cooldown/backoff por domínio quando ocorrer 403/429/captcha
- registrar erro e seguir para o próximo item

### Requirement: Atualização dos JSONs do MOCK-END
O sistema SHALL atualizar somente:
- `produtos.json`: campo `image` do produto
- `categorias.json`: campo `image` da categoria
Mantendo o restante do schema intacto.

### Requirement: Placeholder quando não houver imagem
O sistema SHALL gerar e aplicar um placeholder quando não houver imagem válida disponível, para evitar itens sem imagem.

### Requirement: Persistência e rastreabilidade
O sistema SHALL registrar metadados mínimos por imagem:
- origem (URL)
- método usado (A/B/C)
- timestamp
- checksum/hash (para dedupe)

## MODIFIED Requirements
Nenhum.

## REMOVED Requirements
Nenhum.
