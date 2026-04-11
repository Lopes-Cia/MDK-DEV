# Plano: POC “MOCK-END primeiro” (REST + Seeds + Builder) e depois Front

## Resumo
Executar a POC seguindo a ordem definida no desenho [ecommerce-frontend.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/ecommerce-frontend.md): **concluir todo o `MOCK-END` primeiro** (CATALOGO + THEMA + CONTEXTO + COPY + BLUEPRINT + BUILDER + REST API do catálogo) e só então iniciar o frontend em `WWW/n1`.

Este plano foca em:
- transformar `WWW/MICROSERVICE/MOCK-END/` em um microserviço Node (separado do Next) para servir **CATALOGO** via REST
- criar os artefatos faltantes por tenant (CONTEXTO/COPY/BLUEPRINT/BUILDER)
- extrair o XLSX `IA/DESENHOS/mapa_paginas_ecommerce.xlsx` para IA-first e usar isso para simplificar o blueprint + copy

## Estado atual (checado no repo)
- `WWW/MICROSERVICE/MOCK-END/` existe com:
  - `adega-lopes/CATALOGO/{categorias.json,produtos.json}`
  - `mercearia-lopes/CATALOGO/{categorias.json,produtos.json}`
  - `adega-lopes/THEMA/{theme.json,tokens.css}`
  - `mercearia-lopes/THEMA/{theme.json,tokens.css}`
  - scripts existentes:
    - `scripts/generate-catalogs.mjs`
    - `scripts/verify-themes.mjs`
- Ainda não existe no `MOCK-END`:
  - `CONTEXTO/`, `COPY/`, `BLUEPRINT/`, `BUILDER/`
  - REST API rodando (servidor Node) e documentação de como subir
- Existe um Next.js inicial em `WWW/n1/`, mas a POC exige “MOCK-END primeiro”.
- Fonte do mapa de páginas: `IA/DESENHOS/mapa_paginas_ecommerce.xlsx` (ainda não extraído para IA-first).

## Decisões (confirmadas)
- REST API do MOCK-END será um microserviço Node separado (não dentro do Next).
- Para extrair XLSX para IA-first, está aprovado adicionar **1 dependência npm** no `MOCK-END`: pacote `xlsx`.
- REST API do `MOCK-END` serve **apenas CATALOGO**.
- THEMA/CONTEXTO/BLUEPRINT/COPY são por tenant e alimentam a geração do BUILDER (não são expostos por API nesta fase).
- POC local-only (sem produção), multi-tenant via `lvh.me`.
- Páginas “oficiais” da POC: Home, Categoria, Produto e Carrinho; demais páginas sem links por enquanto.

## Proposta de arquitetura do MOCK-END (microserviço)
### Estrutura
- `WWW/MICROSERVICE/MOCK-END/package.json` (scripts do serviço + deps)
- `WWW/MICROSERVICE/MOCK-END/server.mjs` (Node HTTP server, sem framework)
- `WWW/MICROSERVICE/MOCK-END/lib/` (helpers: roteamento, leitura de JSON, validações)
- `WWW/MICROSERVICE/MOCK-END/scripts/` (geradores/validadores)

### Contrato da API (CATALOGO)
- Base URL local: `http://localhost:<porta>`
- Endpoints:
  - `GET /api/:tenant/catalogo/categorias`
  - `GET /api/:tenant/catalogo/produtos`
  - `GET /api/:tenant/catalogo/categorias/:slug`
  - `GET /api/:tenant/catalogo/produtos/:slug`
- Respostas:
  - listas retornam **array JSON**
  - detalhe retorna **objeto JSON**
- Erros mínimos:
  - `404` tenant inexistente
  - `404` slug inexistente
  - `500` falha de leitura/parse do seed
- Headers:
  - `Cache-Control: no-store` (POC local)
  - `Content-Type: application/json; charset=utf-8`
  - CORS: permitir `http://*.lvh.me:3000` e `http://localhost:3000` em dev

## Definições que serão adicionadas (schemas mínimos)
### 1) `CONTEXTO/contexto.json` (por tenant)
Objetivo: “brief” do tenant para orientar builder e microcopy.
- Campos mínimos:
  - `tenantId`, `tenantName`, `segment` (adega/mercearia)
  - `vibe` (ex.: jovem/requintado)
  - `delivery` (apenas UI mock) e `priorities` (home/categoria/produto/carrinho)

### 2) `COPY/copy.json` (por tenant)
Objetivo: textos por página e por componente, sem hardcode.
- Campos mínimos:
  - `pages.home`, `pages.category`, `pages.product`, `pages.cart`
  - `components.*` (ex.: `addToCart`, `cepMock`, `search`, `filters`)

### 3) `BLUEPRINT/*` (por tenant)
Objetivo: mapa “oficial” de páginas + slots + lista de bricks permitidos (POC).
- IA-first (extração fiel):
  - `BLUEPRINT/mapa_paginas_ecommerce.ia.json`
- Síntese:
  - `BLUEPRINT/blueprint-paginas-ecommerce.md`

