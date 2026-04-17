# Plano — Refatorar storage do checkout (file-per-id) + injeção no plano principal

## Resumo
Você quer refatorar o storage do checkout para evitar um `checkout.json` gigante e, em vez disso, persistir por **pastas/arquivos por id**. A ideia central é:
- criar a pasta `handlers/mock/CHECKOUT/`;
- organizar dados por `clienteId` e por “tipo” (carrinho/checkout/pedido);
- “existência do id” passa a ser checada por presença de arquivo/pasta, evitando busca em arrays enormes;
- manter `handlers/mock/checkout.json` apenas com **configurações de regras de negócio** (ex.: frete, cupons, pagamentos) e metadados/seq (sem dados de compras).

Este plano também prevê criar um **arquivo de desenho** (IA-friendly) para ser referenciado/injetado no documento:
- `.trae/documents/plan-checkout-endpoints-connect.md`

## Estado atual (grounded)
- Storage v2 já está aplicado no projeto:
  - `handlers/mock/checkout.json` é **config-only** (`meta/seq/config`)
  - dados transacionais ficam em `handlers/mock/CHECKOUT/`
  - lookup por id usa `handlers/mock/CHECKOUT/_index.json`
- Runtime atual usa `CheckoutStorage` + layout `CHECKOUT/`:
  - [CheckoutController.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/CheckoutController.mjs)
  - [CheckoutStorage.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/CheckoutStorage.mjs)
- O proxy `/connect/*` agora suporta `:params`, mas isso fica fora do escopo desta refatoração de storage:
  - [proxy.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/routes/proxy.mjs)
- Existe utilitário pronto para escrita atômica e lock em memória:
  - [json-store.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/lib/json-store.mjs#L38-L71)

## Decisões (confirmadas agora)
- Lookup rápido de ids globais: **usar index global** (checkoutId/pedidoId → clienteId).  
- Pasta base: **`CHECKOUT/`** (uppercase).
- `checkout.json` deve ficar com **config de regras de negócio** (frete/cupons/pagamentos) + meta/seq (sem carrinhos/checkouts/pedidos).

## Problema a resolver (e o trade-off chave)
### Por que um index global é necessário?
Os endpoints atuais incluem rotas por id **sem `clienteId`**:
- `GET /checkout/sessoes/:checkoutId`
- `GET /pedidos/:pedidoId`

Se os dados ficarem dentro de `CHECKOUT/<clienteId>/...`, para resolver `checkoutId`/`pedidoId` precisaríamos:
- varrer todas as pastas de clientes (lento), ou
- mudar os endpoints (quebra contrato), ou
- manter um index global (escolha recomendada e aprovada).

## Layout proposto (v2) — IA-friendly e consistente
Base:
- `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/CHECKOUT/`

### 1) Arquivos globais (nível raiz)
- `_index.json` (obrigatório)
  - Mapas:
    - `checkoutById: { "<checkoutId>": { "clienteId": <clienteId> } }`
    - `pedidoById: { "<pedidoId>": { "clienteId": <clienteId>, "checkoutId": <checkoutId> } }`
  - Objetivo: resolver rapidamente `checkoutId` e `pedidoId` para localizar a pasta do cliente.

### 2) Dados por cliente
Pasta do cliente:
- `CHECKOUT/<clienteId>/`

#### Carrinho (1 por cliente)
Arquivo único (sem subdir):
- `CHECKOUT/<clienteId>/carrinho.json`

Regra: cliente não mantém múltiplos carrinhos simultâneos. Quando um checkout é finalizado, o carrinho é “consumido” (limpo/apagado).

#### Checkout + Pedido (mitigar fragmentação)
Para reduzir fragmentação, **checkouts e pedidos ficam agrupados** em um mesmo arquivo por checkoutId:
- `CHECKOUT/<clienteId>/transacoes/<checkoutId>.json`

Conteúdo:
- Sempre terá o bloco `checkout` (snapshot, entrega, pagamento, resumo, status).
- Quando finaliza:
  - adiciona bloco `pedido` (com `pedidoId`, status, createdAt, etc).
  - registra `pedidoId` no `_index.json` (pedidoById).

Esse modelo evita gravar 2 arquivos por fluxo (um para checkout e outro para pedido) e mantém lookup por id via `_index.json`.

### 3) checkout.json (fica enxuto e “de regras”)
Manter em:
- `handlers/mock/checkout.json`

Conteúdo permitido:
- `meta` (version/updatedAt)
- `seq` (contadores)
- `config` (frete/cupons/pagamentos/moeda)

Conteúdo removido:
- `carrinhos`, `checkouts`, `pedidos`

## Mudanças necessárias no código (alto nível)
### MOCK-END
Arquivos afetados:
- `PROJETOS/connect/handlers/mock/checkout.json`
  - Remover “dados de compra” e manter apenas config/meta/seq.
- `PROJETOS/connect/handlers/mock/api/CheckoutController.mjs`
  - Trocar o mecanismo de load/save do “state monolítico” por:
    - leitura do `checkout.json` para `seq/config`;
    - leitura/escrita por arquivo do cliente: `carrinho.json` e `transacoes/<checkoutId>.json`;
    - manutenção do `_index.json`.
- (novo) `PROJETOS/connect/handlers/mock/api/CheckoutStorage.mjs` (recomendado)
  - Encapsular:
    - resolve paths (anti-traversal)
    - `readJson`/`writeJsonAtomic` (via `lib/json-store.mjs`)
    - `ensureDir`, `listFiles`, `index load/save`
  - Motivo: separar persistência do domínio (controller fica mais legível).

### Teste pós-implementação
- Atualizar o protocolo em `WWW/MICROSERVICE/MOCK-END/TEST/checkout-connect-v1/run.mjs` se necessário
  - Deve continuar funcionando com os mesmos endpoints, mas agora o backend persiste diferente.
  - Critério: gerar evidências e `relatorio-final.md` “OK”.

## Migração (crítica) — como sair do layout atual sem perder dados
### Estratégia recomendada: migração offline (1x) + fallback temporário
1) Criar script de migração (1x) que:
   - lê `handlers/mock/checkout.json` (layout atual) e separa:
     - move carrinhos/checkouts/pedidos para `CHECKOUT/<clienteId>/...`;
     - cria `_index.json`;
   - reescreve `handlers/mock/checkout.json` apenas com `meta/seq/config`.
