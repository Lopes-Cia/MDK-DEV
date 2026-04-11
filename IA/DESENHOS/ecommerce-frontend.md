# Desenho de Arquitetura: Frontend E-commerce Multi-tenant

## Objetivo
Definir o stack tecnológico e a arquitetura para uma plataforma de e-commerce White-label (Multi-tenant) baseada em Next.js. O sistema deve usar uma única base de código (`core`), mas permitir que cada lojista (tenant) tenha layouts, grids e componentes altamente personalizados, indo muito além de simples mudanças de cores, mantendo foco extremo em Performance (Core Web Vitals) e Conversão.

---

## 1. Stack Tecnológico Frontend

- **Framework Core:** Next.js (App Router)
- **Hospedagem / Edge (produção futura):** Vercel (ideal para Middleware de roteamento Multi-tenant)
- **Estilização:** Tailwind CSS + shadcn/ui (Radix por baixo) (para criar blocos base acessíveis e performáticos)
- **Gerenciamento de Estado e Data Fetching:** Zustand (carrinho/UI state) + React Query (consumo do `MOCK-END` via REST API para catálogo/estoque/preço no client quando necessário)
- **Visual Builder / Headless CMS (por custo):**
  - **Free / low-cost (recomendado para começar):** Puck (page builder OSS embutido no Next.js) + Payload CMS (OSS) ou Strapi (OSS) para dados/coleções
  - **SaaS (quando fizer sentido):** Builder.io, Plasmic, React Bricks, Storyblok

---

## 2. Análise de Visual Builders ("Bricks")

Para permitir que cada cliente tenha um design sofisticado e único sem "forkar" o código, precisamos de um CMS Visual (ou um editor de blocos). Abaixo as opções avaliadas, priorizando alternativas free/low-cost:

### 🏆 Recomendação (free/low-cost, Next.js-first): Puck (OSS) como “Bricks” dentro do Next.js
Para ter “bricks” de modo visual sem SaaS, uma alternativa bem aderente ao Next.js é embutir um editor de páginas no próprio app.
- **Como funciona:** Você define um catálogo de blocos (componentes React) e o editor permite montar páginas via drag-and-drop usando somente esses blocos.
- **Multi-tenant:** Cada tenant pode ter suas páginas/schemas separadas por `tenantId` (no seu banco) e o mesmo código renderiza tudo.
- **Trade-offs:** Você vira “dono do builder” (precisa cuidar de persistência, permissões e UX do editor). A vantagem é custo baixo e controle total.

### Alternativa (OSS): Payload CMS ou Strapi (component-based)
Se a meta é “conteúdo estruturado + blocos” com stack Node/TS, Payload ou Strapi são opções fortes.
- **Como funciona:** Modela “Sections/Blocks” como schemas (ex.: hero, grid, carrossel). O editor preenche campos e escolhe variantes, e o Next.js renderiza blocos com total controle de performance.
- **Multi-tenant:** Pode ser por workspace/projeto, por instância, ou por camada de autorização e particionamento de dados.
- **Trade-offs:** A liberdade de “arrastar e soltar” tende a ser menor que builders SaaS; você compensa com variantes e presets bem desenhados.

### Alternativa (free): TinaCMS / Decap CMS (edição de conteúdo, não “layout builder” completo)
Se o objetivo for edição de conteúdo com baixo custo e pouca infra:
- **Como funciona:** Edição de conteúdo com fluxo Git (arquivos Markdown/JSON) e prévias no Next.js.
- **Trade-offs:** Ótimo para conteúdo e landing pages simples; menos indicado se a exigência é “montar layout sofisticado” livremente por drag-and-drop.

### Alternativas SaaS (quando o budget permitir)
Se fizer sentido pagar pela operação/velocidade, aí entram:
- **Builder.io**: liberdade alta e recursos avançados (ex.: experiências/experimentação), mas é SaaS.
- **Plasmic**: editor estilo design tool; muita liberdade, exige governança para não prejudicar performance.
- **React Bricks**: edição inline tipada; menos liberdade, mais controle.

