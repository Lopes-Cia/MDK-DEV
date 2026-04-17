# Plano — Proposta completa de endpoints de Checkout (MOCK-END connect) + guia de implementação no front

## Resumo
Objetivo: definir um conjunto **completo, seguro e consistente** de endpoints de **checkout** para o MOCK-END no projeto `connect`, seguindo o padrão já existente em:
- `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs`
- `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/*`
- JSONs em `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/*.json`

Inclui também um **guia do 2º estágio (front / connect-ecommerce)** para consumir o checkout via BFF Next (`app/api/*`) + stores.

Decisões confirmadas:
- Origem do checkout: **carrinho persistido no servidor** (endpoints de carrinho + checkout + pedidos).
- Auth (mock): **auth.mode = "none"** (identificação por `clienteId` / `checkoutId`).
- Pagamento v1: **Pix apenas**.

## Estado atual (grounded)
### MOCK-END / connect
- Rotas existentes em [routes.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs).
- Implementados hoje: catálogo (produtos/categorias/brands), home, clientes (login/cadastro + dados/privacidade/endereços).
- Não existe hoje: carrinho/checkout/frete/pagamento/pedidos no `connect`.

### connect-ecommerce (referência de front)
- Existe UI de checkout em:
  - [checkout/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/checkout/page.tsx)
  - [checkout/_components/CheckoutForm.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/checkout/_components/CheckoutForm.tsx)
- Hoje o checkout é “mockado no client”: [pedidos-store.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/stores/pedidos-store.ts) só gera `PedidoDraft` (sem chamar API).
- Carrinho atual é client-only (localStorage) em [CartContext.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/contexts/CartContext.tsx).

## Objetivo e critérios de sucesso
- Ter um “contrato de checkout” completo no MOCK-END: carrinho → simulação/seleção de frete → geração pix → finalização do pedido → consulta de pedido/histórico.
- Persistência real em JSON (crítico): dados sobreviverem restart do MOCK-END.
- Chaves do JSON **estáveis, sem ambiguidade**, e preparadas para evoluir (cartão/dinheiro no futuro sem quebrar).
- Resposta e erros previsíveis: `success: true/false`, status HTTP coerente, `error` com códigos curtos.

## Escopo (v1)
### Dentro
- Carrinho (CRUD itens + cupom).
- Checkout (sessão gerada a partir do carrinho do cliente, com snapshot).
- Frete (simular e selecionar opção).
- Pagamento (Pix: gerar payload e marcar status).
- Pedido (finalizar e consultar).
- Persistência: 1 arquivo JSON base do domínio de checkout (ver “Dados”).

### Fora (v1)
- Token real/autorização robusta.
- Gateway real de pagamento, webhooks, antifraude, split, conciliação.
- Regras fiscais (NFe), estoque transacional, reserva real.

## Contratos e padrões obrigatórios (herdados do projeto)
- Rotas: shape `{ method, uri, auth{mode,label}, execution{mode}, handler_class, handler_function }`.
- execution.mode: `mock`.
- Handler: `PROJETOS/connect/handlers/mock/api/<arquivo>.mjs` com `export const handlers = { ... }`.
- JSON: em `PROJETOS/connect/handlers/mock/`.
- Separação de responsabilidades:
  - Controller: leitura/cache/escrita e regras de domínio.
  - Handler: HTTP (status, validação mínima, response).

## Proposta de dados (JSON) — crítico
### Atualização (v2): persistência file-per-id (recomendado)
O storage do checkout foi evoluído para **file-per-id** para evitar um JSON transacional gigante.

Desenho IA-friendly do layout:
- [MOCK-CHECKOUT-STORAGE-V2.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/MOCK-CHECKOUT-STORAGE-V2.md)

### Arquivo de configuração (checkout.json)
`checkout.json` vira **apenas config de regras** + `seq` (nada transacional):
- `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/checkout.json`

