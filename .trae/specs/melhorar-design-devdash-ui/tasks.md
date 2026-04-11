# Tasks
- [ ] Pesquisa séria + pacote reutilizável em IA (DevDash + ecommerce)
  - [ ] Consolidar referências + termos de busca + síntese em um arquivo em `IA/` (sem código de runtime)
  - [ ] Definir baseline de tokens (cores/status, tipografia, spacing, radius, shadow) e regras de uso
  - [ ] Definir direção visual final (recomendado: “Console produtivo”) e trade-offs documentados
  - [ ] Definir estratégia do App Shell (decisão): Sidebar desktop + Drawer mobile; TenantSelect no rodapé da sidebar

- [ ] Auditoria UI atual (Home + TopNav + monitores)
  - [ ] Inventariar padrões de card/link/hover/focus e listar inconsistências no DevDash
  - [ ] Definir a hierarquia final da Home (Status vs Atalhos) e estrutura de grid responsiva (360/768/1440)

- [ ] Adotar UI kit (coss/ui) no DevDash
  - [ ] Instalar setup base do coss (style + tokens) via shadcn registry
  - [ ] Configurar tema/tokens (cores, radius, border, focus ring) alinhado ao Tailwind v4
  - [ ] Instalar componentes necessários (mínimo: Button, Card, Badge, Tooltip, Menu, Drawer)

- [ ] Refatorar componentes base
  - [ ] Criar `AppCard` (card-link) e `StatusCard` (monitor) com variações consistentes
  - [ ] Centralizar estilos de ícone-botão (tamanho, foco, disabled, tooltips)

- [ ] App Shell (Sidebar + Drawer)
  - [ ] Criar navegação por Sidebar no desktop e Drawer no mobile (sem overflow)
  - [ ] Mover TenantSelect para o rodapé da sidebar e remover redundância do header
  - [ ] Adicionar logomarca no topo usando `IA/ASSETS/logoLopes.png` (copiar para assets públicos do app)

- [ ] Redesenhar Home
  - [ ] Construir seção “Status” com 2 monitores (Mock-End e Tenant/N1) usando `StatusCard`
  - [ ] Construir seção “Atalhos” com cards-link usando `AppCard`
  - [ ] Ajustar espaçamento/tipografia para ficar “premium” (hierarquia de título, subtítulo, descrições)

- [ ] Melhorar monitores (clareza operacional)
  - [ ] Exibir estado real e estado desejado sem conflito visual (ON/OFF vs UP/DOWN vs BUSY)
  - [ ] Adicionar tooltip/label acessível nos botões de ícone (power/engrenagem)

- [ ] Ajustar navegação (ativo + a11y)
  - [ ] Implementar estado ativo evidente (aria-current + estilo) na navegação do App Shell
  - [ ] Garantir foco visível e alvo mínimo em links/botões (desktop e mobile)

- [ ] Validação visual e regressão mínima
  - [ ] Checar acessibilidade mínima (aria-label/focus-visible) em botões por ícone
  - [ ] Validar alinhamentos (grid, alturas, gaps) em mobile e desktop

# Task Dependencies
- UI kit depende do baseline de tokens.
- Redesenho da Home depende do UI kit e dos componentes base.