### Alternativa 1: Plasmic
- **Foco:** Mais voltado para "Design-to-Code". A interface lembra muito o Figma.
- **Vantagem:** Dá liberdade quase absoluta de design (nível pixel-perfect) para quem está montando a loja.
- **Risco:** Como dá muita liberdade, se o usuário não souber o que está fazendo, pode criar um DOM muito profundo, prejudicando o *Cumulative Layout Shift (CLS)* e a performance.

### Alternativa 2: React Bricks
- **Foco:** Edição inline (tipo Notion/Word).
- **Vantagem:** O layout é "inquebrável". O design system fica 100% no código, e o usuário só altera textos, imagens e propriedades pré-definidas (ex: alinhar à esquerda/direita).
- **Desvantagem:** É mais engessado. Se o cliente quiser um grid maluco que você não previu no código, ele não consegue fazer sozinho.

---

## 3. Arquitetura Multi-tenant (Single Codebase)

A mágica acontece no `middleware.ts` do Next.js e na renderização dinâmica.

### Ambiente da POC (agora: somente local)
- Multi-tenant será validado apenas em localhost (sem produção por enquanto).
- Abordagem sugerida: subdomínios via `lvh.me` (ex.: `adega-lopes.lvh.me:3000`, `mercearia-lopes.lvh.me:3000`) + fallback por path quando necessário.

### Fluxo da Requisição
1. O usuário acessa `loja-do-cliente.com.br`.
2. O **Vercel Edge Middleware** intercepta a requisição, identifica o `hostname` e faz um rewrite interno para `/[tenant]/page` (ex: `/loja-do-cliente/`).
3. O Next.js identifica qual é a loja e resolve a configuração do tenant (regras/feature flags/integrações; na POC pode ser arquivo).
4. O Next.js carrega o **layout do tenant** a partir da persistência do editor (Puck), usando `tenantId + urlPath`.
5. O Next.js renderiza o layout usando os componentes React do `core` (blocos registrados no Puck).

### Estrutura de Diretórios Sugerida (App Router)
```text
/src
  /app
    /api                 # Rotas de API gerais
    /[tenant]            # Roteamento Dinâmico Multi-tenant
      /layout.tsx        # Layout base (injetores de contexto)
      /page.tsx          # Renderizador da Home (via Puck)
      /[...slug]/page.tsx # Renderizador de páginas dinâmicas (institucionais, etc.) (via Puck)
      /categoria/[slug]/page.tsx # Template de Categoria (POC)
      /produto/[slug]/page.tsx # Template de Produto
      /carrinho/page.tsx # Carrinho (POC)
  /components
    /puck                # Blocos registrados no Puck (ex: Hero, ProductGrid)
    /ui                  # Componentes base (Shadcn/Tailwind)
  /lib
    /puck                # Configuração do editor + persistência + helpers
    /tenant              # Utilitários para descobrir quem é o cliente atual
```

### MOCK-END (dados e temas da POC)
Para a POC, a base de código consome dados e configurações de tenant a partir do diretório de mock:
- Catálogo (por tenant):
  - `WWW/MICROSERVICE/MOCK-END/<tenant>/CATALOGO/categorias.json`
  - `WWW/MICROSERVICE/MOCK-END/<tenant>/CATALOGO/produtos.json`
- Tema (por tenant):
  - `WWW/MICROSERVICE/MOCK-END/<tenant>/THEMA/theme.json` (2 opções candidatas + `selected`)
  - `WWW/MICROSERVICE/MOCK-END/<tenant>/THEMA/tokens.css` (tokens gerados do `selected`)
- Contexto do tenant (por tenant) (a criar):
  - `WWW/MICROSERVICE/MOCK-END/<tenant>/CONTEXTO/contexto.json`
  - Objetivo: guardar o “brief” do tenant (segmento, vibe, prioridades de UX/conversão, regras de delivery como UI mock, textos) para alimentar a geração/configuração do builder do tenant (Puck) e manter consistência de conteúdo/estrutura entre páginas.
  - Contextos definidos para a POC: **ADEGA LOPES** e **MERCEARIA LOPES** (detalhados no plano da POC).
 - Copy (textos) do tenant (por tenant) (a criar)
  - `WWW/MICROSERVICE/MOCK-END/<tenant>/COPY/copy.json`
  - Objetivo: ter os textos necessários da POC (títulos, microcopy, banners, CTAs, labels de forms) como seed por tenant, evitando hardcode e facilitando variações ADEGA vs MERCEARIA.

