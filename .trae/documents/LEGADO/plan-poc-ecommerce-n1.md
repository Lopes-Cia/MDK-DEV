# Plano: POC do desenho “E-commerce Frontend Multi-tenant” em `/WWW/N1`

## Resumo
Validar o desenho descrito em [ecommerce-frontend.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/ecommerce-frontend.md) criando uma POC em `c:\LOPES\www\MDK-DEV\WWW\n1` com:
- Next.js (App Router) + **Tailwind + shadcn/ui** (ajuste do item de estilização do desenho)
- Multi-tenant via **subdomínio em localhost** (ex.: `loja-a.lvh.me:3000`) com fallback por path
- Integração real com **Puck (OSS)** como editor visual de “bricks” dentro do Next.js (sem SaaS)
- Preparação para adicionar **Payload CMS (OSS)** ou **Strapi (OSS)** depois, apenas para catálogo/produtos e conteúdo

## Estado Atual (análise do repo)
- O repositório atual é “IA-first”, com documentos em `IA/DESENHOS/`.
- Existe `WWW/REFERENCIAS/` com projetos clonados e um Next.js de referência em `WWW/REFERENCIAS/connect-ecommerce-develop/`.
- Não existe `WWW/N1` ainda.
- Não existe `.trae/documents/` no momento; este plano cria o arquivo de plano neste diretório.

## Decisões (confirmadas)
- **Visual builder agora:** **Puck (OSS)** embutido no Next.js (integração real).
- **Multi-tenant em localhost:** **subdomínios via `lvh.me`** (sem editar `hosts`), com fallback por path.
- **UI base (ajuste solicitado):** **Tailwind + shadcn/ui**.

## Contextos de Exemplo (tenants) para guiar a POC

### 1) ADEGA LOPES (bebidas) — foco em delivery
**Proposta do catálogo**
- Categorias típicas: cervejas, destilados, vinhos, energéticos, refrigerantes, gelo, snacks.
- SKUs com variações comuns: volume (ml), pack (lata/unidade/caixa), temperatura (gelada/natural), retorno (casco) quando existir.

**Regras e UX de conversão (bricks prioritários)**
- Home orientada a compra rápida: vitrine “em destaque”, “promoções”, “combos”, “mais vendidos”, “entrega rápida agora”.
- Navegação por “ocasião” (ex.: churrasco, festa, happy hour) além de categorias.
- Busca forte (produto + marca + volume) e filtros por: marca, volume, preço, “gelada”, pack.

**Regras de delivery (específicas)**
- Seleção de local/CEP no topo (antes de listar preços e disponibilidade).
- Janela de entrega rápida e/ou agendamento (ex.: “entrega hoje em X min” vs “agendar”).
 - POC: o “calculador de CEP” é somente UI (mock), sem cálculo real de taxa/prazo.

**Pontos de atenção (dependem de política local)**
- Restrições por idade para alcoólicos (gate na UI + termos no checkout).
- Horário de venda/entrega (bloqueios por horário) e taxa por raio/CEP.

### 2) MERCEARIA LOPES (alimentos) — foco em delivery
**Proposta do catálogo**
- Categorias típicas: mercearia seca, laticínios, bebidas não alcoólicas, limpeza, higiene, congelados.
- SKUs com variações comuns: unidade vs peso (kg/g), marcas similares, tamanhos e sabores.

**Regras e UX de conversão (bricks prioritários)**
- Home com “recompras” e praticidade: “itens essenciais”, “café da manhã”, “kit limpeza”, “promoções do dia”.
- Lista de produtos com densidade alta (modo lista) e CTA de “+” rápido (ideal para carrinho grande).
- Sugestões e complementos no carrinho (cross-sell): “quem comprou X leva Y”.

**Regras de delivery (específicas)**
- Substituição de item (ex.: “se faltar, substitua por similar” ou “não substituir”).
- Observações por item (ex.: “banana verde”, “pão fatiado”) quando aplicável.
- Agendamento de entrega mais relevante do que “entrega imediata” em alguns cenários.
 - POC: o “calculador de CEP” é somente UI (mock), sem cálculo real de taxa/prazo.

### Implicações para a POC (o que validar com Puck)
**O que precisa ficar diferente entre tenants (além de cor)**
- Composição da Home (ordem e presença de blocos), densidade de produto (grid vs lista), tipos de vitrine (combos vs essenciais).
- Layout do cartão de produto: destaque para volume/pack (adega) vs unidade/peso e variação (mercearia).
- Regras de entrega: mensagens e blocos de seleção (CEP/janela) e microcopy por segmento.

**Rotas alvo para validar rapidamente**
- `/{tenant}/` (home editável pelo Puck)
- `/{tenant}/categoria/[slug]` (pode ser mock na POC, mas com layout/brick diferente por tenant)
- `/{tenant}/checkout` (fluxo básico com regras de delivery; pode ser estático na POC)