2) Durante uma janela curta (opcional):
   - Controller pode ter fallback: se `CHECKOUT/` não existir, usa layout antigo.
   - Após migração concluída e validada, remover fallback para simplificar.

## Plano de execução (3–8 passos) + validação
1) Criar o desenho do layout (arquivo IA-friendly) e injetar link no plano principal
   - Criar: `IA/DESENHOS/MOCK-CHECKOUT-STORAGE-V2.md` (ou equivalente)
   - Atualizar: `.trae/documents/plan-checkout-endpoints-connect.md` para referenciar esse desenho
   - Validação: desenho descreve paths, arquivos, chaves e exemplos mínimos.

2) Implementar `CHECKOUT/` + storage helpers
   - Criar diretórios e arquivos base:
     - `CHECKOUT/_index.json` (vazio com chaves esperadas)
     - `CHECKOUT/<clienteId>/` criado sob demanda
   - Implementar módulo de persistência usando `writeJsonAtomic` e `withFileLock`
   - Validação: escrita atômica + sem traversal.

3) Refatorar `CheckoutController` para usar file-per-id
   - Carrinho: `CHECKOUT/<clienteId>/carrinho.json`
   - Checkout: `CHECKOUT/<clienteId>/transacoes/<checkoutId>.json` (bloco checkout)
   - Pedido: mesmo arquivo transacao, adicionando bloco `pedido`
   - Index: manter `_index.json` atualizado para checkoutId/pedidoId
   - Validação: endpoints atuais continuam respondendo com o mesmo shape (contrato).

4) Migrar dados existentes do layout antigo
   - Criar script `TEST/checkout-connect-v1/migrate.mjs` (ou `scripts/migrate-checkout-storage.mjs`)
   - Executar uma vez e gerar um relatório de migração
   - Validação: `checkout.json` fica enxuto e os arquivos são criados no novo layout.

5) Rodar protocolo de testes do checkout (evidências)
   - Rodar `TEST/checkout-connect-v1/run.mjs`
   - Salvar evidências e atualizar `relatorio-final.md`
   - Critério de aceite: todos os status esperados batem.

## Critérios de aceite (objetivos)
- `checkout.json` contém apenas `meta`, `seq`, `config` (sem carrinhos/checkouts/pedidos).
- `CHECKOUT/` existe e é usado como fonte de verdade para dados transacionais.
- Endpoints existentes continuam funcionando sem alterar contrato.
- Protocolo `TEST/checkout-connect-v1` conclui com `OK`.

## Riscos e mitigação
- Risco: “explosão” de arquivos por cliente.
  - Mitigação: carrinho é 1 arquivo por cliente; checkout+pedido agrupados por transação (`transacoes/<checkoutId>.json`), e checkouts antigos podem ser limpos por política (ex.: manter últimos N).
- Risco: concorrência (read-modify-write) em múltiplos processos.
  - Mitigação: `writeJsonAtomic` + `withFileLock` (observação: lock é por processo; evitar multi-worker).
- Risco: migração parcial deixar dados duplicados.
  - Mitigação: migração offline com relatório + fallback temporário (se necessário) até validar.
