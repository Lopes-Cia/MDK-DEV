# Subplano — Tradutor de Produtos (com fallback de categoria e marca)

## Objetivo
- Definir o plano do tradutor de produtos com base no arquivo atual `lib/mockups/syncDataFromBackToFront.mjs`, com foco nas regras de fallback de categoria e marca.

## Referência Atual
- Arquivo base: `lib/mockups/syncDataFromBackToFront.mjs`
- Fonte principal dos produtos no tradutor atual:
  - entrada de lista (`j1`) com campos como `codProd`, `descricaoEcomerce`, `descricaoErp`, `ean`, `preco`, `qtEstoque`, `categoriaPrinciapal`, `imagem`
- Saída atual do tradutor:
  - `produtos.json`
  - `categorias.json`
  - `brands.json`

## Processos Padrão (nomenclatura)
- Passo 1: chamada no back-end
- Passo 2: tradução
- Passo 3: contrato

## Regra Atual de Fallback (ponto central)
- Categoria fallback atual no tradutor:
  - `id: 0`
  - `name: "sem categoria"`
  - `slug: "/categoria/sem-categoria"`
- Brand fallback atual no tradutor:
  - `id: 0`
  - `name: "No Brand"`
  - `slug: "/marca/no-brand"`
- Comportamento atual:
  - se não houver categoria válida, produto cai em categoria fallback
  - se não houver marca válida, produto cai em brand fallback

## Instrução Obrigatória de Tradução (categoria e marca)
- Para traduzir produto, sempre consultar primeiro as fontes locais:
  - `categorias.json` para resolver dados de categoria
  - `brands.json` para resolver dados de marca
- Ordem da regra:
  - 1) tentar resolver categoria/marca pelo JSON local
  - 2) se não encontrar correspondência, aplicar fallback (`id:0`)
- Objetivo:
  - manter consistência entre tradução de produto e snapshots oficiais de categorias/brands
  - evitar divergência de label/slug entre endpoints

## Plano do Tradutor de Produtos (6 passos)
1) Consolidar Passo 1 (back-end) para produtos:
   - usar fonte real dos produtos (equivalente ao fluxo de `getListProdutoLoja` / `getProdutoLoja`).
2) Formalizar Passo 2 (tradução) em módulo dedicado:
   - mapear para contrato `Produto` (`id, sku, name, slug, categoryId, brand, unitLabel, sizeLabel, price, compareAtPrice, badges, image, stock, inStock`).
3) Manter fallback explícito e rastreável:
   - categoria fallback (`id:0`) e brand fallback (`id:0`) permanecem obrigatórios nesta fase.
4) Separar responsabilidade de snapshots:
   - atualização de `produtos.json` pelo fluxo de atualização
   - consumo em runtime somente via leitura local para contrato final
5) Definir validações mínimas:
   - `id`, `name`, `slug`, `price`, `stock`, `inStock`, `categoryId`, `brand`
   - `price` numérico válido, `stock >= 0`, `slug` estável com `-<id>` no final
6) Fechar Passo 3 (contrato):
   - garantir shape final idêntico ao consumido hoje pelo front em `/api/produtos/*`

## Riscos e Decisões
- Risco: fallback mascarar problema de origem (categoria/marca ausente).
- Decisão recomendada:
  - manter fallback nesta fase para estabilidade do frontend
  - registrar contagem de itens em fallback no processo de atualização para monitoramento técnico

## Critérios de Pronto
- Tradutor de produtos documentado com fluxo Passo 1/2/3.
- Regras de fallback de categoria e marca explícitas e aprovadas.
- Contrato final alinhado com endpoints atuais de produtos.
- Sem mudança de código de runtime neste subplano (somente definição).
