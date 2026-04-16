# GEN-SEED (Adega) — Spec

## Why
Precisamos de um gerador de seed para alimentar um catálogo realista de ecommerce de **adega**, com estrutura de categorias consistente e um volume mínimo de produtos para testes e demos.

## What Changes
- Criar um módulo/projeto `GEN-SEED` dentro de `WWW/MICROSERVICE` para gerar arquivos de seed.
- Adicionar `config.json` para parametrizar a geração (output e limites).
- Gerar `./data/categorias.json` e `./data/produtos.json` para um catálogo de adega.
- Validar regras de consistência (IDs, slugs, parentId/categoryId, estoque/inStock) e falhar (throw) quando violadas.

## Impact
- Affected specs: geração de seed para catálogo (categorias/produtos) com validação rígida
- Affected code:
  - Novo módulo em `WWW/MICROSERVICE/GEN-SEED` (scripts/arquivos do gerador)
  - Saída em `WWW/MICROSERVICE/GEN-SEED/data` (ou diretório configurado)

## ADDED Requirements

### Requirement: Projeto GEN-SEED
O sistema SHALL criar um módulo/projeto `GEN-SEED` dentro de `WWW/MICROSERVICE` contendo:
- `config.json`
- Um script Node (ESM) executável para geração dos seeds

#### Scenario: Estrutura criada
- **WHEN** o projeto é adicionado ao repositório
- **THEN** existe `WWW/MICROSERVICE/GEN-SEED` com `config.json` e o script do gerador

### Requirement: Configuração (config.json)
O gerador SHALL ler `config.json` e suportar os campos mínimos:
- `outputDir` (string; default `./data`)
- `categories.rootsMin` (number; >= 5)
- `categories.childrenMin` (number; >= 3)
- `categories.childrenMax` (number; <= 5)
- `categories.grandchildrenMin` (number; >= 2)
- `categories.grandchildrenMax` (number; <= 4)
- `products.minTotal` (number; >= 120)

#### Scenario: Defaults aplicados
- **WHEN** `outputDir` não estiver definido
- **THEN** o gerador grava em `./data` relativo ao projeto `GEN-SEED`

### Requirement: Geração de categorias (árvore)
O gerador SHALL produzir `categorias.json` contendo uma árvore de categorias com:
- No mínimo 5 categorias raiz (`parentId: 0`)
- Para cada raiz: 3 a 5 filhos
- Para cada filho: 2 a 4 netos

O gerador SHALL garantir consistência mínima de categorias:
- `id` é `number`
- `name` é `string`
- `slug` é `string` e único no conjunto de categorias
- `parentId` é `number` e é `0` (raiz) ou referencia um `id` existente

#### Scenario: Árvore válida
- **WHEN** o gerador finaliza com sucesso
- **THEN** a árvore atende os limites de raiz/filho/neto e passa nas validações

### Requirement: Geração de produtos (>= 120)
O gerador SHALL produzir `produtos.json` com no mínimo 120 produtos distribuídos entre as categorias **netas** (terceiro nível).

O gerador SHALL emitir produtos compatíveis com o padrão do script base (campos recomendados):
- `id` (number)
- `sku` (string)
- `name` (string)
- `slug` (string)
- `categoryId` (number)
- `brand` (string)
- `unitLabel` (string)
- `sizeLabel` (string)
- `price` (number)
- `compareAtPrice` (number | null)
- `badges` (string[])
- `image` (string)
- `stock` (number)
- `inStock` (boolean)

O gerador SHALL garantir consistência mínima de produtos:
- `id` é único (number)
- `slug` é único (string)
- `categoryId` existe e referencia uma categoria (preferencialmente neta)
- `stock` é number
- `inStock` é boolean e consistente: `(stock > 0) === inStock`

#### Scenario: Produtos válidos
- **WHEN** o gerador finaliza com sucesso
- **THEN** `produtos.json` contém >= 120 itens e passa nas validações

### Requirement: Domínio (ecommerce de adega)
O gerador SHALL produzir categorias e produtos condizentes com um ecommerce de adega (bebidas e conveniência), incluindo exemplos de linhas como:
- Cervejas (lata/long neck/packs), vinhos (tinto/branco/espumante), destilados (whisky/vodka/gin), não alcoólicas (energéticos/refrigerantes/água), conveniência (gelo/snacks/acessórios)

#### Scenario: Catálogo coerente
- **WHEN** o gerador cria `categorias.json` e `produtos.json`
- **THEN** os dados refletem um catálogo típico de adega (nomes, marcas e tamanhos plausíveis)

### Requirement: Falha rápida (throw) em violação
O gerador SHALL falhar (throw) se qualquer regra do desenho for violada:
- Menos de 5 raízes
- Alguma raiz com filhos fora de 3–5
- Algum filho com netos fora de 2–4
- Menos de 120 produtos
- `categoryId` inválido
- `slug` duplicado (categorias ou produtos)
- `inStock` inconsistente com `stock`

#### Scenario: Violação detectada
- **WHEN** uma regra de validação falha
- **THEN** o processo encerra com erro e não reporta sucesso

## MODIFIED Requirements
N/A

## REMOVED Requirements
N/A

