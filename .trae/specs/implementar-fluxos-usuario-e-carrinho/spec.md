# Fluxos de Usuário e Carrinho (MVP incremental) Spec

## Why
Hoje o projeto cobre um MVP de autenticação e pedidos, mas ainda faltam fluxos essenciais do usuário (meus dados, esqueci senha) e do pedido (carrinho) para permitir uma experiência de compra completa e consistente. O objetivo é entregar uma versão simples e funcional agora, para refatorar e enriquecer depois.

## What Changes
- Implementar persistência CRUD em JSON no MOCK-END para entidades de COMMERCE (usuários, sessões, carrinho, pedidos e reset de senha).
- Expandir API interna do N1 (façade) em `/api/commerce/[tenant]/*` para suportar:
  - Atualização de dados do usuário autenticado (PUT).
  - Fluxo “esqueci minha senha” (request de token + redefinição).
  - Carrinho (CRUD mínimo) e integração do checkout com o carrinho.
- Criar/ajustar páginas no front seguindo o layout existente:
  - Cadastro, login, meus dados, carrinho, checkout, meus pedidos, logout, esqueci senha.
- Padronizar estados de loading/empty/error e mensagens para os novos fluxos.

## Impact
- Affected specs:
  - Autenticação (sessão/cookies)
  - Usuários (perfil)
  - Carrinho (itens, totais)
  - Checkout (criação de pedido)
  - Pedidos (lista/detalhe)
- Affected code:
  - MOCK-END: rotas e utilitários de persistência JSON para COMMERCE (leitura + escrita)
  - N1: API routes `api/commerce/[tenant]/*`
  - Front (connect-ecommerce): stores (control-store) + páginas de conta/pedidos/carrinho

## Assumptions (para este MVP)
- Persistência é via arquivos JSON por tenant em `COMMERCE/*.json`.
- Sessão é mock (cookie/httpOnly) e identifica o usuário autenticado.
- “Esqueci senha” não envia email/whatsapp de verdade: retorna token (ou registra em JSON) para fluxo funcional em ambiente de desenvolvimento.
- Checkout não integra gateway/pagamento real; apenas registra dados básicos e gera pedido.

## Out of Scope (por enquanto)
- Recuperação de senha via provedor externo (email/SMS), templates e filas.
- Cartão/PIX com validações completas e antifraude.
- Políticas avançadas de estoque, frete, cupons, split de pagamento.
- Páginas institucionais/footer/contato (podem virar um spec separado).

## Data Model (JSON)
### Arquivos por tenant
- `COMMERCE/users.json`
- `COMMERCE/sessions.json`
- `COMMERCE/carts.json`
- `COMMERCE/orders.json`
- `COMMERCE/passwordResets.json`

### Entities (campos mínimos)
- User
  - `id` (string)
  - `email` (string)
  - `name` (string)
  - `phone?` (string)
  - `passwordHash` (string)
  - `createdAt`, `updatedAt` (ISO string)
- Session
  - `id` (string)
  - `userId` (string)
  - `createdAt`, `expiresAt` (ISO string)
- Cart
  - `id` (string) (pode ser igual ao `userId` no MVP)
  - `userId` (string)
  - `items`: array de `{ productId, sku?, name, unitPrice, qty }`
  - `totals`: `{ subtotal, shipping, discount, total }`
  - `updatedAt` (ISO string)
- Order
  - `id` (string)
  - `userId` (string)
  - `items` (espelha o carrinho no momento do checkout)
  - `address` (shape mínimo)
  - `payment` (shape mínimo; “mock”)
  - `status` (ex.: `created|paid|shipped|canceled` — no MVP pode ficar em `created`)
  - `createdAt`
- PasswordReset
  - `id` (string)
  - `userId` (string)
  - `token` (string)
  - `expiresAt` (ISO string)
  - `usedAt?` (ISO string)

## API Contract (alto nível)
### N1 façade (recomendado para o front)
Base: `/api/commerce/[tenant]`

#### Auth/Usuário
- `POST /auth/register`
- `POST /auth/login`
- `POST /logout`
- `GET /me`
- `PUT /me` (NOVO)
- `POST /auth/forgot-password` (NOVO)
- `POST /auth/reset-password` (NOVO)

#### Carrinho
- `GET /cart` (NOVO)
- `PUT /cart` (NOVO) — substitui carrinho inteiro (simplifica)
- `POST /cart/items` (NOVO) — adiciona item (opcional, mas melhora UX)
- `PUT /cart/items/:productId` (NOVO) — atualiza qty (opcional)
- `DELETE /cart/items/:productId` (NOVO) — remove item (opcional)
- `DELETE /cart` (NOVO) — limpa carrinho (opcional)

#### Pedidos
- `POST /orders` (existente; no MVP2 deve aceitar criação “a partir do carrinho”)
- `GET /orders`
- `GET /orders/[orderId]`

### MOCK-END (persistência COMMERCE)
- O MOCK-END SHALL suportar escrita de JSON (read-modify-write) em arquivos allowlisted de `COMMERCE/`, com validação mínima e respostas padronizadas.

## ADDED Requirements
### Requirement: Atualização de perfil (“Meus dados”)
O sistema SHALL permitir que um usuário autenticado atualize seus dados básicos (ex.: nome/telefone) via API e UI.

#### Scenario: Success case
- **WHEN** o usuário autenticado salva “Meus dados”
- **THEN** a API retorna o usuário atualizado
- **AND** os dados persistem no JSON de usuários do tenant

### Requirement: Esqueci senha (token + redefinição)
O sistema SHALL oferecer um fluxo funcional de redefinição de senha via token (mock), com expiração.

#### Scenario: Success case
- **WHEN** o usuário informa email em “Esqueci senha”
- **THEN** a API cria um reset token (com expiração) associado ao usuário
- **AND** a UI exibe instrução/resultado para prosseguir no ambiente de dev
- **WHEN** o usuário envia token + nova senha
- **THEN** a senha do usuário é atualizada e o token é marcado como usado

### Requirement: Carrinho persistente por usuário
O sistema SHALL manter um carrinho por usuário autenticado, persistido em JSON, com operações mínimas de leitura/atualização.

#### Scenario: Success case
- **WHEN** o usuário acessa “Carrinho”
- **THEN** a UI carrega e mostra os itens (ou estado vazio)
- **WHEN** o usuário altera a quantidade ou remove itens
- **THEN** a API persiste o novo carrinho

### Requirement: Checkout cria pedido a partir do carrinho
O sistema SHALL criar um pedido a partir do carrinho atual do usuário durante o checkout e, ao finalizar, limpar o carrinho.

#### Scenario: Success case
- **WHEN** o usuário finaliza o checkout com carrinho não vazio
- **THEN** um `Order` é criado e persistido
- **AND** o carrinho é limpo
- **AND** a UI redireciona para sucesso/detalhe do pedido

## MODIFIED Requirements
### Requirement: Criação de pedido (`POST /orders`)
O endpoint de criação de pedido SHALL aceitar origem “cart” (implicitamente ou via flag) e validar que há itens.

## REMOVED Requirements
N/A

