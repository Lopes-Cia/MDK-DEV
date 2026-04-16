# Tasks

- [ ] Task 1: Inventariar pontos de uso e definir nomes finais
  - [ ] Mapear imports e chamadas: `produtosV2`, `products`
  - [ ] Definir nomes finais: `produtos-store`, `lib/api/produtos`, chave do `control-store`

- [ ] Task 2: Criar rotas BFF finais `/api/produtos/*`
  - [ ] Duplicar/migrar handlers de `app/api/produtosV2/**` para `app/api/produtos/**`
  - [ ] Garantir mesmo contrato (status/shape) sem mudança de payload
  - [ ] Remover `app/api/produtosV2/**`

- [ ] Task 3: Criar client API final `lib/api/produtos.ts`
  - [ ] Migrar funções de `lib/api/produtosV2.ts` para `lib/api/produtos.ts` (paths novos)
  - [ ] Remover `lib/api/produtosV2.ts`

- [ ] Task 4: Criar store final `stores/produtos-store.ts`
  - [ ] Migrar estado/actions do `produtosV2-store.ts`
  - [ ] Atualizar registro no `stores/control-store.ts`
  - [ ] Remover `stores/produtosV2-store.ts`

- [ ] Task 5: Remover legado `products`
  - [ ] Migrar páginas/componentes que chamam `getProducts()` para usar o store/rotas finais
  - [ ] Remover `app/api/products/**`
  - [ ] Remover `lib/api/products.ts` e `lib/integration/productsService.ts` (ou deixar sem uso e remover referências)

- [ ] Task 6: Atualizar painel dev e varrer referências
  - [ ] Ajustar `app/(shop)/dev/page.tsx` para usar apenas `/api/produtos/*`
  - [ ] Garantir que não existam referências a `produtosV2` e `products` no front

- [ ] Task 7: Validação manual
  - [ ] Verificar no `/dev` as rotas de categorias, produto por id/slug, produtos por categoria, brands
  - [ ] Verificar `/(shop)/products` (ou equivalente) funcionando com a nova superfície

# Task Dependencies
- Task 2 depende de Task 1
- Task 3 depende de Task 2
- Task 4 depende de Task 3
- Task 5 depende de Task 4
- Task 6 pode rodar após Task 2/3/4
- Task 7 depende de Task 6

