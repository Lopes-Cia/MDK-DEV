# Tasks

## Bloco A: Base e contratos
- [ ] Task A1: Inventariar endpoints atuais do microserviço
  - [ ] Mapear rotas existentes em `routes.mjs` e handlers conectados
  - [ ] Confirmar contratos de request/response para auth, cart e orders
  - [ ] Definir padrão único de resposta (`success`, `data`, `error/message`)

- [ ] Task A2: Validar persistência JSON por tenant
  - [ ] Confirmar arquivos de domínio: `users`, `sessions`, `carts`, `orders`, `passwordResets`
  - [ ] Garantir criação lazy com seed mínimo quando necessário
  - [ ] Garantir allowlist de paths e proteção contra escrita fora do domínio

## Bloco B: Usuários e autenticação
- [ ] Task B1: Cadastro e login por token
  - [ ] Garantir `POST` de cadastro com validação mínima e persistência
  - [ ] Garantir envio/verificação de token para login mock
  - [ ] Garantir criação de sessão e leitura de sessão atual (`me`)

- [ ] Task B2: Logout e atualização de perfil
  - [ ] Garantir endpoint de logout limpando sessão
  - [ ] Implementar `PUT` de perfil (nome/telefone) no mock-end
  - [ ] Garantir persistência e retorno de usuário atualizado

## Bloco C: Esqueci senha
- [ ] Task C1: Solicitação de reset
  - [ ] Implementar endpoint para gerar token com expiração
  - [ ] Persistir token em `passwordResets.json`
  - [ ] Definir comportamento para email inexistente (sem vazar informação sensível)

- [ ] Task C2: Redefinição de senha
  - [ ] Implementar endpoint para consumir token + nova senha
  - [ ] Atualizar hash de senha no usuário
  - [ ] Marcar token como usado e inválido para novo uso

## Bloco D: Carrinho e pedidos
- [ ] Task D1: Endpoints de carrinho
  - [ ] Implementar `GET` carrinho por usuário
  - [ ] Implementar `PUT` carrinho (substituição simples)
  - [ ] (Opcional) Implementar operações por item

- [ ] Task D2: Checkout e pedidos
  - [ ] Ajustar criação de pedido a partir do carrinho atual
  - [ ] Limpar carrinho após criação com sucesso
  - [ ] Garantir listagem e detalhe de pedidos por usuário

## Bloco E: Validação manual
- [ ] Task E1: Validar fluxo usuários
  - [ ] Cadastro -> login -> me -> update perfil -> logout
- [ ] Task E2: Validar fluxo senha
  - [ ] Esqueci senha -> reset senha -> login com nova senha
- [ ] Task E3: Validar fluxo compra
  - [ ] Carrinho -> checkout -> pedido criado -> carrinho limpo

# Task Dependencies
- A2 depende de A1
- B1 depende de A1 e A2
- B2 depende de B1
- C1 depende de A1 e A2
- C2 depende de C1
- D1 depende de A1 e A2
- D2 depende de D1
- E1 depende de B1 e B2
- E2 depende de C1 e C2
- E3 depende de D1 e D2