Status atual (já feito)
- `MOCK-END` já possui, por tenant (`adega-lopes` e `mercearia-lopes`):
  - `CATALOGO/` (categorias + produtos)
  - `THEMA/` (theme.json + tokens.css)
  - `CONTEXTO/` (contexto.json)
  - `COPY/` (copy.json)
  - `BLUEPRINT/` (extração IA-first + síntese markdown)
  - `BUILDER/` (pages.json + enabledBlocks.json + presets.json)
- `MOCK-END` já funciona como back-end REST (mock) para servir **apenas CATALOGO**:
  - `WWW/MICROSERVICE/MOCK-END/server.mjs` (porta padrão 4000)
  - Endpoints (por tenant):
    - `GET /api/:tenant/catalogo/categorias`
    - `GET /api/:tenant/catalogo/produtos`
    - `GET /api/:tenant/catalogo/categorias/:slug`
    - `GET /api/:tenant/catalogo/produtos/:slug`

Ordem de execução (POC)
- Fazer **todo o MOCK-END primeiro** (CATALOGO + THEMA + CONTEXTO + COPY + BLUEPRINT + BUILDER + REST API do catálogo), e só depois iniciar o frontend.

Próximo passo (a fazer)
- Iniciar o frontend da POC em `WWW/n1`:
  - Multi-tenant local via `lvh.me` (middleware rewrite para `/{tenant}`)
  - Páginas do escopo: Home, Categoria, Produto, Carrinho
  - Consumo do `MOCK-END`:
    - `CATALOGO` via REST (React Query)
    - `THEMA/CONTEXTO/COPY/BLUEPRINT/BUILDER` via leitura local de arquivos (não expor como API nesta fase)
  - Dashboard do builder em `/{tenant}/dashboard/builder` + atalho dev no header (somente em development)

Tema por tenant (THEMA)
- THEMA não é para consumo via API nesta fase: será usado como base para gerar/configurar o builder do tenant (tokens/estilo), e não como endpoint HTTP.

Convenções do MOCK-END (naming)
- Pastas: `CATALOGO/`, `THEMA/`, `CONTEXTO/`, `BLUEPRINT/`, `COPY/` (maiúsculo)
- Arquivos: `categorias.json`, `produtos.json`, `theme.json`, `tokens.css`, `contexto.json`, `copy.json` (minúsculo)

### Builder generator (THEMA/CONTEXTO/BLUEPRINT/COPY → Puck)
Para evitar hardcode e garantir variação real entre tenants, o builder é gerado por tenant usando um fluxo build-time:
- Entrada (por tenant, no `MOCK-END`):
  - `THEMA/` (tokens/estilo)
  - `CONTEXTO/` (brief e regras)
  - `BLUEPRINT/` (páginas/componentes “oficiais” do tenant)
  - `COPY/` (microcopy/CTAs/labels por tenant)
- Saída (por tenant, no `MOCK-END`) (gerado):
  - `WWW/MICROSERVICE/MOCK-END/<tenant>/BUILDER/`
  - Conteúdo: presets e dados iniciais para o Puck (páginas default e configurações do tenant), para o frontend carregar como seed.

### Blueprint de páginas (IA-first)
Para padronizar o “mapa de páginas” do e-commerce (e usar isso como guia do builder e da POC):
- Fonte atual: `IA/DESENHOS/mapa_paginas_ecommerce.xlsx`
- Extração do conteúdo do XLSX para um formato **IA-first** (estruturado e fácil de diff), e então simplificação:
  - `WWW/MICROSERVICE/MOCK-END/<tenant>/BLUEPRINT/mapa_paginas_ecommerce.ia.json` (extração fiel: abas → tabelas → linhas)
  - `WWW/MICROSERVICE/MOCK-END/<tenant>/BLUEPRINT/blueprint-paginas-ecommerce.md` (síntese: páginas essenciais, fluxos, componentes e regras do tenant)
