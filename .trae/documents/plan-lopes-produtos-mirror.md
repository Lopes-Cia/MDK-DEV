# Plano — Criar /api/lopes/produtos/* espelhando /api/produtos/*

## Resumo
Criar uma família de endpoints `GET /api/lopes/produtos/...` que entregue **o mesmo contrato** dos endpoints atuais `GET /api/produtos/...`, mas tendo como **fonte** o Lopes Back (endereços `/webservice/integration/*` via `lopesBackClient.ts`).

Cada endpoint “lopes/produtos” segue 3 etapas:
- **Passo 0 (fonte):** chamar o back real (Lopes Back).
- **Passo 1 (tradução):** normalizar o retorno do Lopes para estruturas intermediárias equivalentes ao “flat” do mock.
- **Passo 2 (ajuste final):** produzir exatamente o shape que o front já consome (compatível com o contrato do mock/endpoints `/produtos/...`).

## Contexto do que já existe (base do plano)

### Endpoints /produtos (atuais)
Há 8 endpoints em `app/api/produtos/*`, todos retornando payload no padrão `{ success: true, data: ... }` (ou `{ success:false, message }` em erro), delegando para `lib/integration/produtosService.ts`:
- `/api/produtos/categorias`
- `/api/produtos/categorias/[idCategoria]`
- `/api/produtos/categorias/by-slug/[...slug]`
- `/api/produtos/by-categoria/[idCategoria]`
- `/api/produtos/by-id/[idProduto]`
- `/api/produtos/by-slug/[slug]`
- `/api/produtos/brands`
- `/api/produtos/brands/[idBrand]`

### Endpoints /lopes (atuais)
Já existem endpoints “raw” do Lopes Back:
- `/api/lopes/categoria` → `getBackCategoria()`
- `/api/lopes/categorias` → hoje já faz Passo 0+1+2 para categorias (gera árvore + retorna `{ success:true, data: CategoriaNode[] }`)
- `/api/lopes/produto-loja` → `getBackProdutoLoja()`
- `/api/lopes/produtos-loja` → `getBackListProdutoLoja()`

### Passo 1 já criado (categorias)
Arquivo util server-only com tradução do Lopes para `Categoria[]`:
- `lib/mockups/syncDataFromBackToFront.ts`
  - `translateLopesCategoriasToCategorias(input): Categoria[]` (Passo 1)
  - `buildCategoriasTreeFromCategorias(categorias): CategoriaNode[]` (Passo 2)
  - `translateLopesCategoriasToCategoriasTree(input): CategoriaNode[]` (Passo 1+2)

## Objetivo final do plano
Adicionar a família `app/api/lopes/produtos/*` (mesma matriz do `/api/produtos/*`), de forma que:
- Front consiga trocar a origem de `/produtos/*` para `/lopes/produtos/*` com mudança mínima (um path base), e reverter rápido.
- Todas as respostas tenham o mesmo contrato (especialmente `success/data` e formatos de `data`).

## Design de Rotas (o que será criado)

### 1) Categorias (árvore)
**Novo:** `GET /api/lopes/produtos/categorias`
- **Passo 0:** `getBackListCategoria()`
- **Passo 1:** `translateLopesCategoriasToCategorias()`
- **Passo 2:** `buildCategoriasTreeFromCategorias()`
- **Resposta:** `{ success:true, data: CategoriaNode[] }`
- Observação: manter `id:0` no flat, mas **não incluir** `id:0` como nó na árvore (mesma lógica já aplicada).

### 2) Categoria por id (inclui filhos imediatos)
**Novo:** `GET /api/lopes/produtos/categorias/[idCategoria]`
- **Passo 0:** `getBackListCategoria()` (pega lista completa, evita depender de endpoint “categoria” isolado)
- **Passo 1:** `translateLopesCategoriasToCategorias()`
- **Passo 2:** gerar:
  - `byId: Map<number,Categoria>`
  - `childrenByParent: Map<number,Categoria[]>` (filhos imediatos)
  - `category = byId.get(idCategoria)`
  - `children = childrenByParent.get(idCategoria) ?? []`
- **Resposta:** `{ success:true, data: { category: Categoria, children: Categoria[] } }`
- Regra: se não achar `category`, devolver `{ success:false, message }` com 404 (ou 200 com null — decidir e manter consistente).