Shape mínimo:
```json
{
  "meta": { "version": 2, "updatedAt": "2026-01-01T00:00:00.000Z" },
  "seq": { "carrinhoId": 1, "itemId": 1, "checkoutId": 1, "pedidoId": 1, "pagamentoId": 1 },
  "config": {
    "moeda": "BRL",
    "frete": { "opcoes": [] },
    "cupons": [],
    "pagamentos": { "metodos": ["pix"] }
  }
}
```

### Storage transacional (CHECKOUT/)
Dados de carrinho/checkout/pedido passam a ficar em:
- `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/CHECKOUT/`

Regras resumidas:
- 1 carrinho por cliente: `CHECKOUT/<clienteId>/carrinho.json`
- checkout + pedido no mesmo arquivo por fluxo: `CHECKOUT/<clienteId>/transacoes/<checkoutId>.json`
- index global para lookup rápido por id: `CHECKOUT/_index.json`

### Entidades e chaves (definição assertiva)
#### Carrinho (arquivo `CHECKOUT/<clienteId>/carrinho.json`)
- `carrinhoId` (number)
- `clienteId` (number) — chave de particionamento principal
- `status` (string): `aberto` | `fechado` (v1 usa `aberto`)
- `itens` (array de `CarrinhoItem`)
- `cupom` (objeto ou null)
- `resumo` (objeto): `subtotal`, `desconto`, `frete`, `total`, `totalItens`, `moeda`
- `createdAt` / `updatedAt` (ISO)

#### Item do carrinho (`itens[]`)
- `itemId` (number)
- `produtoId` (number) — referencia ao `produtos.json` (`id`)
- `sku` (string, opcional) — se existir no produto
- `slug` (string, opcional) — se existir no produto
- `nome` (string)
- `imagemUrl` (string, opcional)
- `precoUnitario` (number)
- `quantidade` (number, inteiro >= 1)
- `subtotal` (number) — `precoUnitario * quantidade` (derivado, mas persistido para debug/mock)
- `addedAt` (ISO)

#### Cupom (`cupom`)
- `codigo` (string)
- `tipo` (string): `percent` | `fixed`
- `valor` (number) — percentual (0–100) ou valor fixo em moeda
- `mensagem` (string, opcional)

