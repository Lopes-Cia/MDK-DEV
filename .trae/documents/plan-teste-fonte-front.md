# Plano — Alternar fonte (mock vs lopes) para testar o front com URLs dinâmicas

## Objetivo
Focar em fazer o **fluxo real** funcionar (com o mínimo de fallback), principalmente a rota de produto por slug.

Garantir que estas URLs do site funcionem com dados dinâmicos:
- `http://localhost:3000/categorias`
- `http://localhost:3000/categoria/bebidas`
- `http://localhost:3000/produtos/heineken-lata-269ml`

## Estado atual (confirmado no repo)
- As páginas do site consomem dados via `stores/produtos-store.ts`, que por sua vez chama `lib/api/produtos.ts`.
- Categorias “lopes” já existem e usam JSON local:
  - `/api/lopes/produtos/categorias`
  - `/api/lopes/produtos/categorias/[idCategoria]`
  - `/api/lopes/produtos/categorias/by-slug/[...slug]`
- Produtos “lopes” já existem:
  - `/api/lopes/produto-loja?codProd=...` (modelo)
  - `/api/lopes/produtos/by-id/[idProduto]`
  - `/api/lopes/produtos/by-slug/[slug]` (hoje prioriza `-<id>` no final)
  - `/api/lopes/produtos/by-categoria/[idCategoria]?...`
- Observação importante: o front usa slug sem id em dev (ex.: `/produtos/heineken-lata-269ml`), então a rota `by-slug` precisa suportar slug **sem** `-<id>`.
- `ProdutoClient` sempre chama `loadBrands()` junto do produto.

## Decisões
- A prioridade é a rota `by-slug` funcionar com dados reais, sem “chutar” produto.
- Fonte (mock vs lopes) fica como detalhe operacional; o plano evita depender disso para comprovar o que funciona.
- Categorias e brands (lopes) continuam usando JSON local apenas como lookup/contrato; nenhuma alteração nos snapshots é feita pelo front.

## Implementação (3 passos)
1) Fazer `by-slug` lopes suportar slug sem id (para URLs dinâmicas do site)
   - Editar: `app/api/lopes/produtos/by-slug/[slug]/route.ts`
   - Regra:
     - Se slug terminar em `-<id>` → usar `id` (como está).
     - Se não terminar em `-<id>`:
       - Fazer Passo 1 via `getBackListProdutoLoja({ descricaoErp: <texto derivado do slug> })`
       - Traduzir candidatos e selecionar **somente** quando o `slug` traduzido bater exatamente com `/produtos/<slug-requisitado>-<id>`.
       - Se houver múltiplos candidatos e nenhum bater exatamente, retornar 404 (sem fallback “primeiro da lista”).
     - Se não encontrar → 404.

2) Ajustar o client API para usar `lopes/by-slug` durante o teste
   - Editar: `lib/api/produtos.ts`
   - Trocar temporariamente `getProdutoBySlug()` para chamar `/lopes/produtos/by-slug/...` (reversível).

3) Validar no browser (sem cron, sem flags)
   - Validar:
     - `/categorias`
     - `/categoria/bebidas`
     - `/produtos/heineken-lata-269ml`

## Verificação (aceite)
- `/categorias` renderiza lista/árvore de categorias em ambos os modos.
- `/categoria/bebidas` carrega a categoria por slug e lista produtos (com paginação local em lopes).
- `/produtos/heineken-lata-269ml` funciona no modo lopes mesmo sem `-<id>` explícito na URL.
- Sem fallback “pegar o primeiro” na rota by-slug: se não casar o slug, retorna 404.

## Observações / Riscos
- A busca de produto por slug sem id depende do comportamento do back com `descricaoErp` (pode retornar mais de 1 item). Por isso o passo 5 inclui filtragem pós-tradução por slug.
