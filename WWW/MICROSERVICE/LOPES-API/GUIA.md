# Guia (LOPES-API)

## Objetivo

Construir, de forma incremental, um guia prático para navegar nas documentações OpenAPI e executar endpoints com segurança (sem vazar token), registrando exemplos e aprendizados.

## Docs (OpenAPI)

- ApiLopes: https://gp.lopesecia.com.br:9002/ApiLopes/v3/api-docs
- Servidor: https://gp.lopesecia.com.br:9004/Servidor/v3/api-docs

## Regras deste guia

- Sempre registrar: método, URL completa, headers, query/body, exemplos de execução, respostas comuns e erros.
- Nunca colar tokens reais. Usar placeholders como `{{authorizationToken}}`.

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

