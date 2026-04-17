# Tasks

## Bloco A: MOCK-END (connect)
- [ ] Task A1: Estruturar domínio checkout no mock
  - [ ] Criar `handlers/mock/checkout.json` (config-only) com raiz: `meta`, `seq`, `config`
  - [ ] Criar `handlers/mock/CHECKOUT/_index.json` com `checkoutById` e `pedidoById`
  - [ ] Definir seeds mínimas de `config.frete.opcoes`, `config.cupons` e `config.pagamentos.metodos=["pix"]`
  - [ ] Definir e documentar chaves obrigatórias por entidade

- [ ] Task A2: Implementar controller de checkout com persistência segura
  - [ ] Criar `handlers/mock/api/CheckoutController.mjs`
  - [ ] Criar `handlers/mock/api/CheckoutStorage.mjs` (write atômico + index global + paths)
  - [ ] Implementar leitura de config/seq via `checkout.json` e persistência transacional via `CHECKOUT/`
  - [ ] Implementar geração incremental de IDs via `seq`
  - [ ] Garantir recálculo de resumo (`subtotal`, `desconto`, `frete`, `total`, `totalItens`)

- [ ] Task A3: Implementar handler HTTP de checkout
  - [ ] Criar `handlers/mock/api/checkout.mjs`
  - [ ] Implementar validação de método e payload
  - [ ] Mapear respostas de sucesso e erros no padrão `{ success:true, data }` / `{ error }`
  - [ ] Expor todas as funções em `export const handlers = { ... }`

- [ ] Task A4: Adicionar rotas no `routes.mjs`
  - [ ] Carrinho: GET por `:clienteId`, POST/PUT/DELETE de itens, POST/DELETE cupom
  - [ ] Checkout: criar sessão, obter sessão, atualizar contato/endereço, frete opções/seleção
  - [ ] Pagamento: gerar Pix, confirmar Pix
  - [ ] Pedidos: finalizar checkout, obter pedido por id, listar por cliente
  - [ ] Garantir `auth.mode="none"` e `execution.mode="mock"` em todas

- [ ] Task A5: Validar protocolo pós-implementação do MOCK-END
  - [ ] Criar pasta `WWW/MICROSERVICE/MOCK-END/TEST/checkout-connect-v1/`
  - [ ] Reiniciar MOCK-END na porta 4000
  - [ ] Executar endpoints e salvar respostas/erros por operação
  - [ ] Gerar `relatorio-final.md` com conclusão

## Bloco B: BFF + Integração (connect-ecommerce)
- [ ] Task B1: Criar integração server-only do checkout
  - [ ] Criar `lib/integration/checkoutService.ts` com funções de carrinho/checkout/pix/pedidos
  - [ ] Reaproveitar padrão de `clientesService.ts` (`fetchWithRetry`, `HttpError`, `unwrapData`)

- [ ] Task B2: Criar rotas BFF de checkout/carrinho/pedidos
  - [ ] Implementar `app/api/carrinho/*`
  - [ ] Implementar `app/api/checkout/*`
  - [ ] Implementar `app/api/pedidos/*`
  - [ ] Garantir validação de payload e propagação consistente de erros de integração

## Bloco C: Stores e UI (connect-ecommerce)
- [ ] Task C1: Evoluir store de pedidos para fluxo real
  - [ ] Atualizar `stores/pedidos-store.ts` para orquestrar create sessão -> frete -> pix -> confirmar -> finalizar
  - [ ] Trocar `lastDraft` local por retorno real de pedido
  - [ ] Preservar estados `checkoutStatus`, `checkoutError` e comportamento reativo

- [ ] Task C2: Endereçar estratégia de carrinho no front
  - [ ] (Recomendado) Criar `stores/carrinho-store.ts` para server cart
  - [ ] Definir sincronização inicial CartContext -> servidor ao entrar no checkout
  - [ ] Planejar migração gradual para remover dependência de carrinho local

- [ ] Task C3: Wiring mínimo de UI
  - [ ] Atualizar `app/(shop)/checkout/_components/CheckoutForm.tsx` para acionar fluxo real do store
  - [ ] Atualizar `app/(shop)/cliente/meus-pedidos/page.tsx` para histórico real de pedidos

## Bloco D: Validação funcional
- [ ] Task D1: Fluxo principal de checkout
  - [ ] Login cliente
  - [ ] Criar/atualizar carrinho
  - [ ] Criar sessão de checkout
  - [ ] Definir endereço e frete
  - [ ] Gerar e confirmar Pix
  - [ ] Finalizar pedido e validar `pedidoId`

- [ ] Task D2: Casos de erro críticos
  - [ ] Carrinho vazio ao criar sessão (`409 empty_cart`)
  - [ ] Pix sem endereço/frete (`409 missing_delivery_or_freight`)
  - [ ] Finalizar sem pagamento (`409 payment_pending`)
  - [ ] Recursos inexistentes (`404 *_not_found`)

# Task Dependencies
- A2 depende de A1
- A3 depende de A2
- A4 depende de A3
- A5 depende de A4
- B1 depende de A4
- B2 depende de B1
- C1 depende de B2
- C2 depende de B2
- C3 depende de C1
- D1 e D2 dependem de A1-A5, B1-B2 e C1-C3
