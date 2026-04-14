# Tasks

- [x] Task 1: Preparar roteamento e CORS no MOCK-END
  - [x] Garantir que os endpoints do Connect sejam avaliados antes do roteamento por tenant
  - [x] Atualizar CORS para incluir `POST` e headers `Authorization`/`Content-Type` (e credenciais se necessário para cookie)
  - [x] Validar que rotas existentes por tenant continuam respondendo como antes

- [x] Task 2: Implementar endpoints internos `/api/auth/*`
  - [x] `POST /api/auth/register` (validação mínima de body e resposta `{ success, data }`)
  - [x] `POST /api/auth/send-token` (exigir email ou whatsapp)
  - [x] `POST /api/auth/verify-token` (validar `{ token }`, retornar `{ verification, operador }` e setar cookie `session`)
  - [x] `POST /api/auth/logout` (limpar cookie `session`)
  - [x] `GET /api/auth/me` (ler cookie `session` e retornar sessão; `401` se ausente)

- [x] Task 3: Implementar endpoints internos `/api/products*`
  - [x] Resolver tenant fonte do catálogo (`?tenant`, header `X-Tenant`, env `MOCKEND_TENANT_DEFAULT`, fallback)
  - [x] `GET /api/products` com `{ success, data, total }`
  - [x] `GET /api/products/:codProd` com `{ success, data }` e `404` quando não existir
  - [x] Mapear itens do `CATALOGO/produtos.json` para o shape `Product` (campos principais)

- [x] Task 4: Implementar endpoints externos de autenticação (AUTH_BASE_URL)
  - [x] Exigir `Authorization` e aceitar token cru ou `Bearer <token>` (exceto `/tokenService`)
  - [x] `POST /tokenService` (modo geração e refresh)
  - [x] `POST /postAutenteicaAplicativo`
  - [x] `POST /enviarToken`
  - [x] `POST /verificarTokenSistema`
  - [x] `GET /getOperadorSistemaForId`

- [x] Task 5: Implementar endpoints externos de integração (INTEGRATION_URL_API)
  - [x] Exigir `Authorization`
  - [x] `GET /Servidor/webservice/integration/getIntegradora?id=...`
  - [x] `GET /Servidor/webservice/integration/getListProdutoLoja?idIntegradora=...` (resposta tolerante)
  - [x] `GET /Servidor/webservice/integration/getProdutoLoja?idIntegradora=...&codProd=...` (resposta tolerante)

- [x] Task 6: Gerar collection do Postman (JSON v2.1) para testar o MOCK-END
  - [x] Criar script gerador (em `scripts/`) que produz a collection com variáveis e requests
  - [x] Adicionar script no `package.json` para gerar/atualizar a collection
  - [x] Salvar o JSON gerado em caminho estável no repositório (definido na implementação)

- [x] Task 7: Validação manual guiada (sem testes automáticos)
  - [x] Registrar no README/nota curta do microservice (ou no próprio spec) como executar o server e importar a collection
  - [x] Validar por inspeção de código (sem executar) e deixar fluxo Postman pronto: auth (register/send/verify/me/logout), products, endpoints externos e integração

# Task Dependencies
- Task 2 depende de Task 1 (CORS + roteamento base).
- Task 3 depende de Task 1 (roteamento base).
- Task 4 e Task 5 dependem de Task 1 (roteamento base).
- Task 6 pode ser feita em paralelo após Task 1 (apenas precisa dos paths definidos).