### 4) `BUILDER/*` (por tenant) (gerado)
Objetivo: seed/presets/dados iniciais para o Puck (build-time generator).
- Saída mínima proposta:
  - `BUILDER/pages.json` (layouts default por `urlPath`)
  - `BUILDER/enabledBlocks.json` (lista de bricks habilitados por tenant)
  - `BUILDER/presets.json` (presets por página/slot, com base em CONTEXTO/COPY/BLUEPRINT)

## Mudanças propostas (passo a passo)
### Passo 1 — Preparar o `MOCK-END` como microserviço Node
- Criar `package.json` no `MOCK-END` com scripts:
  - `dev` (rodar server)
  - `verify` (rodar scripts de validação existentes + novos)
- Adicionar dependência `xlsx` (aprovada) para extração do XLSX.

### Passo 2 — Implementar REST API do catálogo (CATALOGO)
- Criar `server.mjs` usando `node:http`:
  - roteamento simples por path/método
  - leitura dos seeds do filesystem sob `MOCK-END/<tenant>/CATALOGO/`
  - validação de tenant permitido (adega-lopes, mercearia-lopes)
  - `:slug` busca por `slug` dentro do array
- Implementar CORS apenas para dev (origens locais).

### Passo 3 — Criar scaffolding dos artefatos por tenant (não-API)
- Criar diretórios e arquivos iniciais (por tenant):
  - `CONTEXTO/contexto.json`
  - `COPY/copy.json`
  - `BLUEPRINT/` (placeholders)
  - `BUILDER/` (gerado, mas criar estrutura para versionar)

### Passo 4 — Extrair `mapa_paginas_ecommerce.xlsx` para IA-first (por tenant)
- Criar script `scripts/extract-xlsx-to-ia-first.mjs`:
  - ler abas, cabeçalhos e linhas
  - gerar `BLUEPRINT/mapa_paginas_ecommerce.ia.json` por tenant
  - manter extração “fiel” (sem simplificar), para permitir auditoria/diff

### Passo 5 — Gerar síntese do blueprint + seed de copy (por tenant)
- Criar script `scripts/generate-blueprint-and-copy.mjs`:
  - entrada: `mapa_paginas_ecommerce.ia.json` + regras da POC
  - saída:
    - `BLUEPRINT/blueprint-paginas-ecommerce.md` (somente Home/Categoria/Produto/Carrinho)
    - `COPY/copy.json` com textos mínimos por tenant
  - Garantir: “outras páginas sem links” fica explícito na síntese.

### Passo 6 — Implementar Builder generator (build-time)
- Criar script `scripts/generate-builder.mjs`:
  - entrada: `THEMA/` + `CONTEXTO/` + `BLUEPRINT/` + `COPY/`
  - saída: `BUILDER/pages.json`, `BUILDER/enabledBlocks.json`, `BUILDER/presets.json`
  - objetivo: o frontend (Puck) consegue carregar seed default do tenant antes de qualquer edição.

### Passo 7 — Validação automatizada do MOCK-END
- Estender `scripts/verify-themes.mjs` (ou criar `scripts/verify-mockend.mjs`) para checar:
  - parse JSON de todos artefatos
  - consistência entre `selected` e `tokens.css` (já existe)
  - rotas do blueprint: apenas Home/Categoria/Produto/Carrinho
  - copy mínimo presente
  - builder outputs presentes e coerentes

### Passo 8 — Só depois: iniciar implementação do frontend
- Criar os bricks no `core`, o dashboard do builder e o atalho dev no header (conforme desenho).
- Integrar React Query consumindo o REST API do MOCK-END (CATALOGO).
- Integrar Zustand para carrinho/UI state.

## Riscos / pontos de atenção
- XLSX: estrutura pode ter múltiplas abas/cabeçalhos diferentes; o script de extração deve preservar tudo (IA-first) antes de simplificar.
- Persistência do Puck: para a POC, a persistência inicial será em arquivos JSON no `MOCK-END/<tenant>/BUILDER/` (sem banco).
- CORS: restringir a origens locais para não “vazar” comportamento de dev para produção.

## Como verificar (quando executar)
- Mock-end API:
  - subir `MOCK-END` e acessar os endpoints com `curl`/browser
  - confirmar 404/500 conforme especificado
- Scripts:
  - rodar `npm run verify` no `MOCK-END`
- Estrutura:
  - conferir que existem `CONTEXTO/`, `COPY/`, `BLUEPRINT/`, `BUILDER/` em ambos tenants

## Artefatos gerados/alterados (principais)
- `WWW/MICROSERVICE/MOCK-END/package.json`
- `WWW/MICROSERVICE/MOCK-END/server.mjs`
- `WWW/MICROSERVICE/MOCK-END/scripts/extract-xlsx-to-ia-first.mjs`
- `WWW/MICROSERVICE/MOCK-END/scripts/generate-blueprint-and-copy.mjs`
- `WWW/MICROSERVICE/MOCK-END/scripts/generate-builder.mjs`
- `WWW/MICROSERVICE/MOCK-END/<tenant>/{CONTEXTO,COPY,BLUEPRINT,BUILDER}/*`
