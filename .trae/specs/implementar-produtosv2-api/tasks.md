# Tasks

- [x] Task 1: Congelar contratos e pontos de compatibilidade
  - [x] Confirmar endpoints externos finais do mock-end conforme `IA/DESENHOS/produtos-api.md`
  - [x] Manter endpoints antigos temporariamente (sem remover ainda) até migração do front para `produtosV2`

- [x] Task 2: Mock-end — base de domínio (ProdutosController)
  - [x] Criar `ProdutosController` (mock JSON) com: árvore de categorias, descendentes, paginação, busca por id/slug
  - [x] Garantir cache em memória e validações de params com statusCode coerente (400/404/500)

- [x] Task 3: Mock-end — handlers mock para rotas externas
  - [x] Criar handler `handlers/mock/api/produtos.mjs` que instancia `ProdutosController` e traduz endpoints → métodos
  - [x] Garantir contrato de resposta (success/data/total/page etc.) conforme spec

- [x] Task 4: Mock-end — reutilização do proxy upstream (preparação)
  - [x] Extrair `proxyToIntegration` (ou equivalente) para `MOCK-END/lib/` como util compartilhado
  - [x] Ajustar `handlers/api/products.mjs` para consumir o util compartilhado (sem mudar comportamento)

- [x] Task 5: Next (connect-ecommerce) — integration service V2 (server-only)
  - [x] Criar `lib/integration/productsServiceV2.ts` chamando os endpoints externos `/Servidor/webservice/integration/produtos/...`
  - [x] Reutilizar `ensureAuthReady` + `businessGet` e normalizar payloads para o contrato interno

- [x] Task 6: Next (connect-ecommerce) — rotas internas BFF produtosV2
  - [x] Criar `app/api/produtosV2/categorias/route.ts`
  - [x] Criar `app/api/produtosV2/categorias/[idCategoria]/route.ts`
  - [x] Criar `app/api/produtosV2/by-categoria/[idCategoria]/route.ts` (query: includeDescendants/page/pageSize)
  - [x] Criar `app/api/produtosV2/by-id/[idProduto]/route.ts`
  - [x] Criar `app/api/produtosV2/by-slug/[slug]/route.ts`

- [x] Task 7: Next (connect-ecommerce) — client interno /api + store produtosV2
  - [x] Criar `lib/api/produtosV2.ts` usando o `apiClient()` existente
  - [x] Criar `stores/produtosV2-store.ts` com estado + loading/error + paginação
  - [x] Registrar `PRODUTOSV2STORE` em `stores/control-store.ts`

- [x] Task 8: Limpeza e migração gradual
  - [x] Remover qualquer fetch client-side direto para `localhost:4000` relacionado a produtos/categorias
  - [x] Adicionar um ponto único de teste/manual (ex.: action no store) para verificar retorno no console sem acoplar rota externa

# Task Dependencies
- Task 3 depende de Task 2
- Task 6 depende de Task 5
- Task 7 depende de Task 6
- Task 4 pode ser feito em paralelo com Task 2/3
