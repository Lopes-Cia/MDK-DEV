# Lopes & Cia — API 9004 (Servidor) — Documentacao local

## Links

- Swagger UI: https://gp.lopesecia.com.br:9004/Servidor/swagger-ui/index.html
- OpenAPI JSON (origem): https://gp.lopesecia.com.br:9004/Servidor/v3/api-docs

## O que tem nesta pasta

- `api-docs.json`: dump do OpenAPI v3 (para consultar offline).
- `openapi-cli.mjs`: utilitario Node.js para consultar o OpenAPI local (sem Python).
- `TAGS.md`: lista de tags (categorias) do OpenAPI.
- `AI_GUIDE.md`: guia “IA friendly” (como navegar/consultar a API e achar endpoints).

## Como consultar (offline)

Exemplos usando Node.js:

```bash
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\DOCS\lopes_9004\openapi-cli.mjs list-tags
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\DOCS\lopes_9004\openapi-cli.mjs search token
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\DOCS\lopes_9004\openapi-cli.mjs detail "/webservice/integration/getListProdutoLoja" get
```

Para exportar uma lista completa de endpoints para um arquivo:

```bash
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\DOCS\lopes_9004\openapi-cli.mjs list-all > c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\DOCS\lopes_9004\endpoints.txt
```

## Observacao

Se o Swagger UI nao carregar no navegador, normalmente ainda e possivel baixar o JSON do OpenAPI diretamente via `/Servidor/v3/api-docs` e consultar offline por aqui.
