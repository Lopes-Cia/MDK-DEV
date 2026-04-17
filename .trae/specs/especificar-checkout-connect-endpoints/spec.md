# Checkout Connect (MOCK-END + FRONT) Spec

## Why
Checkout é a área mais crítica do e-commerce e hoje não existe contrato completo no `connect` para carrinho, frete, pagamento e pedido. Precisamos de uma especificação IA-friendly, segura e incremental para guiar implementação sem ambiguidades.

## Escopo Oficial
- Back-end mock alvo: `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect`.
- Front/BFF alvo (2º estágio): `WWW/REFERENCIAS/connect-ecommerce`.
- Referências de padrão:
  - `IA/DESENHOS/MOCK-END-MODELO-ROTA.md`
  - `IA/DESENHOS/MOCK-CLIENTES.md`
  - `.trae/documents/plan-checkout-endpoints-connect.md`
- Esta spec cobre contrato, trilhas de execução e validação; não cobre gateway real de pagamento.

## Decisões Congeladas
- Origem do checkout: carrinho persistido no servidor.
- Autenticação mock v1: `auth.mode = "none"`.
- Pagamento v1: Pix apenas.
- Persistência de checkout: **file-per-id** em `handlers/mock/CHECKOUT/` com index global; `checkout.json` fica apenas com config/seq.

## What Changes
- Definir endpoints completos no MOCK-END para:
  - carrinho: obter, adicionar item, editar item, remover item, aplicar/remover cupom;
  - checkout: criar sessão, consultar sessão, atualizar contato/endereço, frete opções/seleção;
  - pagamento: gerar Pix e confirmar Pix;
  - pedidos: finalizar checkout, consultar pedido e listar pedidos por cliente.
- Definir layout de persistência do checkout (storage v2) e chaves assertivas por arquivo/pasta.
- Definir trilha do 2º estágio no front: BFF Next + `checkoutService` + stores + wiring de UI.

## Impact
- Affected code (MOCK-END):
  - `PROJETOS/connect/routes.mjs`
  - `PROJETOS/connect/handlers/mock/api/checkout.mjs`
  - `PROJETOS/connect/handlers/mock/api/CheckoutController.mjs`
  - `PROJETOS/connect/handlers/mock/checkout.json` (config-only)
  - `PROJETOS/connect/handlers/mock/CHECKOUT/_index.json`
  - `PROJETOS/connect/handlers/mock/api/CheckoutStorage.mjs`
- Affected code (FRONT/BFF):
  - `app/api/carrinho/*`
  - `app/api/checkout/*`
  - `app/api/pedidos/*`
  - `lib/integration/checkoutService.ts`
  - `stores/pedidos-store.ts` (+ opcional `stores/carrinho-store.ts`)
  - `app/(shop)/checkout/_components/CheckoutForm.tsx`
  - `app/(shop)/cliente/meus-pedidos/page.tsx`

## ADDED Requirements
### Requirement: Padrão de rota do connect
O sistema SHALL criar rotas de checkout no `routes.mjs` usando o mesmo contrato atual: `method`, `uri`, `auth`, `execution`, `handler_class`, `handler_function`.

#### Scenario: Success case
- **WHEN** uma rota de checkout for adicionada
- **THEN** `execution.mode` é `"mock"`
- **AND** `handler_class` aponta para `api/checkout`
- **AND** `handler_function` existe em `handlers` do arquivo `checkout.mjs`

### Requirement: Persistência unificada do domínio checkout
O sistema SHALL persistir dados transacionais do checkout em **file-per-id**, usando `handlers/mock/CHECKOUT/` e um index global, mantendo `checkout.json` apenas com config e contadores.

#### Scenario: Success case
- **WHEN** ocorrer qualquer mutação de carrinho/checkout/pedido
- **THEN** o controller atualiza os arquivos do storage v2 (`CHECKOUT/<clienteId>/*`)
- **AND** atualiza `CHECKOUT/_index.json` para lookup por `checkoutId`/`pedidoId`
- **AND** mantém `checkout.json` com `meta`, `seq`, `config` (sem dados transacionais)

#### Scenario: Layout reference
- **WHEN** precisar consultar a estrutura de persistência
- **THEN** seguir o desenho: `IA/DESENHOS/MOCK-CHECKOUT-STORAGE-V2.md`

### Requirement: Carrinho por cliente com resumo consistente
O sistema SHALL manter um carrinho ativo por `clienteId`, com itens, cupom e resumo calculado.

#### Scenario: Success case
- **WHEN** item é adicionado/atualizado/removido ou cupom aplicado/removido
- **THEN** o carrinho retorna com `resumo` recalculado (`subtotal`, `desconto`, `frete`, `total`, `totalItens`)

### Requirement: Checkout como snapshot do carrinho
O sistema SHALL criar sessão de checkout a partir do carrinho ativo, copiando snapshot de itens/cupom para evitar inconsistência posterior.

#### Scenario: Success case
- **WHEN** `POST /checkout/sessoes` for chamado com carrinho válido
- **THEN** é criado `checkoutId` com `snapshot` + `contato/entrega/pagamento` inicial
- **AND** retorno é `201 { success:true, data: checkout }`

### Requirement: Frete obrigatório antes do pagamento
O sistema SHALL exigir endereço e frete selecionado antes de gerar Pix.

#### Scenario: Success case
- **WHEN** tentar gerar Pix sem endereço ou sem frete
- **THEN** retorna `409 { error: "missing_delivery_or_freight" }`

### Requirement: Pagamento Pix v1
O sistema SHALL suportar geração de payload Pix e confirmação mock para avançar o fluxo.

#### Scenario: Success case
- **WHEN** `POST /pagamento/pix` for chamado com checkout válido
- **THEN** retorna dados Pix (`copiaECola`, `qrCodeBase64`, `expiresAt`) com status `pendente`
- **WHEN** `POST /pagamento/pix/confirmar` for chamado
- **THEN** o checkout passa para status de pagamento confirmado

### Requirement: Finalização de pedido condicionada ao pagamento
O sistema SHALL bloquear finalização enquanto pagamento estiver pendente.

#### Scenario: Success case
- **WHEN** `POST /finalizar` for chamado com Pix pendente
- **THEN** retorna `409 { error: "payment_pending" }`
- **WHEN** Pix estiver confirmado
- **THEN** cria `pedidoId` e retorna `201`

### Requirement: Contrato de resposta e erros padronizado
O sistema SHALL padronizar sucesso como `{ success: true, data }` e erros com `{ error: "<codigo>" }`.

#### Scenario: Success case
- **WHEN** qualquer endpoint de checkout responder
- **THEN** status HTTP e corpo seguem padrão acordado (400/404/409/500)

### Requirement: Trilha FRONT separada e orientada a store
O front SHALL consumir checkout via store + BFF, sem lógica de domínio direto no componente.

#### Scenario: Success case
- **WHEN** checkout for finalizado na UI
- **THEN** componente chama ação do store
- **AND** store usa `/api/checkout/*` e `/api/pedidos/*`
- **AND** UI reflete `loading/error/success`

## MODIFIED Requirements
### Requirement: Fluxo atual de pedidos no front
O fluxo atual de `pedidos-store` SHALL deixar de produzir apenas `PedidoDraft` local e passar a consumir pedido real do servidor.

## REMOVED Requirements
- N/A
