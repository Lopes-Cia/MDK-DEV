# Plano — Espelhar `/api/produtos/*` em `/api/lopes/produtos/*` (pipeline Passo 1/2/3)

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
- **Passo 1/2 fora do runtime:** atualização agendada/manual gera `categorias.json` (snapshot `Categoria[]`).
- **Runtime (somente contrato):** lê `categorias.json` e monta árvore com `buildCategoriasTreeFromCategorias(categorias)`.
- **Retorno final:** `{ success:true, data: CategoriaNode[] }`

2) `GET /api/lopes/produtos/categorias/[idCategoria]` → `{ category, children }`
- **Passo 1/2 fora do runtime:** atualização agendada/manual abastece `categorias.json`.
- **Runtime (somente contrato):** lê `categorias.json`, resolve `category` e `children` e responde no shape final.

3) `GET /api/lopes/produtos/categorias/by-slug/[...slug]` → `{ category }`
- **Passo 1/2 fora do runtime:** atualização agendada/manual abastece `categorias.json`.
- **Runtime (somente contrato):** monta árvore a partir do `categorias.json` e localiza por `slug`.

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
- **Fonte fixa:** `brands.json` local.
- **Runtime (somente contrato):** leitura de `brands.json` e retorno `{ success:true, data: Brand[] }`.
- **Observação:** sem Passo 1 de atualização nesta fase.

8) `GET /api/lopes/produtos/brands/[idBrand]` → `{ brand, products }`
- **Fonte de brand:** `brands.json` local (sem atualização nesta fase).
- **Runtime (somente contrato):**
  - lê `brands.json` para resolver `brand`
  - obtém `products` pelo fluxo definido de produtos
  - pagina no shape:
  - `{ success:true, data: { brand: Brand, products: { data: Produto[], page, pageSize, total, totalPages } } }`

## Seção Extra — Estratégia para Categorias (cache local)
- Como `categorias` muda pouco, simplificar com arquivo local `categorias.json` (snapshot já traduzido no formato de Passo 1: `Categoria[]`).
- Fluxo operacional:
  - **Passo 0/1 fora do runtime:** job/manual chama o back real, traduz e grava `categorias.json`.
  - **Passo 2 no runtime:** endpoints de categorias leem `categorias.json` e só montam/filtram no formato final do mock.
- Benefícios:
  - reduz dependência do back em tempo real para categorias
  - melhora previsibilidade e tempo de resposta
  - mantém contrato do front idêntico ao `/api/produtos/*`
- Regra de atualização sugerida:
  - atualização manual via script (quando time pedir), com possibilidade de agendar (ex.: diário)
  - sempre versionar snapshot e validar shape antes de publicar
  - em caso de erro na atualização, manter o último `categorias.json` válido (sem fallback silencioso)

## Seção Extra — Marcas e Brands (fonte local obrigatória)
- Hoje não existe endpoint de marcas no back real; não há como executar **Passo 0** diretamente para brands.
- Estratégia recomendada: manter `brands.json` local como fonte oficial de brands para os endpoints:
  - `GET /api/lopes/produtos/brands`
  - `GET /api/lopes/produtos/brands/[idBrand]`
- Fluxo:
  - **Runtime:** leitura de `brands.json` local e montagem do contrato final
  - **Sem rotina de atualização nesta fase**
- Regra de manutenção:
  - arquivo mantido localmente e alterado sob demanda
  - IDs estáveis para não quebrar links/filtros por `idBrand`
  - validação de schema antes de qualquer alteração manual

## Subplano — Operação dos arquivos locais (`categorias.json` e `brands.json`)
1) Definir os arquivos fonte:
   - categorias: `lib/mockups/data/categorias.json` (formato `Categoria[]`)
   - brands: `lib/mockups/data/brands.json` (formato `Brand[]`)
2) Padronizar regra de leitura no runtime:
   - endpoints `/api/lopes/produtos/categorias*` leem `categorias.json`
   - endpoints `/api/lopes/produtos/brands*` leem `brands.json`
3) Padronizar regra de atualização fora do runtime:
   - categorias: atualização por script/manual (Passo 0 + Passo 1) e gravação do snapshot
   - brands: atualização manual/job no arquivo local até existir fonte real no back
4) Definir validação mínima antes de publicar snapshot:
   - categorias: garantir item `id: 0` e campos obrigatórios (`id,name,slug,parentId,image,order`)
   - brands: garantir item `id: 0` e campos obrigatórios (`id,name,slug,image`)
5) Definir rollback operacional:
   - se atualização falhar, manter último snapshot válido sem alterar o contrato dos endpoints
6) Fechar com validação de contrato:
   - confirmar que os endpoints retornam o mesmo shape de `/api/produtos/*` para sucesso e erro

## Pontos de Validação (o “pronto”)
- Para cada endpoint acima: `shape` de resposta idêntico ao equivalente em `/api/produtos/...` (mesmos campos e tipos).
- Erros: sempre `{ success:false, message }` com status HTTP coerente.
- Nada de chamada de API direto em componente: manter chamadas no server (route handler) e consumo no front via client atual.
