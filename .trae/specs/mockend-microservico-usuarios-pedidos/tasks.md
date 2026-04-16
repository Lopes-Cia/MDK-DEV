# Tasks

## Bloco A: Base e contratos
- [x] Task A1: Inventariar endpoints atuais do microserviço
  - [x] Mapear rotas existentes em `routes.mjs` e handlers conectados
  - [x] Confirmar contratos de request/response para auth, cart e orders
  - [x] Definir padrão único de resposta (`success`, `data`, `error/message`)

- [x] Task A2: Validar persistência JSON local do projeto
  - [x] Definir local dos arquivos JSON de domínio (no mesmo padrão de `produtos.json`)
  - [x] Confirmar formato: raiz array (`[]`) com objetos simples e consistentes
  - [x] Definir estratégia de criação lazy (se arquivo não existir, criar `[]` ao gravar)
  - [x] Definir comportamento de erro consistente em arquivo ausente e JSON inválido

- [x] Task A3: Alinhar padrões obrigatórios (rotas, auth, controllers e JSON)
  - [x] Garantir que todas as novas rotas usem prefixo `/Servidor/webservice/integration/` (parte constante)
  - [x] Garantir que todas as novas rotas tenham bloco `auth` (sempre) e `execution: { mode: "mock" }`
  - [x] Garantir padrão de implementação “controller class” (handlers delegam para classe)
  - [x] Definir formato dos JSONs do domínio como raiz array (sem wrapper `schemaVersion`)
  - [x] Definir `ecommerce.json` como configuração global (objeto) e expor endpoint de leitura

## Bloco B: Usuários e autenticação
- [x] Task B1: Cadastro e login por token
  - [x] Adicionar rotas no `routes.mjs` com URIs:
    - [x] `POST /Servidor/webservice/integration/auth/register`
    - [x] `POST /Servidor/webservice/integration/auth/send-token`
    - [x] `POST /Servidor/webservice/integration/auth/verify-token`
    - [x] `GET  /Servidor/webservice/integration/auth/me`
  - [x] Garantir `POST` de cadastro com validação mínima e persistência
  - [x] Garantir envio/verificação de token para login mock
  - [x] Garantir criação de sessão e leitura de sessão atual (`me`)

- [x] Task B2: Logout e atualização de perfil
  - [x] Adicionar rotas no `routes.mjs` com URIs:
    - [x] `POST /Servidor/webservice/integration/auth/logout`
    - [x] `PUT  /Servidor/webservice/integration/auth/me`
  - [x] Garantir endpoint de logout limpando sessão
  - [x] Implementar `PUT` de perfil (nome/telefone) no mock-end
  - [x] Garantir persistência e retorno de usuário atualizado

- [x] Task B3: Privacidade (LGPD)
  - [x] Adicionar rota no `routes.mjs`:
    - [x] `POST /Servidor/webservice/integration/auth/privacy/delete`
  - [x] Implementar exclusão de dados do usuário autenticado (users, sessions, carts, orders, passwordResets)

## Bloco C: Esqueci senha
- [x] Task C1: Solicitação de reset
  - [x] Adicionar rota no `routes.mjs`:
    - [x] `POST /Servidor/webservice/integration/auth/forgot-password`
  - [x] Implementar endpoint para gerar token com expiração
  - [x] Persistir token em `passwordResets.json`
  - [x] Definir comportamento para email inexistente (sem vazar informação sensível)

- [x] Task C2: Redefinição de senha
  - [x] Adicionar rota no `routes.mjs`:
    - [x] `POST /Servidor/webservice/integration/auth/reset-password`
  - [x] Implementar endpoint para consumir token + nova senha
  - [x] Atualizar hash de senha no usuário
  - [x] Marcar token como usado e inválido para novo uso

## Bloco D: Carrinho e pedidos
- [x] Task D1: Endpoints de carrinho
  - [x] Adicionar rotas no `routes.mjs` com URIs:
    - [x] `GET  /Servidor/webservice/integration/cart`
    - [x] `PUT  /Servidor/webservice/integration/cart`
  - [x] Implementar `GET` carrinho por usuário
  - [x] Implementar `PUT` carrinho (substituição simples)
  - [x] (Opcional) Implementar operações por item

- [x] Task D2: Checkout e pedidos
  - [x] Adicionar rotas no `routes.mjs` com URIs:
    - [x] `POST /Servidor/webservice/integration/orders/checkout`
    - [x] `GET  /Servidor/webservice/integration/orders`
    - [x] `GET  /Servidor/webservice/integration/orders/*`
  - [x] Ajustar criação de pedido a partir do carrinho atual
  - [x] Limpar carrinho após criação com sucesso
  - [x] Garantir listagem e detalhe de pedidos por usuário

- [x] Task D3: Configuração global do ecommerce
  - [x] Adicionar rota no `routes.mjs`:
    - [x] `GET  /Servidor/webservice/integration/ecommerce/config`
  - [x] Criar/seed de `ecommerce.json` com: meios de pagamento, pedido mínimo, CEPs atendidos, CPF/CNPJ
  - [x] Implementar controller + handler para retornar a configuração

## Bloco E: Validação manual
- [ ] Task E1: Validar fluxo usuários
  - [ ] Cadastro -> login -> me -> update perfil -> logout
- [ ] Task E2: Validar fluxo senha
  - [ ] Esqueci senha -> reset senha -> login com nova senha
- [ ] Task E3: Validar fluxo compra
  - [ ] Carrinho -> checkout -> pedido criado -> carrinho limpo

# Task Dependencies
- A2 depende de A1
- A3 depende de A1 e A2
- B1 depende de A1 e A2
- B2 depende de B1
- B3 depende de B1
- C1 depende de A1 e A2
- C2 depende de C1
- D1 depende de A1 e A2
- D2 depende de D1
- D3 depende de A1 e A2
- E1 depende de B1 e B2
- E2 depende de C1 e C2
- E3 depende de D1 e D2
