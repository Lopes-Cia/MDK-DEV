# Plano: Recriar o Frontend `WWW/n1` (Multi-tenant + Puck + Consumo do MOCK-END)

## Resumo
Recriar do zero o app Next.js em `WWW/n1` (você pediu para **não editar** o existente: “remove a pasta e gera novamente”) para validar o desenho [ecommerce-frontend.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/ecommerce-frontend.md) com:
- Multi-tenant local via `lvh.me` (host → rewrite para `/{tenant}`)
- Páginas da POC: **Home, Categoria, Produto, Carrinho** (sem links para o resto)
- Builder de bricks com **Puck**, editado via **dashboard** em `/{tenant}/dashboard/builder` (não no front público)
- Atalho “modo dev” no header do front público (ao lado de Login/Cadastro placeholder) para abrir o builder (somente em `development`)
- Consumo do `MOCK-END`:
  - **CATALOGO** via REST (React Query)
  - **THEMA/CONTEXTO/COPY/BLUEPRINT/BUILDER** via leitura de arquivos (não expor como API)
- Carrinho/UI state em **Zustand**

## Estado atual (checado no repo)
- Existe `WWW/MICROSERVICE/MOCK-END/` com:
  - Tenants: `adega-lopes` e `mercearia-lopes`
  - Seeds e artefatos por tenant:
    - `CATALOGO/{categorias.json,produtos.json}`
    - `THEMA/{theme.json,tokens.css}`
    - `CONTEXTO/contexto.json`, `COPY/copy.json`
    - `BLUEPRINT/*` e `BUILDER/*`
  - Servidor REST do catálogo em `server.mjs`
- Existe `WWW/n1/`, mas é um template inicial e **será descartado** conforme sua instrução.
- O desenho [ecommerce-frontend.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/ecommerce-frontend.md) ainda contém trechos “Próximo passo (a fazer)” relativos ao `MOCK-END` que já foram concluídos na prática.

## Decisões e restrições (fechadas)
- Multi-tenant: **somente local** por enquanto (subdomínios via `lvh.me`), sem produção real agora.
- Editor (Puck) fica no dashboard do tenant, não no front público.
- O `MOCK-END` continua sendo o “source of truth” por tenant:
  - API serve **apenas** `CATALOGO`
  - THEMA/CONTEXTO/BLUEPRINT/COPY/BUILDER **não** são consumidos como API
- Persistência do Puck (POC): editar e salvar diretamente em `MOCK-END/<tenant>/BUILDER/pages.json` (trade-off: re-gerar o builder sobrescreve; aceitável para POC e alinhado com “recriar do zero” quando necessário).

## Mudanças propostas (3–8 passos) + validação

### Passo 1 — Recriar o projeto Next.js em `WWW/n1`
**O que fazer**
- Apagar `WWW/n1/` e recriar o app (App Router + TypeScript + `src/` + Tailwind).
- Manter o padrão de Tailwind v4 (similar ao template atual e ao `connect-ecommerce-develop` em `WWW/REFERENCIAS/`).

**Validação**
- `npm run dev` sobe sem erros e abre a página padrão.

### Passo 2 — Instalar e configurar as dependências base da POC
**O que adicionar (dependências)**
- UI/base: `shadcn/ui` (gerar componentes conforme necessidade)
- Builder: `@puckeditor/core`
- Estado: `zustand`
- Fetch/cache: `@tanstack/react-query`
- Validação (quando aplicável): `zod`

**Validação**
- Build (`npm run build`) e lint (`npm run lint`) passam.
- CSS do Puck carrega no dashboard do builder.

### Passo 3 — Implementar multi-tenant local (lvh.me) e fallback por path
**O que implementar**
- `middleware.ts` para:
  - Se `host` for `*.lvh.me`, reescrever internamente para `/<tenant><pathname>`
  - Se já estiver em `/<tenant>/...`, não reescrever
  - Se tenant for inválido, deixar o app responder 404 via `notFound()`
- Helpers de resolução:
  - `getTenantFromHost(host)`
  - `isValidTenant(tenant)` consultando o `MOCK-END` (lista por presença de `CATALOGO/`)

**Validação**
- `http://adega-lopes.lvh.me:3000/` resolve para o tenant `adega-lopes`
- `http://mercearia-lopes.lvh.me:3000/` resolve para o tenant `mercearia-lopes`
- `http://tenant-inexistente.lvh.me:3000/` retorna 404 (sem crash)

### Passo 4 — Conectar THEMA/CONTEXTO/COPY/BUILDER do `MOCK-END` ao Next (sem API)
**O que implementar**
- Resolver `MOCK_END_ROOT` de forma robusta (rodando a partir de `WWW/n1`).
- Leitura server-side (Node) por tenant:
  - `THEMA/tokens.css` para injetar `<style>` no layout do tenant (tokens por tenant)
  - `CONTEXTO/contexto.json` e `COPY/copy.json` para alimentar header/CTA/microcopy
  - `BUILDER/pages.json` para renderizar a Home via `Render` do Puck

**Validação**
- Cada tenant carrega tokens/microcopy diferentes (mudança visível além de cor quando houver presets no BUILDER).

