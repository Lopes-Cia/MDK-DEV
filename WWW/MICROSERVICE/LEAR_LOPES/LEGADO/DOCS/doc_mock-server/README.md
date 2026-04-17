# Documentacao — Mock Server Connect (`/connect`)

## Base URL

- `http://localhost:4000/connect`

Todos os endpoints abaixo devem ser chamados com esse prefixo.

## Fonte do contrato

- Catalogo de rotas: `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs`
- Handlers (implementacao mock): `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/*`

## Autenticacao

No catalogo de rotas:

- `auth.mode = required`: exige header `Authorization`
- `auth.mode = none`: nao exige auth (mock)

Formato recomendado:

```http
Authorization: <token>
```

## Endpoints

### Produtos e categorias

- `GET /Servidor/webservice/integration/produtos/categorias`
- `GET /Servidor/webservice/integration/produtos/categorias/by-slug/*`
- `GET /Servidor/webservice/integration/produtos/categorias/*`
- `GET /Servidor/webservice/integration/produtos/by-categoria/*`
- `GET /Servidor/webservice/integration/produtos/by-id/*`
- `GET /Servidor/webservice/integration/produtos/by-slug/*`
- `GET /Servidor/webservice/integration/produtos/brands`
- `GET /Servidor/webservice/integration/produtos/brands/*`
- `GET /Servidor/webservice/integration/home`

### Clientes

- `POST /Servidor/webservice/integration/clientes/login`
- `POST /Servidor/webservice/integration/clientes/cadastro`
- `PUT /Servidor/webservice/integration/clientes/meus-dados`
- `PUT /Servidor/webservice/integration/clientes/privacidade`
- `GET /Servidor/webservice/integration/clientes/enderecos/:clienteId`
- `POST /Servidor/webservice/integration/clientes/enderecos`
- `PUT /Servidor/webservice/integration/clientes/enderecos/:enderecoId`
- `DELETE /Servidor/webservice/integration/clientes/enderecos/:enderecoId`

### Carrinho

- `GET /Servidor/webservice/integration/carrinho/:clienteId`
- `POST /Servidor/webservice/integration/carrinho/itens`
- `PUT /Servidor/webservice/integration/carrinho/itens/:itemId`
- `DELETE /Servidor/webservice/integration/carrinho/itens/:itemId`
- `POST /Servidor/webservice/integration/carrinho/cupom`
- `DELETE /Servidor/webservice/integration/carrinho/cupom`

### Checkout

- `POST /Servidor/webservice/integration/checkout/sessoes`
- `GET /Servidor/webservice/integration/checkout/sessoes/:checkoutId`
- `PUT /Servidor/webservice/integration/checkout/sessoes/:checkoutId/contato`
- `PUT /Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/endereco`
- `GET /Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/frete/opcoes`
- `PUT /Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/frete`
- `POST /Servidor/webservice/integration/checkout/sessoes/:checkoutId/pagamento/pix`
- `POST /Servidor/webservice/integration/checkout/sessoes/:checkoutId/pagamento/pix/confirmar`
- `POST /Servidor/webservice/integration/checkout/sessoes/:checkoutId/finalizar`

### Pedidos

- `GET /Servidor/webservice/integration/pedidos/:pedidoId`
- `GET /Servidor/webservice/integration/pedidos`

## Exemplos rapidos (curl)

### 1) Listar categorias

```bash
curl -X GET "http://localhost:4000/connect/Servidor/webservice/integration/produtos/categorias" ^
  -H "Authorization: SEU_TOKEN"
```

### 2) Login de cliente (mock)

```bash
curl -X POST "http://localhost:4000/connect/Servidor/webservice/integration/clientes/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"cliente@teste.com\",\"senha\":\"123456\"}"
```

### 3) Criar sessao de checkout

```bash
curl -X POST "http://localhost:4000/connect/Servidor/webservice/integration/checkout/sessoes" ^
  -H "Content-Type: application/json" ^
  -d "{\"clienteId\":999}"
```

## Fluxo de utilizacao (teste progressivo)

Objetivo: ter um fluxo repetivel para testar endpoints um a um, sempre com o mesmo token e com retorno JSON padronizado.

### 1) Garantir o mock server rodando

- Base alvo: `http://localhost:4000/connect`

### 2) Gerar token (AUTH)

O token usado aqui e o `hashToken` salvo em `token-acesso.json`.

```bash
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\gerar-token-acesso.mjs
```

### 3) Subir o microservico tester

```bash
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\tester-progressivo.mjs
```

Endpoints do tester:

- `GET http://localhost:3000/health`
- `GET http://localhost:3000/steps`
- `POST http://localhost:3000/steps/categorias/run`
- `GET http://localhost:3000/runs`

### 4) Rodar o primeiro teste (categorias)

```bash
curl -X POST "http://localhost:3000/steps/categorias/run"
```

Esse step chama:

- `GET http://localhost:4000/connect/Servidor/webservice/integration/produtos/categorias`

Se quiser repassar querystring para o endpoint real, inclua direto no call do step:

```bash
curl -X POST "http://localhost:3000/steps/categorias/run?exemplo=1"
```

## Notas

- Rotas com `*` representam segmento dinamico livre (ex.: slug ou id).
- Rotas com `:param` representam parametro nomeado (ex.: `:clienteId`, `:checkoutId`).
- Se precisar documentar payloads e respostas (schemas), o proximo passo e extrair isso diretamente dos handlers em `handlers/mock/api/*` e adicionar exemplos por endpoint.
