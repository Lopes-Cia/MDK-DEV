# Tasks

- [x] Task 1: Auditoria das páginas atuais
  - [x] Inventariar páginas existentes: produto, `/products` e quaisquer rotas relacionadas
  - [x] Identificar componentes reaproveitáveis (grid, filtro, busca, paginação, card)
  - [x] Mapear dependências atuais (API/store) e o que deve ser removido

- [x] Task 2: Definir contrato de dados das páginas (view-model)
  - [x] Definir view-model comum para listagem (produto) usado por catálogo/categoria/marca
  - [x] Definir view-model de cabeçalho (título, breadcrumbs, descrição opcional)
  - [x] Definir regras para `loading/empty/error`

- [x] Task 3: Refatorar `/products` para consumir o domínio final
  - [x] Substituir fonte de dados por `stores/produtos-store.ts` + `lib/api/produtos.ts`
  - [x] Manter UX (busca/filtro/grid) e remover chamadas antigas do fluxo principal
  - [x] Garantir navegação usando `slug` (que já contém `/produtos/...`)

- [x] Task 4: Implementar página de categoria
  - [x] Criar rota `/(shop)/categoria/[...slug]` (ou equivalente) e ler slug da URL
  - [x] Carregar categoria (via store) e produtos por categoria (incluindo descendentes quando aplicável)
  - [x] Reutilizar layout do `/products` (mesmo padrão visual)

- [x] Task 5: Implementar página de marca
  - [x] Criar rota `/(shop)/marca/[...slug]` (ou equivalente) e ler slug da URL
  - [x] Carregar marca e produtos da marca (paginado)
  - [x] Reutilizar layout do `/products` (mesmo padrão visual)

- [x] Task 6: Ajustes finais e validação manual
  - [x] Garantir que links de cards apontem para `slug` (sem concatenar prefixos)
  - [x] Verificar no `/dev` um fluxo de navegação: home -> categoria -> produto e home -> marca -> produto
  - [x] Verificar estados `loading/empty/error` em cada página

# Task Dependencies
- Task 2 depende de Task 1
- Task 3 depende de Task 2
- Task 4 depende de Task 2
- Task 5 depende de Task 2
- Task 6 depende de Task 3, Task 4 e Task 5
