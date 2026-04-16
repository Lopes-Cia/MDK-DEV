# Tasks

- [x] Task 1: Inventariar pontos de uso e definir nomes finais
  - [x] Mapear imports e chamadas: `produtosV2`, `products`
  - [x] Definir nomes finais: `produtos-store`, `lib/api/produtos`, chave do `control-store`

- [x] Task 2: Criar rotas BFF finais `/api/produtos/*`
  - [x] Duplicar/migrar handlers de `app/api/produtosV2/**` para `app/api/produtos/**`
  - [x] Garantir mesmo contrato (status/shape) sem mudança de payload
  - [x] Remover `app/api/produtosV2/**`

- [x] Task 3: Criar client API final `lib/api/produtos.ts`
  - [x] Migrar funções de `lib/api/produtosV2.ts` para `lib/api/produtos.ts` (paths novos)
  - [x] Remover `lib/api/produtosV2.ts`

- [x] Task 4: Criar store final `stores/produtos-store.ts`
  - [x] Migrar estado/actions do `produtosV2-store.ts`
  - [x] Atualizar registro no `stores/control-store.ts`
  - [x] Remover `stores/produtosV2-store.ts`

- [x] Task 5: Remover legado `products`
  - [x] Não executar nesta etapa (manter `products` como referência)

- [x] Task 6: Atualizar painel dev e varrer referências
  - [x] Ajustar `app/(shop)/dev/page.tsx` para usar apenas `/api/produtos/*`
  - [x] Garantir que não existam referências a `produtosV2` no front (exceto histórico/documentação)

- [ ] Task 7: Validação manual
  - [ ] Verificar no `/dev` as rotas de categorias, produto por id/slug, produtos por categoria, brands
  - [ ] Não migrar/verificar `/(shop)/products` nesta etapa (continua usando `products` legado)

# Task Dependencies
- Task 2 depende de Task 1
- Task 3 depende de Task 2
- Task 4 depende de Task 3
- Task 5 depende de Task 4
- Task 6 pode rodar após Task 2/3/4
- Task 7 depende de Task 6
