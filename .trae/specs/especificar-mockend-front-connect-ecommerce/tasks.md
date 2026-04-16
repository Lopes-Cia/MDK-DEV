# Tasks

## Bloco A: MOCK-END (connect-ecommerce)
- [ ] Task A1: Mapear contratos atuais de API em `app/api` e confirmar formato padrão de resposta
  - [ ] Inventariar endpoints já existentes de auth/pedidos/produtos no projeto
  - [ ] Definir padrão único de resposta para novos endpoints: `{ success, data, message? }`
  - [ ] Definir erros padronizados mínimos (400, 401, 404, 409, 500)

- [ ] Task A2: Implementar/ajustar endpoints de usuários
  - [ ] Garantir `POST /api/auth/register`
  - [ ] Garantir `POST /api/auth/send-token` e `POST /api/auth/verify-token` para login
  - [ ] Garantir `GET /api/auth/me` e `POST /api/auth/logout`
  - [ ] Adicionar `PUT /api/auth/me` para edição de dados básicos (nome/telefone)

- [ ] Task A3: Implementar fluxo de esqueci senha (mock)
  - [ ] Adicionar `POST /api/auth/forgot-password` (gerar/registrar token com expiração)
  - [ ] Adicionar `POST /api/auth/reset-password` (validar token e redefinir senha)
  - [ ] Garantir invalidação do token após uso

- [ ] Task A4: Implementar endpoints de carrinho e integração com checkout
  - [ ] Adicionar `GET /api/cart`
  - [ ] Adicionar `PUT /api/cart` (substituição simples do carrinho)
  - [ ] (Opcional MVP) Adicionar endpoints por item (`POST/PUT/DELETE /api/cart/items`)
  - [ ] Ajustar criação de pedido no checkout para consumir carrinho atual e limpar após sucesso

- [ ] Task A5: Persistência JSON e integridade
  - [ ] Garantir leitura/escrita dos arquivos de domínio (`users`, `sessions`, `carts`, `orders`, `passwordResets`)
  - [ ] Garantir criação lazy de arquivo quando necessário
  - [ ] Garantir comportamento consistente em arquivo ausente (`404`) e erro inesperado (`500`)

## Bloco B: FRONT (connect-ecommerce)
- [ ] Task B1: Stores e estado global
  - [ ] Evoluir store de autenticação para suportar update de perfil e reset de senha
  - [ ] Criar store de carrinho com `loading/error/data` e ações CRUD mínimas
  - [ ] Ajustar store de pedidos para trabalhar com checkout via carrinho
  - [ ] Registrar stores no `control-store` sem chamadas diretas de domínio em componentes

- [ ] Task B2: Páginas de autenticação
  - [ ] Recriar do zero `login` e `register` no padrão novo (páginas antigas só como referência)
  - [ ] Criar do zero página `esqueci-senha`
  - [ ] Criar do zero página `redefinir-senha`
  - [ ] Exibir feedback de sucesso/erro e loading em todos os submits

- [ ] Task B3: Páginas de conta e pedidos
  - [ ] Criar do zero página estilo `meus-dados` com edição de perfil (dashboard atual apenas referência)
  - [ ] Criar do zero página de `meus-pedidos`
  - [ ] Criar do zero página de detalhe de pedido
  - [ ] Proteger rotas autenticadas com o padrão atual do projeto

- [ ] Task B4: Carrinho e checkout
  - [ ] Criar do zero página de carrinho consumindo `cart-store`
  - [ ] Integrar checkout ao carrinho persistido
  - [ ] Bloquear checkout com carrinho vazio
  - [ ] Limpar carrinho após pedido criado

- [ ] Task B5: Navegação e consistência visual
  - [ ] Garantir ações de login/logout no header
  - [ ] Garantir acesso rápido para conta, carrinho e pedidos
  - [ ] Manter layout/tokens/componentes visuais já adotados no projeto

## Bloco C: Validação manual
- [ ] Task C1: Roteiro funcional completo
  - [ ] Cadastro -> login -> meus dados (editar) -> carrinho -> checkout -> meus pedidos -> logout
  - [ ] Esqueci senha -> redefinir senha -> login com nova senha
  - [ ] Validar estados `loading`, `empty`, `error` nas telas principais

- [ ] Task C2: Verificação de persistência e contratos
  - [ ] Confirmar payloads/respostas dos endpoints conforme contrato definido
  - [ ] Confirmar persistência JSON refletindo operações principais

# Task Dependencies
- A2 depende de A1
- A3 depende de A1
- A4 depende de A1 e A5
- B1 depende de A2, A3 e A4
- B2, B3 e B4 dependem de B1
- B5 depende de B2, B3 e B4
- C1 e C2 dependem de A1-A5 e B1-B5
