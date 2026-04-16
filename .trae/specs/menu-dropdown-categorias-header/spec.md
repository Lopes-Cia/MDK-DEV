# Menu Dropdown de Categorias (Header) Spec

## Why
O header do catálogo está com categorias hardcoded e não reflete a árvore real vinda do `produtos-store`. Com os slugs hierárquicos no mock-end, o front precisa navegar usando `categoria.slug` como path completo.

## What Changes
- Substituir o link “Todas as categorias” do header por um menu dropdown alimentado por `loadCategoriasTree()` do `produtos-store`.
- Renderizar itens do dropdown usando `categoria.slug` (path completo, ex.: `/categoria/bebidas/cervejas/lager`) como destino de navegação.
- Exibir estados de `loading/empty/error` no dropdown (sem quebrar o layout do header).
- **Opcional (dependente de aprovação de dependência):** adicionar componente `DropdownMenu` no padrão shadcn/ui usando Radix (`@radix-ui/react-dropdown-menu`) e usá-lo no header.

## Impact
- Affected specs: navegação por categoria via slug hierárquico; UI de header dinâmica.
- Affected code:
  - `components/layout/CategoryHeader.tsx`
  - `stores/produtos-store.ts` (consumo apenas, sem mudança de contrato)
  - Possível adição de `components/ui/dropdown-menu.tsx` (se adotar shadcn/ui dropdown)
  - `package.json` (somente se for necessário adicionar `@radix-ui/react-dropdown-menu`)

## ADDED Requirements
### Requirement: Dropdown de categorias no header
O sistema SHALL exibir um dropdown “Todas as categorias” no header desktop, com itens gerados a partir do `produtos-store` (`categoriasTree`).

#### Scenario: Success case
- **WHEN** o usuário abre o dropdown
- **THEN** o menu mostra a lista de categorias (ao menos o 1º nível; filhos podem ser exibidos como subitens)
- **AND** ao clicar em um item, o app navega para `categoria.slug` (path completo)

#### Scenario: Loading
- **WHEN** o dropdown é aberto e a árvore ainda não foi carregada
- **THEN** o menu exibe um item “Carregando…” desabilitado

#### Scenario: Empty
- **WHEN** a árvore de categorias vem vazia
- **THEN** o menu exibe um item “Sem categorias” desabilitado

#### Scenario: Error
- **WHEN** ocorre erro ao carregar categorias
- **THEN** o menu exibe um item “Erro ao carregar” desabilitado e mantém a navegação do header funcional

## MODIFIED Requirements
### Requirement: Header não deve depender de categorias hardcoded
O header desktop SHALL deixar de depender de links hardcoded para categorias (ex.: “Bebidas”, “Laticínios”) e passar a apresentar categorias via dropdown alimentado pelo store.

## REMOVED Requirements
N/A