### 3) Categoria por slug (retorna nó em árvore)
**Novo:** `GET /api/lopes/produtos/categorias/by-slug/[...slug]`
- **Passo 0:** `getBackListCategoria()`
- **Passo 1:** `translateLopesCategoriasToCategorias()`
- **Passo 2:** construir árvore e localizar nó por slug normalizado.
- **Resposta:** `{ success:true, data: { category: CategoriaNode } }`

### 4) Produtos por categoria (inclui includeDescendants + paginação)
**Novo:** `GET /api/lopes/produtos/by-categoria/[idCategoria]`
- **Passo 0:** `getBackListProdutoLoja()` (ver observação de performance abaixo)
- **Passo 1:** criar tradutor TS (server-only) que transforma `ProdutoBean` (Lopes) em “produto do contrato” (mesmo shape que hoje o front recebe).
- **Passo 2:** implementar:
  - `includeDescendants` (0|1) usando a árvore de categorias do Passo 2 de categorias para obter `validCategoryIds`
  - filtrar produtos por categoria (id da categoria principal do produto)
  - paginar com `{ page, pageSize, total, totalPages }`
- **Resposta:** mesmo shape do endpoint atual `/api/produtos/by-categoria/[idCategoria]` (inclui `success:true` e paginação).

**Observação (decisão necessária):** o Lopes Back não expõe `includeDescendants`; para simular, há duas abordagens:
1) Buscar **todos** os produtos 1 vez e filtrar/paginar localmente (simples, potencialmente pesado).
2) Fazer N chamadas por categoria descendente e mesclar (mais complexo, potencialmente mais lento).
O plano assume (1) inicialmente para ficar determinístico e simples, e depois otimiza se necessário.

### 5) Produto por id
**Novo:** `GET /api/lopes/produtos/by-id/[idProduto]`
- **Passo 0:** `getBackProdutoLoja({ codProd: idProduto })`
- **Passo 1:** tradutor TS (server-only) do produto (Lopes → contrato do front)
- **Passo 2:** preencher categoria/brand no shape final (usando fallback id:0 se não houver correspondência).
- **Resposta:** `{ success:true, data: Produto }`

### 6) Produto por slug
**Novo:** `GET /api/lopes/produtos/by-slug/[slug]`
- **Passo 0:** extrair `idProduto` do slug (padrão `...-<id>`). Se não conseguir, retornar 400.
- **Passo 0 (continuação):** chamar mesmo fluxo do by-id.
- **Passo 1/2:** iguais ao by-id.

### 7) Brands
**Novo:** `GET /api/lopes/produtos/brands`
**Novo:** `GET /api/lopes/produtos/brands/[idBrand]`
- **Ponto aberto:** não existe endpoint explícito de marcas no `lopesBackClient.ts`.
- Proposta inicial (compatível com o que já existe no mock): retornar apenas `{ id:0, name:"No Brand", ... }`.
- Se precisar marcas reais: derivar marcas a partir da lista de produtos (Passo 0 de produtos), exigindo regra clara de onde vem “marca” no Lopes (campo inexistente no `ProdutoBean` atual).

## Organização de Código (onde colocar tradutores)
Para manter reversão fácil e evitar acoplamento em `store`, os tradutores ficam server-only:
- Manter categorias em `lib/mockups/syncDataFromBackToFront.ts` (já existe).
- Criar novos tradutores para “produtos” e “brands” em arquivos dedicados, ex.:
  - `lib/mockups/syncLopesProdutosToFront.ts` (Passo 1/2 de produtos)
  - (ou mover para `lib/integration/mappers/` depois, quando estabilizar)

## Estratégia de Reversão (fácil)
- Nenhum endpoint `/api/produtos/*` é alterado.
- O front troca a origem só quando você quiser:
  - alterar o path base no `lib/api/produtos.ts` (como fizemos no teste e revertimos) para apontar para `/lopes/produtos/...`.
- Reverter = voltar o path base para `/produtos/...`.

## Verificações
- Validar que cada `/api/lopes/produtos/*` responde com o mesmo shape do respectivo `/api/produtos/*`.
- Validar no front real trocando somente a origem de `getCategoriasTree()` (ou equivalente) e conferindo que a UI não quebra.
- Conferir `GetDiagnostics` sem erros TS novos.

## Entregáveis
- 8 novos route handlers em `app/api/lopes/produtos/*` (paralelos aos `/api/produtos/*`).
- 1–2 módulos TS server-only de tradução (Passo 1/2) para produtos (e brands, se aplicável).

