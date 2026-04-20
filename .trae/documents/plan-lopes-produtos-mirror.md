# Plano — Espelhar `/api/produtos/*` em `/api/lopes/produtos/*` (pipeline Passo 1/2/3)

## Contexto (o que acabamos de fazer)
- Já existe `GET /api/lopes/categorias` entregando o mesmo **formato do mock** de `GET /api/produtos/categorias`:
  - **Passo 1:** chama Lopes Back `getBackListCategoria()` (via `lopesBackClient.ts`)
  - **Passo 2:** traduz para `Categoria[]` (flat) e garante `id:0` no início; quando necessário, monta árvore `CategoriaNode[]`
  - **Passo 3:** entrega o contrato final `{ success:true, data: ... }`

## Objetivo
- Criar a família `GET /api/lopes/produtos/...` para **tudo** que hoje existe em `GET /api/produtos/...`, mantendo contrato idêntico (shape, tipos, e regras de erro).

## Plano (6 passos, incremental)
1) Inventariar os endpoints existentes em `/api/produtos/*` e anotar o shape exato de `data` (por endpoint).
2) Criar a pasta `app/api/lopes/produtos/*` espelhando a mesma matriz (mesmas rotas dinâmicas).
3) Para cada endpoint, implementar a pipeline:
   - **Passo 1:** chamar a fonte (Lopes Back ou JSON local, conforme o endpoint)
   - **Passo 2:** traduzir/normalizar para tipos `lib/types/produtos.ts`
   - **Passo 3:** ajustar para o **mesmo** formato final que o endpoint `/api/produtos/...` retorna hoje
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
- **Passo 1:** chamar `getBackListProdutoLoja({ idCategoria })` (back não pagina).
  - se `includeDescendants=1`, usar árvore de `categorias.json` para obter ids descendentes e repetir chamadas, depois mesclar
- **Passo 2:** traduzir para `Produto[]` usando:
  - `categorias.json` para resolver categoria (`categoryId`, slug/label consistentes)
  - `brands.json` para resolver `brand` (fallback quando não houver)
- **Passo 3:** aplicar o contrato do endpoint `/api/produtos/by-categoria/...`:
  - paginação local `{ page, pageSize, total, totalPages }`
  - retorno `{ success:true, data: Produto[], page, pageSize, total, totalPages }`

5) `GET /api/lopes/produtos/by-id/[idProduto]` → `Produto`
- **Passo 1:** chamar `getBackProdutoLoja({ codProd: idProduto })`
- **Passo 2:** traduzir para `Produto` usando `categorias.json` e `brands.json` e aplicar fallback quando não houver correspondência
- **Passo 3:** garantir `slug`, `badges`, `stock/inStock` e shape final `{ success:true, data: Produto }`
- **Retorno final:** `{ success:true, data: Produto }`

6) `GET /api/lopes/produtos/by-slug/[slug]` → `Produto`
- **Passo 1:** extrair `idProduto` do slug (regra: `...-<id>`). Se não existir, retornar 400.
- **Passo 2/3:** reutilizar o fluxo do `by-id`.

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
  - **Passo 1/2 fora do runtime:** job/manual chama o back real e traduz para gerar `categorias.json`.
  - **Passo 3 no runtime:** endpoints de categorias leem `categorias.json` e só montam/filtram no formato final do mock.
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
  - **Passo 3 (runtime):** leitura de `brands.json` local e montagem do contrato final
  - **Sem rotina de atualização nesta fase**
- Regra de manutenção:
  - arquivo mantido localmente e alterado sob demanda
  - IDs estáveis para não quebrar links/filtros por `idBrand`
  - validação de schema antes de qualquer alteração manual

## Subplanos (referência)
- Operação de arquivos locais (categorias/brands): `subplano-operacao-arquivos-locais.md`
- Tradutor de produtos (inclui regra de resolver via categorias/brands): `subplano-tradutor-produtos.md`
- Endpoint by-categoria (includeDescendants + paginação local): `subplano-by-categoria-lopes.md`

## Pontos de Validação (o “pronto”)
- Para cada endpoint acima: `shape` de resposta idêntico ao equivalente em `/api/produtos/...` (mesmos campos e tipos).
- Erros: sempre `{ success:false, message }` com status HTTP coerente.
- Nada de chamada de API direto em componente: manter chamadas no server (route handler) e consumo no front via client atual.
