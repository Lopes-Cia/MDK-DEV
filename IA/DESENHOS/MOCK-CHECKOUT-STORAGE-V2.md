# MOCK-CHECKOUT-STORAGE-V2 — Layout de Persistência (file-per-id)

Este desenho define o layout de persistência do domínio **Checkout** para o projeto:
- `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect`

Objetivo:
- remover “arrays gigantes” de `checkout.json`;
- persistir dados transacionais por arquivo/pasta (file-per-id);
- permitir checagem de existência por id via arquivo/pasta;
- manter `checkout.json` apenas com **configurações de negócio** e sequências.

## Diretório base

Pasta de dados:
- `PROJETOS/connect/handlers/mock/CHECKOUT/`

## Arquivos globais

### 1) Index global (obrigatório)
Arquivo:
- `CHECKOUT/_index.json`

Responsabilidade:
- resolver rapidamente `checkoutId` e `pedidoId` para um `clienteId` (sem varrer todas as pastas).

Shape recomendado:
```json
{
  "checkoutById": {
    "1": { "clienteId": 999 }
  },
  "pedidoById": {
    "10": { "clienteId": 999, "checkoutId": 1 }
  }
}
```

Regras:
- chaves são strings (para não perder em JSON object key).
- valores guardam no mínimo `clienteId`.
- `pedidoById` deve guardar também `checkoutId` para localizar o arquivo de transação sem scan.

## Dados por cliente

Pasta do cliente:
- `CHECKOUT/<clienteId>/`

### 2) Carrinho (1 arquivo por cliente)
Arquivo:
- `CHECKOUT/<clienteId>/carrinho.json`

Regras:
- o cliente mantém no máximo 1 carrinho “ativo”.
- após finalização do checkout, o carrinho é “consumido” (limpo).

### 3) Transações (checkout + pedido no mesmo arquivo)
Diretório:
- `CHECKOUT/<clienteId>/transacoes/`

Arquivo por checkoutId:
- `CHECKOUT/<clienteId>/transacoes/<checkoutId>.json`

Objetivo:
- mitigar fragmentação: não criar 2 arquivos (um checkout e outro pedido) por fluxo.

Shape mínimo:
```json
{
  "checkoutId": 1,
  "clienteId": 999,
  "carrinhoId": 1,
  "checkout": {
    "snapshot": {},
    "contato": {},
    "entrega": {},
    "pagamento": {},
    "resumoFinal": {},
    "status": "aberto",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  "pedido": null
}
```

Quando finaliza:
- `pedido` vira objeto:
  - `{ pedidoId, status, createdAt, ... }`
- também atualiza `CHECKOUT/_index.json`:
  - `pedidoById[pedidoId] = { clienteId, checkoutId }`

## checkout.json (configuração de regras)

Arquivo:
- `PROJETOS/connect/handlers/mock/checkout.json`

Regra:
- contém apenas **meta**, **seq**, **config** (nada transacional).

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

## Notas de consistência
- Endpoints não mudam; a mudança é apenas de persistência.
- Como as rotas usam `:checkoutId` e `:pedidoId` sem `clienteId`, o `_index.json` é obrigatório.
- O controller deve usar escrita atômica e lock por arquivo (quando disponível) para evitar corrupções em “read-modify-write”.

