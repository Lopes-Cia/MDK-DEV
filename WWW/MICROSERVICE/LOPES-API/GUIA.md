# Guia (LOPES-API)

## Objetivo

Construir, de forma incremental, um guia prático para navegar nas documentações OpenAPI e executar endpoints com segurança (sem vazar token), registrando exemplos e aprendizados.

## Docs (OpenAPI)

- ApiLopes: https://gp.lopesecia.com.br:9002/ApiLopes/v3/api-docs
- Servidor: https://gp.lopesecia.com.br:9004/Servidor/v3/api-docs

## Regras deste guia

- Sempre registrar: método, URL completa, headers, query/body, exemplos de execução, respostas comuns e erros.
- Nunca colar tokens reais. Usar placeholders como `{{authorizationToken}}`.

## Token de autenticação (Authorization)

### Quando é necessário

- Se a doc indicar `security: Authorization` ou a requisição retornar `401` com mensagem de token inválido, o endpoint exige autenticação via header `Authorization`.

### Como gerar (padrão)

Pelo que temos na collection [MOCK-END - Projetos Dinâmicos.postman_collection.json](file:///workspace/WWW/MICROSERVICE/LOPES-API/MOCK-END%20-%20Projetos%20Din%C3%A2micos.postman_collection.json), existem dois jeitos comuns de obter um token:

1) Fluxo Connect (Internos)
- `POST /api/auth/register`
- `POST /api/auth/send-token`
- `POST /api/auth/verify-token`
- O response do `verify-token` retorna o token; salvar esse valor em `authorizationToken` para usar nos endpoints que pedem `Authorization`.

2) Fluxo ApiLopes (Auth Base)
- `POST /ApiLopes/webservice/api/tokenService`
- Body:
  - `produto` (string)
  - `ean` (number/string)
  - `idIntegradora` (number)
  - `codCli` (number)
- O response retorna o token (na collection normalmente é usado como `authorizationToken`).

Exemplo (gerar token):

```bash
curl --location 'https://gp.lopesecia.com.br:9002/ApiLopes/webservice/api/tokenService' \
  --header 'Content-Type: application/json' \
  --data '{
    "produto": "CONNECT",
    "ean": 7890000002998,
    "idIntegradora": 8,
    "codCli": 1219
  }'
```

### Como usar o token

- Header:
  - `Authorization: {{authorizationToken}}`
  - Se ainda der `401`, tentar `Authorization: Bearer {{authorizationToken}}` (algumas APIs exigem o prefixo).

### Execução sem vazar token (recomendado)

- Guardar o token em um arquivo local não versionado (ex.: `.env.local`) e montar o header lendo de variável de ambiente, para não colar token em docs/commits.

## Exemplo 1 — Listar produtos (Servidor 9004)

### Endpoint

- Método: GET
- Path: /webservice/integration/getListProdutoLoja

### Query params

- Obrigatório: `idIntegradora` (integer)
- Opcionais: `codProd` (int), `ean` (string), `productId` (string), `descricaoErp` (string), `skuId` (string), `cnpjCliente` (string), `idCategoria` (int)

### Exemplo (curl)

```bash
curl -X GET \
  'https://gp.lopesecia.com.br:9004/Servidor/webservice/integration/getListProdutoLoja?idIntegradora=8' \
  -H 'Accept: application/json' \
  -H 'Authorization: {{authorizationToken}}'
```

### Resposta esperada

- 200: `application/json` (schema: `ProdutoLojaBean`)
- 404: não encontrado
- 500: erro interno
