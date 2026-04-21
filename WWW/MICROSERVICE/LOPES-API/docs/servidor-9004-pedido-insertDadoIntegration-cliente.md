# Pedido (insertDadoIntegration) e Cliente — Servidor (9004)

Fonte: [servidor-9004.openapi.json](file:///workspace/WWW/MICROSERVICE/LOPES-API/specs/servidor-9004.openapi.json)

## Base URL

- `https://gp.lopesecia.com.br:9004/Servidor`

## Auth

- A spec indica `security: Authorization`
- Header padrão:
  - `Authorization: {{authorizationToken}}`

## 1) Inserir pedido (Integration)

### POST /webservice/integration/insertDadoIntegration

- Operação: `insertDadoIntegration`
- Descrição (spec): Cria um dado na integradora
- Body: `application/json` (`DadoIntegrationBean`)
- Respostas:
  - 200: `DadoIntegrationBean`
  - 404, 500

### Schema: DadoIntegrationBean

- `idIntegradora` (int)
- `tipo` (string) — no seu caso `OrderLopes`
- `orderId` (string) — identificador do pedido
- `payload` (string) — JSON do pedido serializado como string
- `integrado` (string) — ex.: `"N"`
- `dtIntegration` (date-time)

### Exemplo (curl)

```bash
curl -X POST \
  'https://gp.lopesecia.com.br:9004/Servidor/webservice/integration/insertDadoIntegration' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: {{authorizationToken}}' \
  --data '{
    "idIntegradora": 8,
    "tipo": "OrderLopes",
    "orderId": "009200417042026",
    "payload": "{\"orderId\":\"008200417042026\",\"tipo\":\"OrderLopes\",\"cliente\":{\"nome\":\"...\",\"CPFCNPJ\":\"25231575000146\"}}",
    "integrado": "N"
  }'
```

## 2) Onde estão as informações do cliente

### Cliente “do pedido” (dentro do payload)

No seu request, o campo `payload` é um JSON serializado como **string**. Dentro dele existe `cliente:{...}`.

Exemplo de campos do seu payload:

- `payload.cliente.CPFCNPJ` (identificador principal)
- `payload.cliente.nome`, `fantasia`, `email`
- endereço: `CEP`, `cidade`, `UF`, `bairro`, `endereco`, etc.

Ou seja: se o seu objetivo é “pegar as infos do cliente daquele pedido”, você obtém isso **fazendo parse do JSON** do `payload` e lendo `cliente`.

### Cliente “integrado” (cadastro consultável via API)

Além do cliente que vem no payload do pedido, a API tem endpoints para consultar o **cliente integrado** (tag `Customer`).

Principais endpoints:

- `GET /webservice/integration/getClienteIntegrado`
- `GET /webservice/integration/getListClienteIntegrado`
- `POST /webservice/integration/insertClienteIntegrado`

#### GET /webservice/integration/getClienteIntegrado

- Descrição (spec): Retorna um cliente integrado
- Query:
  - obrigatório: `idIntegradora` (int)
  - opcionais: `codCli` (int) ou `cgc` (string)
- Respostas: 200 (`ClienteBean`), 400 (parâmetro inválido), 404, 500

Observação prática:
- No payload do pedido você tem `CPFCNPJ`.
- Na API de cliente integrado você consulta por `cgc`.
- Na prática, `cgc` cumpre o papel do CPF/CNPJ.

Exemplo (por CNPJ/CPF):

```bash
curl -X GET \
  'https://gp.lopesecia.com.br:9004/Servidor/webservice/integration/getClienteIntegrado?idIntegradora=8&cgc=25231575000146' \
  -H 'Accept: application/json' \
  -H 'Authorization: {{authorizationToken}}'
```

#### GET /webservice/integration/getListClienteIntegrado

- Descrição (spec): Retorna uma lista de clientes integrados
- Query:
  - obrigatório: `idIntegradora` (int)
  - opcionais: `codCli`, `idTabela`, `cgc`, `nome`, `customerId`, `page`, `pageSize`
- Resposta 200 (spec): `ClienteBean`

Nota: a spec indica `ClienteBean` (não `array`). Se na prática vier uma lista/paginação, vale confirmar pelo retorno real.

#### POST /webservice/integration/insertClienteIntegrado

- Descrição (spec): Cria um cliente integrado
- Body: `ClienteBean`
- Respostas: 200 (`ClienteBean`), 404, 500

## 3) Por que isso pode confundir

- O endpoint `insertDadoIntegration` recebe o pedido com cliente “embutido” no `payload`.
- A API também possui um cadastro formal de cliente (`ClienteBean`) consultável por `getClienteIntegrado`.
- Dependendo da regra do backend, ele pode:
  - criar/atualizar o cliente automaticamente a partir do `payload`, ou
  - exigir que o cliente já exista como “integrado” (via `insertClienteIntegrado`) antes do pedido.

Checklist rápido para tirar a dúvida:

- Após inserir um pedido, chamar `getClienteIntegrado` usando `cgc = payload.cliente.CPFCNPJ`.
- Se vier 404, testar criar o cliente via `insertClienteIntegrado` e repetir a consulta.