#### Checkout (dentro de `CHECKOUT/<clienteId>/transacoes/<checkoutId>.json`)
Checkout é um “snapshot” do carrinho + seleções (endereço/frete/pagamento) persistido no arquivo de transação.
- `checkoutId` (number)
- `clienteId` (number)
- `carrinhoId` (number)
- `snapshot` (objeto): `itens`, `cupom`, `resumoBase` (subtotal/desconto antes do frete)
- `contato` (objeto): `nome`, `email`, `telefone`
- `entrega` (objeto):
  - `endereco` (objeto): `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `pais`, `referencia`
  - `freteSelecionado` (objeto ou null): `codigo`, `nome`, `preco`, `prazoDias`
- `pagamento` (objeto ou null):
  - `metodo` (string): `pix`
  - `pix` (objeto ou null): `copiaECola`, `qrCodeBase64`, `expiresAt`
  - `status` (string): `pendente` | `pago` | `expirado`
- `resumoFinal` (objeto): `subtotal`, `desconto`, `frete`, `total`, `moeda`
- `status` (string): `aberto` | `aguardando_pagamento` | `finalizado` | `cancelado`
- `createdAt` / `updatedAt` (ISO)

#### Pedido (dentro do mesmo arquivo de transação)
- `pedidoId` (number)
- `checkoutId` (number)
- `clienteId` (number)
- `itens` (array snapshot final)
- `entrega` (endereço + frete selecionado)
- `pagamento` (snapshot do pagamento pix)
- `resumo` (objeto final)
- `status` (string): `criado` | `pago` | `cancelado` (v1: `criado`/`pago`)
- `createdAt` (ISO)

## Proposta de endpoints (MOCK-END / connect)
Base: `/Servidor/webservice/integration/`

Padrão:
- `auth.mode`: `"none"` para todos os endpoints de checkout/carrinho/pedidos (v1).
- `execution.mode`: `"mock"`.
- Novo handler único do domínio: `handler_class: "api/checkout"` (um arquivo), com controller `CheckoutController.mjs`.

### 1) Carrinho
1. `GET /Servidor/webservice/integration/carrinho/:clienteId`
   - 200 `{ success:true, data: Carrinho }`
   - 404 `{ error:"cart_not_found" }` (opcional; alternativa: criar vazio automaticamente)

2. `POST /Servidor/webservice/integration/carrinho/itens`
   - Body: `{ clienteId, item: { produtoId, quantidade } }`
   - 201 `{ success:true, data: Carrinho }`
   - 400 `{ error:"invalid_payload" }`
   - 404 `{ error:"product_not_found" }`

3. `PUT /Servidor/webservice/integration/carrinho/itens/:itemId`
   - Body: `{ clienteId, patch: { quantidade } }`
   - 200 `{ success:true, data: Carrinho }`
   - 400/404 conforme validação

4. `DELETE /Servidor/webservice/integration/carrinho/itens/:itemId`
   - Body: `{ clienteId }`
   - 200 `{ success:true, data: Carrinho }`

5. `POST /Servidor/webservice/integration/carrinho/cupom`
   - Body: `{ clienteId, codigo }`
   - 200 `{ success:true, data: Carrinho }`
   - 404 `{ error:"cupom_not_found" }`

6. `DELETE /Servidor/webservice/integration/carrinho/cupom`
   - Body: `{ clienteId }`
   - 200 `{ success:true, data: Carrinho }`

### 2) Checkout (sessões)
7. `POST /Servidor/webservice/integration/checkout/sessoes`
   - Body: `{ clienteId, contato?, enderecoEntrega? }`
   - Regra: cria checkout a partir do carrinho atual do `clienteId` (snapshot)
   - 201 `{ success:true, data: Checkout }`
   - 409 `{ error:"empty_cart" }`

8. `GET /Servidor/webservice/integration/checkout/sessoes/:checkoutId`
   - 200 `{ success:true, data: Checkout }`
   - 404 `{ error:"checkout_not_found" }`

9. `PUT /Servidor/webservice/integration/checkout/sessoes/:checkoutId/contato`
   - Body: `{ patch: { nome?, email?, telefone? } }`
   - 200 `{ success:true, data: Checkout }`

10. `PUT /Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/endereco`
   - Body: `{ endereco: { cep, logradouro, numero, complemento?, bairro, cidade, uf, pais?, referencia? } }`
   - 200 `{ success:true, data: Checkout }`

11. `GET /Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/frete/opcoes`
   - Query: `cep` opcional (se não vier, usa endereço do checkout)
   - 200 `{ success:true, data: { opcoes: FreteOpcao[] } }`
   - 409 `{ error:"missing_delivery_address" }`

12. `PUT /Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/frete`
   - Body: `{ codigo }`
   - 200 `{ success:true, data: Checkout }`
   - 404 `{ error:"frete_option_not_found" }`

### 3) Pagamento (Pix)
13. `POST /Servidor/webservice/integration/checkout/sessoes/:checkoutId/pagamento/pix`
   - Body: `{}` (ou `{ ttlMinutos? }`)
   - 200 `{ success:true, data: { pagamento: { metodo:"pix", pix:{...}, status:"pendente" } } }`
   - 409 `{ error:"missing_delivery_or_freight" }`

14. `POST /Servidor/webservice/integration/checkout/sessoes/:checkoutId/pagamento/pix/confirmar`
   - Simula confirmação do Pix (para avançar fluxo no front)
   - 200 `{ success:true, data: Checkout }`

### 4) Finalização e pedidos
15. `POST /Servidor/webservice/integration/checkout/sessoes/:checkoutId/finalizar`
   - 201 `{ success:true, data: { pedidoId, status } }`
   - 409 `{ error:"payment_pending" }` (se pix não confirmado)

16. `GET /Servidor/webservice/integration/pedidos/:pedidoId`
   - 200 `{ success:true, data: Pedido }`
   - 404 `{ error:"pedido_not_found" }`

17. `GET /Servidor/webservice/integration/pedidos`
   - Query: `clienteId`, `page`, `pageSize`
   - 200 `{ success:true, data: Pedido[], page, pageSize, total, totalPages }`

## Implementação no MOCK-END (arquitetura proposta)
### Arquivos a criar/alterar
- Alterar:
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs` (adicionar rotas acima)
- Criar:
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/checkout.json` (config-only)
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/CHECKOUT/_index.json`
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/CheckoutStorage.mjs`
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/CheckoutController.mjs`
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs`

### Regras de persistência (críticas)
- Persistência v2 (file-per-id):
  - `checkout.json` armazena apenas `meta/seq/config` (sem dados transacionais).
  - Dados transacionais são gravados em `handlers/mock/CHECKOUT/`:
    - carrinho: `CHECKOUT/<clienteId>/carrinho.json`
    - transação: `CHECKOUT/<clienteId>/transacoes/<checkoutId>.json` (checkout + pedido)
    - index global: `CHECKOUT/_index.json` para resolver `checkoutId`/`pedidoId`.
- Controller deve usar um módulo dedicado (ex.: `CheckoutStorage.mjs`) para:
  - resolver paths com segurança;
  - escrita atômica (`writeJsonAtomic`) e lock por arquivo (`withFileLock`) quando aplicável;
  - manter `_index.json` atualizado.
- Computar `resumo` de carrinho/checkout sempre no controller:
  - subtotal = soma itens
  - desconto = cupom aplicado
  - frete = opção selecionada
  - total = subtotal - desconto + frete

### Regras de validação e erros
Padronizar respostas de erro do checkout em:
- Status 400: `{ error: "invalid_payload" }`
- Status 404: `{ error: "<recurso>_not_found" }`
- Status 409: `{ error: "<conflito>" }`
- Status 500: `{ error: "internal_error" }`

Padronizar sucesso em:
- `{ success: true, data: ... }`

## Guia do 2º estágio: implementação no front (connect-ecommerce)
Objetivo: UI (checkout/cart) → store → BFF Next (`/api/*`) → `lib/integration/*` → MOCK-END.

### 2.1 BFF (Next) — novos endpoints internos
Criar rotas em `WWW/REFERENCIAS/connect-ecommerce/app/api/` (padrão já usado em clientes/produtos):
- `/api/carrinho/[clienteId]` (GET)
- `/api/carrinho/itens` (POST)
- `/api/carrinho/itens/[itemId]` (PUT/DELETE)
- `/api/carrinho/cupom` (POST/DELETE)
- `/api/checkout/sessoes` (POST)
- `/api/checkout/sessoes/[checkoutId]` (GET)
- `/api/checkout/sessoes/[checkoutId]/contato` (PUT)
- `/api/checkout/sessoes/[checkoutId]/entrega/endereco` (PUT)
- `/api/checkout/sessoes/[checkoutId]/entrega/frete/opcoes` (GET)
- `/api/checkout/sessoes/[checkoutId]/entrega/frete` (PUT)
- `/api/checkout/sessoes/[checkoutId]/pagamento/pix` (POST)
- `/api/checkout/sessoes/[checkoutId]/pagamento/pix/confirmar` (POST)
- `/api/checkout/sessoes/[checkoutId]/finalizar` (POST)
- `/api/pedidos` (GET)
- `/api/pedidos/[pedidoId]` (GET)

### 2.2 Integração server-only
Criar `WWW/REFERENCIAS/connect-ecommerce/lib/integration/checkoutService.ts` com funções:
- `getCarrinho(clienteId)`
- `addCarrinhoItem({ clienteId, produtoId, quantidade })`
- `updateCarrinhoItem(itemId, { clienteId, quantidade })`
- `deleteCarrinhoItem(itemId, { clienteId })`
- `applyCupom({ clienteId, codigo })`
- `removeCupom({ clienteId })`
- `createCheckoutSessao({ clienteId, contato?, enderecoEntrega? })`
- `getCheckoutSessao(checkoutId)`
- `updateCheckoutContato(checkoutId, patch)`
- `setCheckoutEndereco(checkoutId, endereco)`
- `listFreteOpcoes(checkoutId, cep?)`
- `setFreteSelecionado(checkoutId, codigo)`
- `createPix(checkoutId, ttlMinutos?)`
- `confirmPix(checkoutId)`
- `finalizarCheckout(checkoutId)`
- `listPedidos({ clienteId, page, pageSize })`
- `getPedido(pedidoId)`

### 2.3 Stores (Zustand) — wiring seguro
#### Carrinho
Como o carrinho hoje é client-only (CartContext), há duas opções:
- Recomendação: criar `stores/carrinho-store.ts` e gradualmente migrar o UI para usar server cart.
- Estratégia de baixo risco (passo a passo):
  1) Criar `carrinho-store` que carrega carrinho do servidor quando `isLoggedIn` e `clienteId` existirem.
  2) No checkout, ao abrir a página, sincronizar itens do CartContext para o servidor (somente 1 vez por sessão), e então usar o carrinho do servidor como fonte.
  3) Em uma etapa posterior, migrar o CartContext para consumir o `carrinho-store` e parar de persistir localmente.

#### Pedidos/Checkout
Atualizar [pedidos-store.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/stores/pedidos-store.ts):
- substituir `submitCheckout()` (que hoje gera draft) por um fluxo real:
  - `createCheckoutSessao(clienteId)` → `setCheckoutEndereco`/`listFreteOpcoes`/`setFreteSelecionado` → `createPix` → `confirmPix` → `finalizarCheckout`
- manter `checkoutStatus/checkoutError` e produzir `lastDraft` como `Pedido` real (do servidor), não mais “draft” client-only.

Registrar o novo store (se criado) em [control-store.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/stores/control-store.ts).

### 2.4 UI (páginas) — mudanças mínimas esperadas
- `checkout/_components/CheckoutForm.tsx`:
  - no `onConfirm()`, trocar para chamar o fluxo do store (que chama BFF).
  - exibir retorno do `pedidoId` e dados do pix.
- `cliente/meus-pedidos/page.tsx`:
  - trocar `lastDraft` (draft) por histórico real via `/api/pedidos?clienteId=...` (store).

## Plano de execução (seguro e incremental) + validação
1) Congelar contratos: confirmar endpoints + payloads + códigos de erro + status esperados (este documento vira base do spec).
   - Validação: checklist de consistência das chaves e coerência do fluxo carrinho→checkout→pedido.
2) Implementar no MOCK-END (connect):
   - `routes.mjs` + `checkout.mjs` + `CheckoutController.mjs` + `checkout.json`.
   - Validação: reiniciar MOCK-END e executar chamadas manuais (GET/POST/PUT/DELETE) garantindo persistência em JSON.
3) Implementar BFF no Next:
   - rotas `app/api/*` novas, chamando `checkoutService.ts`.
   - Validação: cada rota BFF retorna status e shape esperado; erro de integração vira JSON consistente.
4) Implementar stores:
   - `carrinho-store` (se adotado) e update `pedidos-store`.
   - Validação: estado reativo atualiza UI (loading/error/success) sem quebrar fluxo atual de login.
5) Wiring no UI do checkout:
   - alterar apenas o necessário (botão finalizar), mantendo layout.
   - Validação: finalizar pedido gera `pedidoId` e exibe pix.
6) Protocolo de teste pós-implementação (artefatos):
   - Criar `WWW/MICROSERVICE/MOCK-END/TEST/checkout-connect-v1/` e salvar evidências por endpoint + `relatorio-final.md` (mesmo padrão do MOCK-END-MODELO-ROTA).

## Riscos e mitigação
- Risco: divergência de chaves entre cart/checkout/pedido.
  - Mitigação: storage v2 (transação única por checkout) + index global + controller central calculando resumo.
- Risco: front manter cart local e servidor fora de sync.
  - Mitigação: etapa de “sync no checkout” e migração gradual para store do carrinho.
- Risco: crescer escopo (cartão, estoque, antifraude).
  - Mitigação: v1 Pix-only, contratos preparados para evoluir sem implementar agora.