## Theming (por tenant)

### Objetivo
- Cada tenant deve ter identidade visual própria (não só trocar cores), incluindo: paleta, tipografia, radii e densidade de UI, mantendo a mesma base de código.

### Diretriz por tenant
- **ADEGA LOPES**: moderno e jovem (alto contraste, acentos vibrantes, tipografia sem serifa contemporânea).
- **MERCEARIA LOPES**: clássico e requintado (tons mais sóbrios, acentos “premium”, tipografia com serifa no display).

### Implementação prevista (sem entrar em código ainda)
- Definir tokens por tenant (CSS variables) e aplicar no `layout.tsx` do tenant via atributo/classe no `html/body`.
- Usar `next/font` para carregar famílias diferentes por tenant.
- Manter shadcn/ui como base e trocar apenas os tokens (cores, radius, fontes), sem forkar componentes.

### Ferramentas para compor paleta + fontes + estilo (IA / geradores)
- Realtime Colors (testa paletas e tipografia em UI real).
- Huemint / Khroma (gera paletas “UI-friendly” a partir de preferências).
- Fontjoy (sugere pares de fontes) + Google Fonts para execução rápida.

### Subplano: escolher tema com amostras visuais
**Artefato**
- [theming-amostras.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/theming-amostras.md)

**Decisão**
- Seguir o subfluxo do artefato (Huemint/Khroma → Fontjoy → Realtime Colors) e fechar 1 tema final por tenant.

**Critério de escolha (POC)**
- Leitura rápida no mobile, destaque de CTA, legibilidade de preço e promoção, e coerência com “jovem” vs “requintado”.

## Seeding (catálogo mock por tenant)

Objetivo: ter produtos + categorias suficientes para validar bricks, listagens, busca e carrinho, sem depender de integrações.

**Artefato**
- [seeding-catalogo.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/seeding-catalogo.md)

**Abordagem**
- Seeds em JSON consumidos de um microsserviço local de mock (MOCK-END):
  - `WWW/MICROSERVICE/MOCK-END/adega-lopes/CATALOGO/categorias.json`
  - `WWW/MICROSERVICE/MOCK-END/adega-lopes/CATALOGO/produtos.json`
  - `WWW/MICROSERVICE/MOCK-END/mercearia-lopes/CATALOGO/categorias.json`
  - `WWW/MICROSERVICE/MOCK-END/mercearia-lopes/CATALOGO/produtos.json`

**Escopo de dados (POC)**
- ADEGA: 50–80 produtos (com volume/pack e badge “gelada”).
- MERCEARIA: 80–120 produtos (com unidade/peso e badge “essencial”).

## Mudanças Propostas (o que será criado em `/WWW/N1`)

### 0) Ajustar o desenho (única modificação solicitada)
**Arquivo**
- `c:\LOPES\www\MDK-DEV\IA\DESENHOS\ecommerce-frontend.md`

**Mudança**
- Substituir o item de estilização (linha 12) por:
  - **Estilização:** Tailwind CSS + shadcn/ui (componentes acessíveis e performáticos; Radix por baixo).

### 1) Criar o projeto Next.js “core” (App Router + TypeScript + Tailwind)
**Pasta alvo**
- `c:\LOPES\www\MDK-DEV\WWW\n1\`

**Inicialização**
- Criar um app Next.js com estrutura em `src/` e App Router.
- Manter lint e TS habilitados.
- Padronizar com Tailwind CSS (idealmente alinhado ao projeto de referência `connect-ecommerce-develop`, que já usa Tailwind 4).
- Inicializar shadcn/ui (para construir blocos base acessíveis e performáticos).
- Integrar Puck (biblioteca `@puckeditor/core`) como editor visual de páginas.

**Arquivos/diretórios esperados**
- `WWW/n1/package.json`
- `WWW/n1/src/app/`
- `WWW/n1/src/components/`
- `WWW/n1/src/lib/`
- `WWW/n1/src/tenants/`

### 2) Implementar multi-tenant para produção e para localhost (sem Vercel)
**Objetivo**
- Em produção: resolver tenant por domínio/subdomínio.
- Em localhost: resolver tenant por subdomínio usando DNS público que aponta para 127.0.0.1:
  - `http://loja-a.lvh.me:3000/` → tenant `loja-a`
  - `http://loja-b.lvh.me:3000/` → tenant `loja-b`
- Fallback por path (quando necessário):
  - `http://localhost:3000/loja-a` e `http://localhost:3000/loja-b`

**Estrutura**
- `WWW/n1/src/middleware.ts`
  - Lê `host` e faz rewrite interno para `/<tenant>/...` quando o host for `*.lvh.me` (ou em produção `*.seu-dominio.com`).
  - Mantém fallback por path quando a URL já vier como `/<tenant>`.
