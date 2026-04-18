# Plano - Migrar camada de Produtos (MOCK-END → BACK real) com Adapter/Tradutor

## Objetivo
- Manter o `connect-ecommerce` funcionando sem atrito (mesmo contrato atual de `/api/produtos/*`).
- Trocar a fonte de dados: sair do MOCK-END (`INTEGRATION_URL_API=http://localhost:4000/connect`) e passar a usar o BACK real (`INTEGRATION_URL_API=https://gp.lopesecia.com.br:9004`), usando a mesma técnica do tradutor `tradutorBACKvcMOCK.mjs`.

## Premissas e Restrições
- O contrato consumido pelo front permanece o mesmo:
  - [lib/api/produtos.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/lib/api/produtos.ts)
  - [stores/produtos-store.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/stores/produtos-store.ts) não deve mudar sua interface pública.
- Evitar adicionar dependências novas sem necessidade.
- Não rodar testes/ações extras fora do que o usuário pedir.

## Estratégia
- Criar uma camada “Adapter” dentro do `connect-ecommerce`:
  - endpoints internos `/api/produtos/*` chamam o BACK real (9004) e retornam no formato esperado pelo front.
- Reaproveitar a lógica de tradução do arquivo:
  - [tradutorBACKvcMOCK.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/LEAR_LOPES/BACK/endpoints/prod/vai/tradutorBACKvcMOCK.mjs)
  - extraindo funções puras de mapeamento (BACK → contrato do front).

## Passos
1) Mapear contrato atual do front
   - Confirmar exatamente os formatos de resposta que o front espera para:
     - `GET /api/produtos/categorias`
     - `GET /api/produtos/categorias/:id`
     - `GET /api/produtos/categorias/by-slug/:slug`
     - `GET /api/produtos/by-categoria/:id`
     - `GET /api/produtos/by-id/:id`
     - `GET /api/produtos/by-slug/:slug`
     - `GET /api/produtos/brands`
     - `GET /api/produtos/brands/:id`

### Endpoint piloto (primeiro a migrar): GET /api/produtos/categorias

**Onde o front chama**
- `produtos-store.ts` chama `getCategoriasTree` ([produtos-store.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/stores/produtos-store.ts#L5-L13)).
- Esse `getCategoriasTree` é o client helper em [produtos.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/lib/api/produtos.ts#L24-L27) e bate em `GET /api/produtos/categorias`.

**Onde entra o código de troca (mock → back)**
- O ponto exato para trocar a fonte e aplicar a tradução é a integração server-side em:
  - [produtosService.getCategoriasTree](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/lib/integration/produtosService.ts#L68-L72)
- Essa função é chamada pela API route:
  - [app/api/produtos/categorias/route.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/api/produtos/categorias/route.ts#L8-L12)

**Como fica a troca**
- Hoje:
  - `produtosService.getCategoriasTree()` chama `integrationGet('/Servidor/webservice/integration/produtos/categorias')`
  - O `integrationUrlApi` vem do `.env` (mock-end local) via `getIntegrationEnvConfig()`.
- Depois (piloto):
  - Se `PRODUTOS_UPSTREAM=mock` → mantém o fluxo atual.
  - Se `PRODUTOS_UPSTREAM=back` → chama o endpoint legado do BACK real (ex.: `/Servidor/webservice/integration/getListCategoria` ou equivalente) e aplica um mapper inspirado no `tradutorBACKvcMOCK.mjs` para retornar `CategoriaNode[]` no mesmo formato do front.

**Resultado**
- O `produtos-store.ts` não muda.
- Só muda a implementação em `produtosService.getCategoriasTree()` (e/ou um mapper importado por ela).

2) Mapear endpoints equivalentes no BACK real (9004)
   - Confirmar quais endpoints do BACK vamos chamar para cada operação acima (produtos/categorias/brands).

3) Extrair/organizar tradutor como módulo
   - Criar um módulo reutilizável com funções puras (sem I/O):
     - `mapProdutoFromBack(raw)` → `Produto`
     - `mapCategoriasFromBack(rawList)` → `Categoria[]` e/ou `CategoriaNode[]`
     - `mapBrandsFromBack(rawList)` → `Brand[]`
   - Manter o script atual `tradutorBACKvcMOCK.mjs` funcionando (ele pode só importar e usar essas funções).

4) Implementar API routes no `connect-ecommerce` (Adapter)
   - Para cada rota `/api/produtos/*`, fazer:
     - fetch no `INTEGRATION_URL_API` (9004) + path legado
     - aplicar o mapper
     - responder no contrato atual do front.

5) Toggle por env (sem atrito)
   - Adicionar flag `PRODUTOS_UPSTREAM=mock|back` (ou similar) para alternar:
     - mock-end atual (http://localhost:4000/connect)
     - back real (https://gp.lopesecia.com.br:9004)
   - Manter `.env` e `.env copy` como referência de valores.

6) Validação manual
   - Comparar respostas do Adapter vs mock-end para um conjunto pequeno:
     - 1 categoria list, 1 categoria detail, 1 brand list, 1 produto detail, 1 lista por categoria.
   - Verificar no browser o fluxo principal que depende do `produtos-store`:
     - carregar árvore de categorias
     - navegar por categoria e listar produtos
     - abrir produto por slug/id

## Critérios de Aceite
- `stores/produtos-store.ts` continua funcionando sem mudanças de consumo.
- `/api/produtos/*` responde com o mesmo shape atual, mas vindo do BACK real quando habilitado.
- Não quebra em dev com `.env` atual; com `.env copy` (ou flag), passa a usar o BACK real.

## Artefatos
- Módulo de tradução (mapper) reutilizável.
- API routes Adapter no `connect-ecommerce`.
- Documentação curta de como alternar upstream por env.