- Blueprint é por tenant (igual THEMA): `adega-lopes` e `mercearia-lopes`.
- A extração/síntese do XLSX também alimenta o seed de **copy** (`COPY/copy.json`) para manter consistência de textos entre páginas e blocos.

Escopo de páginas na POC (sem links para outras páginas)
- `/{tenant}/` (Home)
- `/{tenant}/categoria/[slug]` (Categoria)
- `/{tenant}/produto/[slug]` (Produto)
- `/{tenant}/carrinho` (Carrinho)
- Outras páginas (institucionais/checkout/login/etc.) ficam fora do menu e sem links por enquanto.
- `/{tenant}/[...slug]` existe apenas como base futura para páginas institucionais/dinâmicas (fora do menu no momento).

Escopo de componentes (para montar com Puck)
- Carrosséis (banner, produtos)
- Cards (produto, categoria, promo)
- CTAs (Adicionar ao carrinho, Ver produto, Ver categoria, Continuar comprando)
- Forms (CEP mock, busca, filtros)
- Navegação (header, menu, breadcrumbs, footer)
- Carrinho (drawer/aside ou página, linha de item, stepper de quantidade)

### Dashboard do builder (POC)
Para não misturar “editor” com a experiência do cliente final:
- O editor de bricks (Puck) fica em uma área de dashboard/admin do tenant (não no front público).
- Rotas sugeridas:
  - `/{tenant}/dashboard`
  - `/{tenant}/dashboard/builder`
  - `/{tenant}/dashboard/builder/edit?path=/` (editar uma página)

Atalho de modo dev (POC)
- No header do front público, ao lado do botão (por enquanto vazio) de **Login/Cadastro**, adicionar um ícone de **modo dev**.
- Ao clicar, o app ativa o modo dev e redireciona para o builder (`/{tenant}/dashboard/builder`).
- Regra: o ícone/atalho só aparece quando `NODE_ENV=development` (ou flag equivalente); em produção não deve existir.

Objetivo: reduzir complexidade, manter consistência e permitir que o Puck seja configurado com um conjunto “oficial” de páginas + componentes por tenant.

---

## 4. Estratégia de Performance (Core Web Vitals)

Para garantir conversão máxima, o e-commerce não pode ser lento, mesmo sendo montado via CMS Visual.

1. **ISR (Incremental Static Regeneration):** 
   - As páginas montadas no editor (Puck) não devem ser carregadas via client-side fetch (isso destrói o SEO).
   - O Next.js deve gerar o HTML no servidor e guardar em cache (CDN). Quando o layout mudar (publish no editor), disparar revalidação sob demanda da URL (ou tag) do tenant.
2. **PPR (Partial Prerendering) / Suspense:**
   - A casca da página (Header, Footer, layout principal) vem do cache super rápido.
   - Preço, estoque e carrinho (que mudam a todo segundo) são envelopados em `<Suspense>` e carregados no cliente ou em streamming do servidor.
3. **Otimização de Imagens:**
   - Usar obrigatoriamente o `next/image` acoplado a um CDN moderno.
   - Priorizar (preload) a imagem de LCP (First Contentful Paint), geralmente o banner principal ou a foto principal do produto.

---

## 5. Próximos Passos
1. Definir qual motor de “bricks” será testado primeiro (Puck embutido no Next.js ou Payload/Strapi com blocos).
2. Criar uma POC (Proof of Concept) em uma branch/pasta separada usando **Next.js + Tailwind + shadcn/ui**.
3. Configurar o `middleware.ts` para testar multi-tenant em localhost (preferir `loja-a.lvh.me:3000` e `loja-b.lvh.me:3000` para simular subdomínios sem mexer no hosts).
4. Criar 2 páginas Home com layouts bem diferentes por tenant, validando:
   - performance (LCP/CLS/INP)
   - SEO básico (render server-side)
   - flexibilidade de layout (não só cores)
