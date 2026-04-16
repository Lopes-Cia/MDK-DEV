# Tasks

- [ ] Task 1: Auditoria de UI stack (Tailwind/shadcn)
  - [ ] Verificar se existe `components/ui/dropdown-menu.tsx` no projeto `connect-ecommerce`.
  - [ ] Verificar se `@radix-ui/react-dropdown-menu` existe nas dependências.
  - [ ] Se faltar dependência, preparar a alteração em `package.json` (**requer aprovação**).

- [ ] Task 2: Criar/instalar o componente DropdownMenu (shadcn/ui)
  - [ ] Adicionar `components/ui/dropdown-menu.tsx` (padrão shadcn/ui) baseado em Radix.
  - [ ] Garantir estilo consistente com Tailwind e acessibilidade (teclado/aria) no padrão do shadcn.

- [ ] Task 3: Implementar dropdown no CategoryHeader
  - [ ] Substituir o `<a href="#">Todas as categorias</a>` por um trigger do dropdown.
  - [ ] Carregar categorias via `useProdutosStore` (ação `loadCategoriasTree`) e guardar estado local para loading/error.
  - [ ] Renderizar itens usando `categoria.slug` como `href`.
  - [ ] Remover/ajustar links hardcoded de categorias no desktop (manter apenas links não-categoria como “TEST API”, “Promoções”, etc. se desejado).

- [ ] Task 4: Validação manual
  - [ ] Abrir o dropdown e confirmar estado de loading/empty/error.
  - [ ] Clicar em uma categoria raiz e em uma subcategoria (se exibida) e confirmar navegação para o path completo.

# Task Dependencies
- Task 2 depende de Task 1.
- Task 3 depende de Task 1 (e de Task 2 se a opção shadcn/ui for adotada).

