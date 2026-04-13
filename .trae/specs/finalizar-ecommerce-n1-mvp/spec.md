# Ecommerce N1 MVP (Conta + Pedido + Páginas Completas) — Spec

## Why
Hoje o `MOCK-END` já consegue persistir JSONs/arquivos por tenant, o que habilita simular fluxos reais de e-commerce (conta, checkout, pedidos) de ponta a ponta. Isso destrava a finalização do produto (funcional) antes de um redesign completo de layout.

## What Changes
- Completar as páginas essenciais do e-commerce no `WWW/n1` para suportar:
  - criação de conta (mock)
  - login (mock)
  - checkout (mock) e criação de pedido
  - histórico/detalhe de pedidos
- Persistir “contas” e “pedidos” por tenant no `WWW/MICROSERVICE/MOCK-END` via JSON (sem banco).
- Definir um contrato mínimo (schemas) com validação (ex.: Zod) para evitar JSON inválido.
- Padronizar uma base de layout (não só cores): estrutura de página, cards, grids, espaçamentos e estados (loading/empty/error) para todas as rotas.
- Adotar o padrão “DevDash”: **stores como camada única de fetch** + **API routes como façade** (UI não integra direto com persistência).
- **BREAKING (MOCK-END)**: adicionar um novo diretório permitido para JSON de domínio (ex.: `COMMERCE/`) para que o servidor permita leitura/escrita via API.

## Impact
- Affected specs: fluxos de conta, checkout, pedidos, persistência de mock, UX de páginas.
- Affected code:
  - `WWW/n1/src/app/[tenant]/**` (novas rotas e telas)
  - `WWW/n1/src/lib/mockend/**` (clients e schemas)
  - `WWW/n1/src/lib/store/**` (estado de sessão/checkout/pedido)
  - `WWW/MICROSERVICE/MOCK-END/server.mjs` (allowlist de diretórios JSON + possíveis endpoints auxiliares)
  - `WWW/MICROSERVICE/MOCK-END/<tenant>/**` (novos JSONs de domínio)
  - Referências de desenho: `IA/DESENHOS/LEGADO` e `.trae/documents/LEGADO`

## ADDED Requirements
### Requirement: Persistência de domínio por tenant (COMMERCE)
O sistema SHALL persistir dados de “conta” e “pedidos” por tenant no `MOCK-END` usando JSONs dentro de um diretório de domínio (ex.: `COMMERCE/`).

Arquivos mínimos por tenant:
- `COMMERCE/users.json` (lista de usuários)
- `COMMERCE/sessions.json` (sessões mock / tokens)
- `COMMERCE/orders.json` (lista de pedidos)

Bootstrap:
- O sistema SHALL criar a estrutura básica de diretórios/arquivos quando não existirem (seed mínimo) para evitar 500/fluxos quebrados.

#### Scenario: Criar conta
- **WHEN** o usuário preenche cadastro
- **THEN** o sistema cria um registro em `COMMERCE/users.json` e cria uma sessão em `COMMERCE/sessions.json`

#### Scenario: Criar pedido
- **WHEN** o usuário finaliza checkout
- **THEN** o sistema cria um pedido em `COMMERCE/orders.json` e limpa o carrinho no client

### Requirement: Autenticação mock (sem senha real)
O sistema SHALL simular autenticação sem armazenar senha real.

Regras:
- Identidade mínima: `email`, `name`
- Sessão: token aleatório (uuid), persistido no MOCK-END e guardado no client (cookie ou localStorage)
- Rotas “Minha Conta” e “Pedidos” devem exigir sessão válida

#### Scenario: Login
- **WHEN** o usuário informa e-mail (e opcionalmente nome)
- **THEN** o sistema cria/reativa uma sessão e redireciona para “Minha Conta”

### Requirement: Checkout mock (endereço + pagamento)
O sistema SHALL oferecer um checkout mock em 2 etapas:
- Endereço (campos mínimos)
- Pagamento (seleção de método mock)

Regras:
- O pedido deve conter snapshot de itens do carrinho (id, nome, preço, qty, imagem)
- Total calculado no client (com validação do schema ao persistir)

#### Scenario: Checkout completo
- **WHEN** o usuário confirma o pedido
- **THEN** o sistema cria o pedido e mostra a página de sucesso com `orderId`

### Requirement: Páginas do MVP (rotas)
O sistema SHALL implementar páginas mínimas:
- `/{tenant}/login`
- `/{tenant}/cadastro`
- `/{tenant}/minha-conta`
- `/{tenant}/pedidos`
- `/{tenant}/pedido/[orderId]`
- `/{tenant}/checkout`
- `/{tenant}/checkout/sucesso?orderId=...`

#### Scenario: Navegação básica
- **WHEN** o usuário navega pelo header/CTAs
- **THEN** as rotas principais funcionam e exibem estados de loading/empty/error

### Requirement: UX consistente (layout e estados)
O sistema SHALL aplicar uma base de layout consistente (hierarquia, grids, cards, espaçamento) e estados (loading/empty/error) em todas as páginas do MVP.

Critérios:
- Cards e CTAs consistentes
- Foco visível e `aria-label` onde necessário
- Sem “página crua” (tipografia e espaçamento mínimos em todas as rotas)

### Requirement: Padrão “DevDash” de camada de dados (stores + api routes)
O sistema SHALL seguir o padrão adotado em `WWW/MICROSERVICE/devdash`:
- Componentes/telas NÃO devem integrar diretamente com o `MOCK-END` para operações de domínio (conta/sessão/pedidos).
- Operações de domínio devem passar por:
  1) **API routes** no `WWW/n1` (App Router) como façade (server-side)
  2) **Stores** (Zustand) como camada única de fetch no client

Regras:
- UI chama somente actions do store.
- Store chama somente endpoints do próprio app (`/api/commerce/...`).
- API routes são responsáveis por:
  - validar input
  - aplicar schemas
  - ler/gravar JSON no `MOCK-END`
  - retornar respostas “simples” e previsíveis para o store

#### Scenario: Criar pedido via store
- **WHEN** o usuário confirma checkout na UI
- **THEN** a UI chama `ordersStore.createOrder()`, que chama `POST /api/commerce/{tenant}/orders`, e a api route grava `COMMERCE/orders.json`

## MODIFIED Requirements
### Requirement: Servidor MOCK-END aceita JSON por domínio
O `MOCK-END` SHALL permitir leitura/escrita de JSON em um diretório adicional de domínio (ex.: `COMMERCE/`) além dos diretórios atuais.

#### Scenario: Persistir pedidos
- **WHEN** `PUT /api/:tenant/json?path=COMMERCE/orders.json`
- **THEN** o arquivo é criado/atualizado e pode ser lido em seguida

## REMOVED Requirements
Nenhum.
