# Plano — Alinhar planos/specs à arquitetura Checkout Storage v2 (CHECKOUT/)

## Resumo
Objetivo: revisar planos, specs e desenhos do checkout e **atualizar tudo o que ficou legado** após a mudança de persistência para o **storage v2 file-per-id** (`handlers/mock/CHECKOUT/`), garantindo que:
- os documentos descrevem a arquitetura real (config-only em `checkout.json` + transacional em `CHECKOUT/` + index global);
- o spec de checkout vira uma fonte confiável para execução;
- o protocolo de validação (TEST) permanece como critério de aceite.

Escopo: documentação + specs + ajustes mínimos de consistência. Sem mudança de contrato de endpoints.

## Estado atual (grounded)
- A arquitetura real do checkout no MOCK-END já usa storage v2:
  - `handlers/mock/checkout.json` como **config/seq/meta**
  - `handlers/mock/CHECKOUT/_index.json` para lookup por `checkoutId`/`pedidoId`
  - `handlers/mock/CHECKOUT/<clienteId>/carrinho.json`
  - `handlers/mock/CHECKOUT/<clienteId>/transacoes/<checkoutId>.json` (checkout + pedido no mesmo arquivo)
- O protocolo `WWW/MICROSERVICE/MOCK-END/TEST/checkout-connect-v1/run.mjs` já valida o fluxo fim-a-fim (carrinho → checkout → frete → pix → finalizar → pedido).
- Existem inconsistências em docs antigos (ex.: ainda descrevem “arquivo único com carrinhos/checkouts/pedidos”).

## Mudanças propostas (decisão-completa)

### 1) Consolidar “fonte de verdade” do layout v2
- Garantir que o desenho [MOCK-CHECKOUT-STORAGE-V2.md] esteja apontado como referência oficial para storage.
- Confirmar/ajustar o shape do `_index.json` para o que foi implementado:
  - `checkoutById["<checkoutId>"] = { clienteId }`
  - `pedidoById["<pedidoId>"] = { clienteId, checkoutId }`

Arquivos:
- `IA/DESENHOS/MOCK-CHECKOUT-STORAGE-V2.md` (ajustes pontuais se necessário)
- `WWW/.../handlers/mock/CHECKOUT/_index.json` (somente se houver divergência de shape)

Validação:
- O desenho bate com os arquivos gerados em runtime em `handlers/mock/CHECKOUT/`.

### 2) Atualizar SPEC de checkout para storage v2 (remover legado)
Atualizar o spec para refletir:
- persistência v2 (file-per-id) em vez de “arquivo único transacional”;
- `checkout.json` como config-only;
- referência explícita ao desenho `MOCK-CHECKOUT-STORAGE-V2.md`;
- tasks/checklist coerentes com os novos artefatos (`CheckoutStorage.mjs`, `CHECKOUT/_index.json`).

Arquivos:
- `.trae/specs/especificar-checkout-connect-endpoints/spec.md`
- `.trae/specs/especificar-checkout-connect-endpoints/tasks.md`
- `.trae/specs/especificar-checkout-connect-endpoints/checklist.md`

Validação:
- Ler os 3 arquivos e checar ausência de instruções conflitantes (ex.: “persistir carrinhos/checkouts/pedidos dentro de checkout.json”).

### 3) Atualizar planos (planos .trae/documents) para remover instruções antigas
Alinhar os planos para não contradizerem a arquitetura:
- `plan-checkout-endpoints-connect.md`:
  - renomear “entidades e chaves” para refletir “Carrinho (arquivo) / Transação (arquivo) / Index (arquivo)”;
  - remover qualquer instrução remanescente de “escrever checkout.json em toda mutação”.
- `plan-refatorar-checkout-storage-por-arquivos.md`:
  - atualizar “Estado atual (grounded)” (já não é arquivo único);
  - ajustar o shape do `_index.json` para o implementado (inclui `checkoutId` em `pedidoById`).

Arquivos:
- `.trae/documents/plan-checkout-endpoints-connect.md`
- `.trae/documents/plan-refatorar-checkout-storage-por-arquivos.md`

Validação:
- Dif manual: trechos que falavam de arrays monolíticos deixam de existir.

### 4) “Rodar” validação oficial após ajustes documentais
Reexecutar o protocolo como critério de aceite final da tarefa de alinhamento (para garantir que docs refletem algo que está funcionando).

Passos:
- Reiniciar MOCK-END (porta 4000).
- Rodar:
  - `node WWW/MICROSERVICE/MOCK-END/TEST/checkout-connect-v1/run.mjs`
- Confirmar que `relatorio-final.md` conclui com “OK”.

Validação:
- `WWW/MICROSERVICE/MOCK-END/TEST/checkout-connect-v1/relatorio-final.md` com todos status esperados.

## Assunções e decisões
- Não vamos alterar contratos de endpoint nem paths públicos.
- A arquitetura oficial passa a ser **Storage v2** (CHECKOUT/ + index global).
- `checkout.json` é tratado como “config-only” (meta/seq/config).

## Critérios de aceite
- SPEC e planos não contêm instruções legadas conflitantes com storage v2.
- Desenho do storage v2 descreve exatamente os arquivos reais.
- Protocolo `checkout-connect-v1` passa (relatório “OK”).

