# Paths Amigáveis no Catálogo Spec

## Why
O front precisa montar URLs amigáveis consistentes (ex.: `/produtos/<slug>`, `/categoria/<slug>`, `/marca/<slug>`). Hoje o JSON fornece apenas `slug` “puro”, o que força o front a adivinhar o prefixo e aumenta inconsistências entre telas/rotas.

## What Changes
- Adicionar campo `path` (ou `href`) nos objetos de **produto**, **categoria** e **marca** no catálogo JSON.
- Manter `slug` como “puro” (sem prefixos) e derivar `path` a partir do `slug`.
- Atualizar geradores (GEN-SEED) para já produzir os JSONs com `path`.
- Atualizar JSONs servidos pelo mock (Connect) para conter `path` em todos os pontos relevantes (listas, produto, categoria, marca e home/coleções).
- Ajustar consumo no front (quando aplicável) para usar `path` ao gerar links (sem mudar layout).

## Impact
- Affected specs: `produtosV2` (catálogo), `home/ecommerce` (coleções), `gen-seed`.
- Affected code/dados:
  - `WWW/MICROSERVICE/GEN-SEED/src/*` e `WWW/MICROSERVICE/GEN-SEED/data/*.json`
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/*.json`
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/*` (se necessário para enriquecer/normalizar)
  - `WWW/REFERENCIAS/connect-ecommerce/*` (uso do `path` em links)

## ADDED Requirements
### Requirement: Produto tem path amigável
O sistema SHALL expor `path` em cada produto, derivado do `slug` puro.

#### Scenario: Produto com path
- **WHEN** um produto é retornado por qualquer endpoint (lista, by-id, by-slug, home)
- **THEN** ele contém `slug` (puro) e `path` no formato `/produtos/<slug>`
- **AND** `path` é sempre string não vazia quando `slug` é válido

### Requirement: Categoria tem path amigável
O sistema SHALL expor `path` em cada categoria, derivado do `slug` puro.

#### Scenario: Categoria com path
- **WHEN** uma categoria é retornada (árvore, categoria por id, categorias destaque na home)
- **THEN** ela contém `slug` (puro) e `path` no formato `/categoria/<slug>`

### Requirement: Marca tem path amigável
O sistema SHALL expor `path` em cada marca, derivado do `slug` puro.

#### Scenario: Marca com path
- **WHEN** uma marca é retornada (lista de marcas, brandById, produtos dentro de brandById, home)
- **THEN** ela contém `slug` (puro) e `path` no formato `/marca/<slug>`

### Requirement: Cobertura no JSON aninhado
O sistema SHALL garantir que `path` exista também nas estruturas aninhadas usadas pelo front.

#### Scenario: Produto com categoria/marca aninhadas
- **WHEN** um produto contém `category` e `brand` como objetos
- **THEN** `product.category.path` e `product.brand.path` existem e seguem seus padrões

## MODIFIED Requirements
### Requirement: Slug permanece puro
O campo `slug` não deve receber prefixos de rota (ex.: não virar `/produtos/...`).

## REMOVED Requirements
### Requirement: Front deduzir prefixos de URL a partir do slug
**Reason**: aumenta inconsistências e duplicação de regra no UI.
**Migration**: UI deve usar `path` quando precisar montar link amigável.

