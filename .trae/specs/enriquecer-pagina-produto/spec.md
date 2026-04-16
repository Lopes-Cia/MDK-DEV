# Enriquecer Página de Produto (Detalhe) Spec

## Why
A página atual de produto em `/produtos/[...slug]` está simplificada e não aproveita os blocos ricos da página antiga em `/products/[id]/[slug]` (resumo, informações técnicas, descrição completa, etc.). Também não exibe a marca (com imagem e link) apesar de termos esses dados no payload do produto.

## What Changes
- Reaproveitar o layout rico da página antiga de produto (`app/(shop)/products/[id]/[slug]/page.tsx` e `_components/*`) na rota nova `/produtos/[...slug]`, mantendo a fonte de dados atual (store `produtos-store` via `loadProdutoBySlug`).
- Duplicar os componentes de UI antigos de produto (ImageViewer, ProductSummary, ProductActivity, ProductInfo) para um namespace próprio de `/produtos`, refatorando-os para consumir o novo view model.
- Exibir informações de marca: nome, imagem pequena e link para a página de marca (`/marca/<slug>`), com fallback visual quando dados de marca faltarem.
- Mapear os campos que hoje não existem no payload do produto (ex.: descrição longa, ingredientes, aviso legal, specs técnicas) em `/IA/DESENHOS/falta-produto.md` e definir fallbacks temporários enquanto não forem providos pela API.
- Manter navegação e SEO consistentes com o padrão atual (slug canônico, breadcrumbs, imagens otimizadas/local).

## Impact
- Affected specs:
  - refatorar-paginas-catalogo (usa `/produtos/[...slug]` como rota final de produto).
- Affected code:
  - Página nova (atual): `WWW/REFERENCIAS/connect-ecommerce/app/(shop)/produtos/[...slug]/produto-client.tsx`
  - Páginas antigas (referência): 
    - `app/(shop)/products/[id]/[slug]/page.tsx`
    - `app/(shop)/products/[id]/_components/ImageViewer.tsx`
    - `app/(shop)/products/[id]/_components/ProductSummary.tsx`
    - `app/(shop)/products/[id]/_components/ProductActivity.tsx`
    - `app/(shop)/products/[id]/_components/ProductInfo.tsx`
  - Store de produtos: `stores/produtos-store.ts`
  - Rota de marca: `app/(shop)/marca/[...slug]/page.tsx`
  - Pasta de desenhos: `IA/DESENHOS/falta-produto.md`

## ADDED Requirements

### Requirement: Página de produto rica baseada na versão antiga
O sistema SHALL fornecer uma página de detalhe de produto em `/produtos/[...slug]` com layout equivalente (ou superior) à antiga `/products/[id]/[slug]`, incluindo:
- galeria de imagens (ImageViewer),
- resumo com preço e informações chave (ProductSummary),
- bloco de compra/atividade (ProductActivity),
- bloco de informações importantes e especificações (ProductInfo).

#### Scenario: Exibição completa de produto
- **WHEN** o usuário acessa `/produtos/<slug-do-produto>`
- **THEN** a página exibe imagem principal, thumbnails, preço atual, preço antigo (quando houver desconto), informações da categoria, bloco de compra e seções de descrição/ingredientes/aviso legal/especificações.

### Requirement: Marca com imagem pequena e link
O sistema SHALL exibir as informações de marca do produto (quando disponíveis) no detalhe de produto:
- nome da marca,
- imagem pequena (logo),
- link para a página da marca (`/marca/<slug>`).

#### Scenario: Marca com dados completos
- **WHEN** o payload do produto contém `brand` com `name`, `slug` e `image`
- **THEN** a página exibe um bloco de marca com miniatura da imagem, nome e um link clicável para `/marca/<slug>`.

#### Scenario: Marca sem imagem ou slug
- **WHEN** os campos de imagem ou slug da marca estiverem ausentes
- **THEN** a página exibe um fallback visual (texto “Marca” e/ou placeholder de imagem) sem quebrar o layout
- **AND** não renderiza link quando não houver slug válido.

### Requirement: Lista de campos faltantes do produto
O sistema SHALL manter um documento em `/IA/DESENHOS/falta-produto.md` listando todos os campos esperados pela UI de produto que ainda não são fornecidos pelo payload ou view model, por exemplo:
- descrição longa (fullDescription),
- ingredientes,
- aviso legal,
- especificações técnicas (lista label/value),
- informações de loja (shop),
- preço por unidade (pricePerUnit),
- informações adicionais exibidas nos blocos antigos.

#### Scenario: Documentar gaps de dados
- **WHEN** um campo é necessário para algum bloco de UI de produto e não existe nos dados atuais
- **THEN** ele é listado em `/IA/DESENHOS/falta-produto.md` com uma breve descrição e exemplo esperado.

### Requirement: Fallbacks temporários para campos faltantes
O sistema SHALL definir fallbacks seguros para todos os campos do detalhe de produto que dependem de dados ainda não disponíveis, garantindo que:
- o layout nunca quebre,
- textos placeholders indiquem claramente conteúdo ausente (ex.: “Descrição não disponível no momento”),
- listas/tabelas suportem estado vazio (“Nenhuma informação técnica disponível”).

#### Scenario: Campo textual ausente
- **WHEN** `fullDescription`, `ingredients` ou `legalNotice` estiverem vazios ou ausentes no payload
- **THEN** a UI mostra um texto padrão informando que a informação não está disponível, sem deixar o bloco vazio.

#### Scenario: Especificações técnicas vazias
- **WHEN** a lista de especificações técnicas estiver vazia
- **THEN** o bloco de “Especificações do produto” exibe uma mensagem de ausência de dados em vez de uma tabela vazia.

### Requirement: View model de produto unificado para `/produtos`
O sistema SHALL construir um view model único de produto a partir do `loadProdutoBySlug`, contendo, no mínimo:
- `id`, `name`, `slug`,
- `images[]`,
- `price`, `oldPrice` (quando houver),
- `category` / `categoryName`,
- `brand` (estrutura com id, name, slug, image, com fallbacks),
- campos textuais/fallbacks para descrição, ingredientes, aviso legal, especificações.

#### Scenario: Adaptação do view model
- **WHEN** o produto é carregado via store
- **THEN** o componente de página monta esse view model e o passa para os componentes de UI duplicados (Summary, Activity, Info) sem depender do antigo `toProductDetailViewModel`.

## MODIFIED Requirements

### Requirement: Página antiga `/products/[id]/[slug]` como referência, não rota final
O comportamento atual da página antiga de produto (`/products/[id]/[slug]`) SHALL servir apenas como referência visual e de UI. A experiência oficial de produto passa a ser `/produtos/[...slug]`.

#### Scenario: Acesso direto por slug
- **WHEN** o usuário navega pela loja (cards, categorias, marcas)
- **THEN** os links de produto apontam para `/produtos/<slug>` e não mais para `/products/...`.

## REMOVED Requirements

### Requirement: Dependência do view model legado na página oficial
**Reason**: O view model `toProductDetailViewModel` está acoplado ao fluxo antigo de integração. A nova página consome diretamente o store e padroniza o view model no front.
**Migration**: 
- a página antiga continua funcionando como rota de referência/QA se necessário, mas a implementação nova não depende mais do view model legado;
- qualquer novo campo necessário deve ser adicionado primeiro ao payload/store e documentado em `/IA/DESENHOS/falta-produto.md`.

