# Tasks

- [x] Task 1: Confirmar base existente e pontos de extensão
  - [x] Revisar specs/implementações já existentes para `COMMERCE` (MVP atual) e listar exatamente o que já existe vs. o que falta (perfil, carrinho, reset senha)
  - [x] Definir paths finais dos JSONs (`users.json`, `sessions.json`, `carts.json`, `orders.json`, `passwordResets.json`) por tenant
  - [x] Definir padrão de resposta `{ success, data, error? }` e códigos HTTP para os novos endpoints

- [x] Task 2: MOCK-END — habilitar escrita CRUD em JSON para COMMERCE
  - [x] Garantir allowlist de diretórios/arquivos COMMERCE para operações de escrita (sem abrir escrita arbitrária no FS)
  - [x] Implementar helpers de persistência (read → validate → write) com escrita segura (ex.: write temp + rename)
  - [x] Implementar operações mínimas: criar/atualizar/remover registros em arrays (por `id`) e salvar JSON
  - [x] Tratar concorrência simples (pelo menos com lock em memória por arquivo, se aplicável) e erros com mensagens estáveis

- [x] Task 3: MOCK-END — suporte a novos arquivos COMMERCE (carrinho e reset de senha)
  - [x] Garantir criação lazy/seed mínimo para `COMMERCE/carts.json` e `COMMERCE/passwordResets.json` por tenant
  - [x] Garantir que `GET` para JSON inexistente responde `404` (não `500`)
  - [x] Garantir que `PUT` cria o arquivo quando não existir (dentro da allowlist)

- [x] Task 4: N1 façade — rotas `/api/commerce/[tenant]/*` para novas capacidades
  - [x] Auth/Me
    - [x] `PUT /me` chamando MOCK-END e atualizando sessão/store
    - [x] `POST /auth/forgot-password` e `POST /auth/reset-password`
  - [x] Cart
    - [x] Implementar rotas de carrinho (GET/PUT) chamando MOCK-END
  - [x] Orders
    - [x] Ajustar `POST /orders` para criar pedido a partir do carrinho e limpar carrinho ao sucesso

- [ ] Task 5: Stores (padrão control-store)
  - [ ] `auth-store`
    - [ ] Adicionar `updateMe()`/`updateProfile()` e ações de reset senha
  - [ ] `cart-store` (NOVO)
    - [ ] Estado: `items`, `totals`, `loading`, `error`
    - [ ] Ações: `loadCart`, `setCart`, `addItem`, `updateQty`, `removeItem`, `clear`
  - [ ] `orders-store`
    - [ ] Ajustar criação de pedido para usar carrinho e expor retorno do `orderId`
  - [ ] Registrar novo store no `control-store` (barrel) e garantir que UI não faz fetch direto de domínio

- [ ] Task 6: Front — páginas novas e ajustes de navegação seguindo layout existente
  - [ ] Auth
    - [ ] Criar/ajustar `/{tenant}/login` e `/{tenant}/cadastro` (se já existirem, apenas alinhar com stores/UX)
    - [ ] Criar `/{tenant}/esqueci-senha` (form email → chama store; exibir token/resultado no ambiente dev)
    - [ ] Criar `/{tenant}/redefinir-senha` (token + nova senha → chama store)
    - [ ] Implementar logout visível no header/conta (quando logado)
  - [ ] Conta
    - [ ] Criar/ajustar `/{tenant}/meus-dados` (ou evoluir `minha-conta`) com edição de nome/telefone
  - [ ] Carrinho/Checkout
    - [ ] Criar `/{tenant}/carrinho` usando `cart-store`
    - [ ] Ajustar `/{tenant}/checkout` para consumir `cart-store` e bloquear checkout com carrinho vazio
  - [ ] Pedidos
    - [ ] Garantir `/{tenant}/pedidos` e `/{tenant}/pedido/[orderId]` funcionais e linkados (se já existirem, apenas ajustar)

- [ ] Task 7: Validação manual guiada (sem testes automáticos)
  - [ ] Roteiro de validação end-to-end: cadastro → login → editar meus dados → carrinho → checkout → meus pedidos → detalhe → logout
  - [ ] Roteiro de reset de senha: esqueci senha → obter token (mock) → redefinir senha → login com nova senha
  - [ ] Verificar persistência: arquivos JSON alteram como esperado por tenant

# Task Dependencies
- Task 3 depende de Task 2
- Task 4 depende de Task 2 e Task 3
- Task 5 depende de Task 4
- Task 6 depende de Task 5
- Task 7 depende de Task 2–6
