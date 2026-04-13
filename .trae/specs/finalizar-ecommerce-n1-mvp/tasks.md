# Tasks

- [x] Task 1: Definir e validar contratos de dados (schemas)
  - [x] Criar schemas (Zod) para `User`, `Session`, `Order`, `OrderItem`, `Address`, `Payment`
  - [x] Definir versão mínima do “schema de domínio” (campo `schemaVersion`) nos JSONs

- [x] Task 2: Habilitar persistência COMMERCE no MOCK-END
  - [x] Adicionar `COMMERCE` na allowlist de diretórios JSON do `MOCK-END`
  - [x] Garantir que `GET` de JSON inexistente retorne 404 (não 500)
  - [x] Criar estrutura básica (seed mínimo / criação lazy) de `COMMERCE/users.json`, `COMMERCE/sessions.json`, `COMMERCE/orders.json` por tenant

- [x] Task 3: Implementar API routes de COMMERCE no N1 (façade)
  - [x] Criar endpoints `POST /api/commerce/[tenant]/auth/login` e `POST /api/commerce/[tenant]/auth/register`
  - [x] Criar endpoints `GET /api/commerce/[tenant]/me`, `POST /api/commerce/[tenant]/logout`
  - [x] Criar endpoints `POST /api/commerce/[tenant]/orders`, `GET /api/commerce/[tenant]/orders`, `GET /api/commerce/[tenant]/orders/[orderId]`
  - [x] Ler/gravar JSON no `MOCK-END` usando `COMMERCE/*.json` e schemas (Task 1)

- [x] Task 4: Implementar stores no N1 (padrão DevDash)
  - [x] Criar `auth-store` (sessão + usuário) chamando apenas `/api/commerce/...`
  - [x] Criar `orders-store` (lista/detalhe/criação) chamando apenas `/api/commerce/...`
  - [x] Componentes e páginas consomem apenas stores (sem fetch direto de domínio) — N/A por enquanto (sem telas de auth/pedidos)

- [x] Task 5: Sessão mock (login/cadastro/minha-conta)
  - [x] Implementar páginas `/{tenant}/login` e `/{tenant}/cadastro` usando `auth-store`
  - [x] Implementar `/{tenant}/minha-conta` (exige sessão, usando `auth-store`)

- [x] Task 6: Checkout mock e criação de pedido
  - [x] Implementar página `/{tenant}/checkout` (endereço + pagamento) usando stores
  - [x] Criar pedido via `orders-store.createOrder()`
  - [x] Implementar `/{tenant}/checkout/sucesso` com `orderId`

- [x] Task 7: Pedidos (lista + detalhe)
  - [x] Implementar `/{tenant}/pedidos` (exige sessão, usando `orders-store`)
  - [x] Implementar `/{tenant}/pedido/[orderId]` (exige sessão, usando `orders-store`)

- [x] Task 8: Layout/UX base nas páginas do MVP
  - [x] Garantir estados de loading/empty/error em todas as telas do MVP
  - [x] Padronizar cards, grids, espaçamentos e CTAs (sem redesign completo ainda)
  - [x] Ajustar navegação do header para incluir entradas de “Conta” e “Pedidos” (quando logado)

# Task Dependencies
- Task 3 depende de Task 1 e Task 2
- Task 4 depende de Task 3
- Task 5–7 dependem de Task 4
- Task 8 depende de Task 5–7