### Passo 5 — Implementar páginas da POC (render + dados) e estado do carrinho
**Rotas**
- `/{tenant}/` (Home) renderizada pelo Puck (layout do `BUILDER/pages.json` para `/`)
- `/{tenant}/categoria/[slug]` (Categoria) com listagem filtrada
- `/{tenant}/produto/[slug]` (Produto) com detalhes + CTA adicionar ao carrinho
- `/{tenant}/carrinho` (Carrinho) com lista, quantidade e subtotal (POC)

**Dados**
- Consumir `MOCK-END` REST (`server.mjs`) via React Query:
  - `GET /api/:tenant/catalogo/categorias`
  - `GET /api/:tenant/catalogo/produtos`
  - `GET /api/:tenant/catalogo/produtos/:slug`

**Estado**
- Store Zustand para carrinho (add/remove/updateQty/clear) + persistência opcional em `localStorage`.

**Validação**
- Fluxo completo no browser:
  - Home → Categoria → Produto → Adicionar → Carrinho
  - Refresh mantém o carrinho (se persistência estiver habilitada)

### Passo 6 — Implementar dashboard do builder (Puck) + persistência no `MOCK-END`
**Rotas**
- `/{tenant}/dashboard`
- `/{tenant}/dashboard/builder`
- `/{tenant}/dashboard/builder/edit?path=/` (ou `.../edit/[...path]` se preferir rotas limpas)

**Editor**
- Carregar `data` do Puck a partir de `MOCK-END/<tenant>/BUILDER/pages.json` (por `urlPath`)
- `onPublish` salva de volta no arquivo (server action ou route handler)

**Validação**
- Editar a Home no builder e publicar altera imediatamente o render em `/{tenant}/`.

### Passo 7 — Atalho de modo dev no header do front público
**O que implementar**
- Header do tenant com placeholder de Login/Cadastro + ícone “modo dev”
- Ícone aparece apenas em `NODE_ENV=development`
- Clique redireciona para `/{tenant}/dashboard/builder`

**Validação**
- Em dev: ícone aparece e navega corretamente
- Em build/produção (quando simulado): ícone não aparece e rotas do dashboard respondem 404 (ou bloqueio equivalente)

### Passo 8 — Ajuste do desenho (para evitar divergência)
**O que atualizar**
- Atualizar [ecommerce-frontend.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/ecommerce-frontend.md) para marcar como “já feito”:
  - REST API do catálogo no `MOCK-END`
  - Seeds + THEMA/CONTEXTO/COPY/BLUEPRINT/BUILDER por tenant
- Manter o documento como “fonte de verdade” da POC, alinhado com a execução.

**Validação**
- Seções “Status atual” e “Próximo passo” ficam consistentes com o repo.

## Arquivos alvo (principais) — quando executar
- Recriação:
  - `WWW/n1/` (regerar tudo)
- Multi-tenant:
  - `WWW/n1/src/middleware.ts`
  - `WWW/n1/src/lib/tenant/*`
- Integração MOCK-END (fs + REST):
  - `WWW/n1/src/lib/mockend/*`
- Estado e providers:
  - `WWW/n1/src/lib/store/cart.ts`
  - `WWW/n1/src/components/providers/ReactQueryProvider.tsx`
- UI base:
  - `WWW/n1/src/components/layout/Header.tsx`
  - `WWW/n1/src/components/layout/Footer.tsx`
  - `WWW/n1/src/components/ui/*` (shadcn)
- Páginas:
  - `WWW/n1/src/app/[tenant]/layout.tsx`
  - `WWW/n1/src/app/[tenant]/page.tsx`
  - `WWW/n1/src/app/[tenant]/categoria/[slug]/page.tsx`
  - `WWW/n1/src/app/[tenant]/produto/[slug]/page.tsx`
  - `WWW/n1/src/app/[tenant]/carrinho/page.tsx`
  - `WWW/n1/src/app/[tenant]/dashboard/builder/*`

## Critérios de aceite (Pronto quando…)
- Multi-tenant funciona em `adega-lopes.lvh.me:3000` e `mercearia-lopes.lvh.me:3000`
- Páginas da POC existem e funcionam (Home/Categoria/Produto/Carrinho) sem links para “resto do e-commerce”
- Builder é editável no dashboard e persiste em `MOCK-END/<tenant>/BUILDER/pages.json`
- Atalho de modo dev aparece apenas em development e abre o builder
- Catálogo é consumido via REST do `MOCK-END` com React Query; carrinho via Zustand

## Como verificar (quando executar)
- Subir `MOCK-END` em `WWW/MICROSERVICE/MOCK-END` e checar `GET /health`
- Subir `WWW/n1` e abrir:
  - `http://adega-lopes.lvh.me:3000/`
  - `http://mercearia-lopes.lvh.me:3000/`
  - `http://adega-lopes.lvh.me:3000/adega-lopes/carrinho` (fallback por path, se necessário)
- Testar builder:
  - `/{tenant}/dashboard/builder` (editar e publicar)
- Rodar `npm run lint` e `npm run build` no `WWW/n1`

## Riscos / pontos de atenção
- Paths Windows: leitura do `MOCK-END` precisa ser robusta (não depender de cwd específico).
- Persistência no `BUILDER/pages.json`: reexecutar geradores do `MOCK-END` pode sobrescrever; tratar como “reset” da POC.
- Segurança do editor: POC é dev-only; garantir que rotas do dashboard/editor não “vazam” em produção.
