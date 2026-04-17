# MOCK-END — Deep dive (endpoints)

## Grupos cobertos
- core: /health, /assets/images/*, /api/storage/...
- connect: rotas declarativas em PROJETOS/connect/routes.mjs (mock/hybrid/original)
- auth: rotas declarativas em PROJETOS/ApiLopes/webservice/api/routes.mjs (proxy AUTH)

## Observacoes importantes
- /connect/*: se a rota nao existir em PROJETOS/connect/routes.mjs, o MOCK-END faz proxy cego para INTEGRATION_URL_API.
- /ApiLopes/webservice/api/*: segue routes.mjs da base AUTH e encaminha para AUTH_BASE_URL via handlers.

## Arquivos gerados
- endpoints.json: catalogo IA-friendly de endpoints, com hints de query/body/response quando detectavel.
- ENDPOINTS.md: leitura humana (tabela) com resumo e ponteiro para handler.
- EXAMPLES.md: lista de exemplos locais (request/result) capturados em LEAR_LOPES/data.
- CAPTURE_SUMMARY.json: resumo da captura automatica (quantos ok/fail/skipped).
- openapi.mock-end.json: Swagger/OpenAPI 3.0 gerado para o MOCK-END (base http://localhost:4000).
- swagger-ui.html: pagina que renderiza o OpenAPI no navegador (Swagger UI via CDN).
- swagger-ui.mjs: servidor Node simples para abrir o swagger-ui.html com o spec (evita bloqueio de file://).

## Como renderizar (Swagger UI)

1) subir o servidor do Swagger UI:

```bash
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\DOCS\mock-end-deep\swagger-ui.mjs
```

2) abrir no navegador:

- `http://localhost:4010`
