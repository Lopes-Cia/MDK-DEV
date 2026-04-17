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

