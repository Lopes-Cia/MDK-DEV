# Plano — Espelhar `/api/produtos/*` em `/api/lopes/produtos/*` (pipeline Passo 0/1/2)

## Contexto (o que acabamos de fazer)
- Já existe `GET /api/lopes/categorias` entregando o mesmo **formato do mock** de `GET /api/produtos/categorias`:
  - **Passo 0:** chama Lopes Back `getBackListCategoria()` (via `lopesBackClient.ts`)
  - **Passo 1:** traduz para `Categoria[]` (flat) e garante `id:0` no início
  - **Passo 2:** monta `CategoriaNode[]` (árvore com `children`) e retorna `{ success:true, data: ... }`

## Objetivo
- Criar a família `GET /api/lopes/produtos/...` para **tudo** que hoje existe em `GET /api/produtos/...`, mantendo contrato idêntico (shape, tipos, e regras de erro).

## Plano (6 passos, incremental)
1) Inventariar os endpoints existentes em `/api/produtos/*` e anotar o shape exato de `data` (por endpoint).
2) Criar a pasta `app/api/lopes/produtos/*` espelhando a mesma matriz (mesmas rotas dinâmicas).
3) Para cada endpoint, implementar a pipeline:
   - **Passo 0:** chamar o Lopes Back (fonte real) via `lopesBackClient.ts`
   - **Passo 1:** traduzir o retorno para um formato intermediário (tipos de `lib/types/produtos.ts`)
   - **Passo 2:** ajustar para o **mesmo** formato final que o endpoint `/api/produtos/...` retorna hoje
4) Reaproveitar o que já está pronto para categorias (tradutores do `lib/mockups/syncDataFromBackToFront.ts`) como base do Passo 1/2.
5) Preencher os pontos em aberto (principalmente `brand`/`brands`) com uma regra clara antes de fechar a implementação.
6) Validar endpoint a endpoint comparando (shape) `/api/produtos/...` vs `/api/lopes/produtos/...` para o mesmo input.

## Matriz de Espelhamento (o que criar + Passo 0/1/2 por endpoint)
Base (já existe hoje): endpoints em `app/api/produtos/*`:
- `GET /api/produtos/categorias`
- `GET /api/produtos/categorias/[idCategoria]`
- `GET /api/produtos/categorias/by-slug/[...slug]`
- `GET /api/produtos/by-categoria/[idCategoria]?includeDescendants=0|1&page=&pageSize=`
- `GET /api/produtos/by-id/[idProduto]`
- `GET /api/produtos/by-slug/[slug]`
- `GET /api/produtos/brands`
- `GET /api/produtos/brands/[idBrand]?page=&pageSize=`

Criação (novo): mesmos caminhos em `app/api/lopes/produtos/*`:

1) `GET /api/lopes/produtos/categorias` → `CategoriaNode[]`
- **Passo 0:** `getBackListCategoria()`
- **Passo 1:** `translateLopesCategoriasToCategorias(input): Categoria[]`
- **Passo 2:** `buildCategoriasTreeFromCategorias(categorias): CategoriaNode[]`
- **Retorno final:** `{ success:true, data: CategoriaNode[] }`

2) `GET /api/lopes/produtos/categorias/[idCategoria]` → `{ category, children }`
- **Passo 0 (recomendado):**
  - `getBackCategoria({ codigo: idCategoria })` para o item
  - `getBackListCategoria({ codPai: idCategoria })` para os filhos imediatos
- **Passo 1:** traduzir ambos para `Categoria` / `Categoria[]`
- **Passo 2:** ajustar para `{ success:true, data: { category: Categoria, children: Categoria[] } }`

3) `GET /api/lopes/produtos/categorias/by-slug/[...slug]` → `{ category }`
- **Passo 0:** `getBackListCategoria()`
- **Passo 1:** `Categoria[]` (flat, com `id:0`)
- **Passo 2:** árvore + localizar por `slug` → `{ success:true, data: { category: CategoriaNode } }`

4) `GET /api/lopes/produtos/by-categoria/[idCategoria]` → `Produto[] + paginação`
- **Passo 0:** `getBackListProdutoLoja({ idCategoria })` (e, se `includeDescendants=1`, repetir para ids descendentes e mesclar)
- **Passo 1:** traduzir o(s) retorno(s) para `Produto[]` (contrato `lib/types/produtos.ts`)
- **Passo 2:** aplicar as regras do endpoint `/api/produtos/by-categoria/...`:
  - `includeDescendants` (0|1)
  - paginação `{ page, pageSize, total, totalPages }`
  - retorno `{ success:true, data: Produto[], page, pageSize, total, totalPages }`

5) `GET /api/lopes/produtos/by-id/[idProduto]` → `Produto`
- **Passo 0:** `getBackProdutoLoja({ codProd: idProduto })`
- **Passo 1:** traduzir para `Produto`
- **Passo 2:** garantir `slug`, `categoryId`, `brand`, `badges`, `stock/inStock` conforme regras do mock
- **Retorno final:** `{ success:true, data: Produto }`

6) `GET /api/lopes/produtos/by-slug/[slug]` → `Produto`
- **Passo 0:** extrair `idProduto` do slug (regra: `...-<id>`). Se não existir, retornar 400.
- **Passo 1/2:** reutilizar o fluxo do `by-id`.

7) `GET /api/lopes/produtos/brands` → `Brand[]`
- **Passo 0:** (ponto em aberto) Lopes Back não tem endpoint de marcas no client atual.
- **Passo 1:** definir regra de origem da marca (provavelmente derivar de `Produto.brand` após a tradução).
- **Passo 2:** ajustar para `{ success:true, data: Brand[] }`

8) `GET /api/lopes/produtos/brands/[idBrand]` → `{ brand, products }`
- **Passo 0:** (depende da decisão do item 7) carregar produtos e filtrar por brand.
- **Passo 1:** traduzir para `Produto[]` e `Brand`
- **Passo 2:** paginar no shape:
  - `{ success:true, data: { brand: Brand, products: { data: Produto[], page, pageSize, total, totalPages } } }`

## Pontos de Validação (o “pronto”)
- Para cada endpoint acima: `shape` de resposta idêntico ao equivalente em `/api/produtos/...` (mesmos campos e tipos).
- Erros: sempre `{ success:false, message }` com status HTTP coerente.
- Nada de chamada de API direto em componente: manter chamadas no server (route handler) e consumo no front via client atual.