- `WWW/n1/src/app/[tenant]/layout.tsx`
  - Resolve config do tenant e injeta providers (ex.: fonts, header/footer).
  - Define `generateMetadata` (título/descrição) por tenant.
- `WWW/n1/src/app/[tenant]/[[...slug]]/page.tsx`
  - Rota catch-all por tenant para páginas renderizadas via Puck (e depois poderá coexistir com rotas de produto/categoria).
- `WWW/n1/src/app/page.tsx`
  - Redireciona para um tenant padrão (ex.: `loja-a.lvh.me`) ou exibe um seletor simples.

**Tenant resolution**
- Implementar `getTenantConfig(tenant: string)` em `WWW/n1/src/lib/tenant/getTenantConfig.ts`.
- Validar tenant inexistente com `notFound()` (404).

### 3) Integrar Puck (sem simulação) + registrar componentes (blocos)
**Meta**
- Cada tenant terá suas páginas armazenadas por `tenantId` (pode iniciar com JSON em disco para o POC e depois migrar para DB), permitindo montar páginas de forma visual com drag-and-drop usando componentes do código.

**Configuração**
- Criar `WWW/n1/puck.config.tsx` definindo o catálogo de blocos e campos editáveis.
- Definir quais rotas terão editor:
  - `http://loja-a.lvh.me:3000/edit` (Home)
  - `http://loja-a.lvh.me:3000/qualquer/rota/edit` (criar página nova)
- Proteger `/edit` com uma autenticação simples (secreto em env) para não expor o editor.

**Persistência (POC)**
- Implementar API route para salvar/carregar páginas do Puck por tenant + urlPath:
  - `WWW/n1/src/app/puck/api/route.ts` (ou similar)
- Persistir inicialmente em arquivos JSON sob `WWW/n1/src/tenants/<tenant>/pages/` ou em um “db” JSON simples.

**Registro de componentes**
- Criar `WWW/n1/src/components/puck/` com blocos (Hero, ProductGrid etc.) e expor no `puck.config.tsx`.

### 4) Criar blocos de e-commerce focados em conversão (primeiro conjunto)
**Componentes (shadcn/ui + Tailwind), registrados no Puck**
- `WWW/n1/src/components/puck/HeroSection.tsx`
- `WWW/n1/src/components/puck/FeatureGridSection.tsx`
- `WWW/n1/src/components/puck/ProductGridSection.tsx`
- `WWW/n1/src/components/puck/TestimonialsSection.tsx`
- `WWW/n1/src/components/puck/PromoBannerSection.tsx`
- `WWW/n1/src/components/puck/FooterSection.tsx`

**Dados para o POC**
- Fonte 1 (recomendado para começar): produtos mock locais (rápido, sem depender de backend).
- Fonte 2 (opcional): plugar um provider de catálogo real depois (Shopify/Medusa/etc.).

**Regras de performance embutidas**
- Evitar blocos que gerem CLS: imagens com aspect ratio fixo, skeleton/placeholder quando aplicável.
- `next/image` com imagens locais (primeiro), e configuração de domínios só se necessário.

### 5) Conectar o “Editor visual” do Puck ao localhost
**Objetivo**
- Permitir que o Puck edite páginas do tenant em localhost via rotas `/edit`.

**Ações**
- Garantir que as rotas funcionem em subdomínios (`lvh.me`) e que o editor publique e reflita no preview.
- Garantir que o editor funciona para qualquer `urlPath` (catch-all).
- Proteger `/edit` com um gate simples (token em cookie/header) para não expor em produção.

## Critérios de Aceite (Pronto quando…)
- `npm run dev` em `WWW/n1` sobe sem erros e abre:
  - `http://loja-a.lvh.me:3000/` e `http://loja-b.lvh.me:3000/`
- `loja-a` e `loja-b` mostram **layouts significativamente diferentes** (ordem/estrutura/variantes), não apenas cores.
- Páginas são montadas pelo Puck usando blocos registrados (editor real).
- `http://loja-a.lvh.me:3000/edit` permite montar e publicar a Home e refletir em `/`.

## Validação (como testar localmente)
1. Instalar dependências: `npm install` (ou `npm ci` se houver lockfile).
2. Rodar: `npm run dev`.
3. Abrir:
   - `http://loja-a.lvh.me:3000/` e `http://loja-b.lvh.me:3000/`
   - editar e publicar em `http://loja-a.lvh.me:3000/edit` e validar refletindo em `/`
4. (Opcional) Rodar lint: `npm run lint`.

## Itens Fora de Escopo (por enquanto)
- Payload/Strapi (entra depois só para catálogo/produtos/conteúdo).
- Checkout real, gateway, autenticação, estoque/preço real.
- Deploy/infra (Vercel) — o foco é validar localmente, mas o desenho continua compatível com Vercel.
