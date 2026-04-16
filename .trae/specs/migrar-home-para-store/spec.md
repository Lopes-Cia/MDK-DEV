# Migrar Home Para Store Spec

## Why
A home atual usa conteúdo majoritariamente estático e não reflete o catálogo/coleções vindos da integração. Precisamos manter o design atual, mas trocar a fonte de dados para o store, reduzindo hardcode e habilitando evolução sem retrabalho visual.

## What Changes
- Mapear a home atual e separar claramente estrutura visual (layout) de fonte de dados.
- Conectar a home ao `ecommerce-store` (`loadHome`) para consumir banners, categorias destaque e coleções de produtos.
- Reusar componentes atuais de card e carrossel quando já atenderem o contrato.
- Criar componentes faltantes apenas quando não houver equivalente funcional.
- Definir mapeadores/view-models para adaptar payload do store ao formato esperado pelos componentes visuais.
- Garantir estados de `loading`, `empty` e `error` na home sem quebrar o design atual.
- **BREAKING** remover dependência de blocos estáticos da home para seções cobertas pelo store.

## Impact
- Affected specs: `produtosV2` (consumo de produtos/categorias), `home/ecommerce` (coleções/banners).
- Affected code:
  - `WWW/REFERENCIAS/connect-ecommerce/app/(shop)/page.tsx`
  - `WWW/REFERENCIAS/connect-ecommerce/stores/ecommerce-store.ts`
  - `WWW/REFERENCIAS/connect-ecommerce/lib/api/ecommerce.ts`
  - `WWW/REFERENCIAS/connect-ecommerce/app/(shop)/_components/*`
  - novos mapeadores em `WWW/REFERENCIAS/connect-ecommerce/lib/*` (se necessário)

## ADDED Requirements
### Requirement: Home Data-Driven Mantendo Design
O sistema SHALL renderizar a home com o mesmo layout visual atual, usando como fonte primária os dados carregados do `ecommerce-store`.

#### Scenario: Home renderiza com dados do store
- **WHEN** a página home é aberta
- **THEN** a página chama `loadHome()` do `ecommerce-store`
- **AND** renderiza banners, categorias destaque e coleções com dados da resposta
- **AND** mantém o mesmo padrão visual existente

#### Scenario: Estado de carregamento
- **WHEN** `homeStatus` está em `loading`
- **THEN** a home exibe placeholders/skeletons compatíveis com o layout atual

#### Scenario: Estado vazio
- **WHEN** o payload de home vem sem dados em uma seção
- **THEN** a seção correspondente não quebra layout e aplica fallback definido

#### Scenario: Estado de erro
- **WHEN** `homeStatus` está em `error`
- **THEN** a home exibe feedback de erro de UI e preserva estrutura geral da página

### Requirement: Reuso de Componentes de Card e Carrossel
O sistema SHALL priorizar componentes já existentes para cards de produto/categoria e carrosséis.

#### Scenario: Componente existente atende contrato
- **WHEN** um componente existente atende os dados necessários
- **THEN** ele é reutilizado sem criar duplicata

#### Scenario: Componente inexistente ou incompatível
- **WHEN** não houver componente compatível
- **THEN** um novo componente é criado seguindo padrão visual e de código do projeto

## MODIFIED Requirements
### Requirement: Fonte de dados da home
A home deixa de depender de dados estáticos para seções cobertas pelo endpoint de home e passa a consumir o store como fonte oficial.

## REMOVED Requirements
### Requirement: Seções da home fixas por hardcode
**Reason**: impede atualização dinâmica do conteúdo e diverge da fonte oficial de dados.
**Migration**: substituir arrays e blocos estáticos por dados normalizados vindos do `ecommerce-store`, com fallback visual para ausência de dados.

