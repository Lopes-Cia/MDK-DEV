# DevDash UI TOP (Redesign com Pesquisa) Spec

## Why
O DevDash já funciona, mas a UI ainda passa sensação de “provisório”: hierarquia visual fraca, padrões inconsistentes de cards/controles e pouca clareza operacional (estado real vs estado desejado). A meta é deixar o painel “TOP” (premium) e legível em 2–3 segundos.

## What Changes
- Entregar uma pesquisa rastreável (fontes + termos de busca) e consolidar um “baseline” de design system reutilizável (DevDash + ecommerce).
- Adotar tokens semânticos (cores/typography/spacing/radius/shadow) com CSS variables + Tailwind v4 `@theme inline` e convenção `bg-*/text-*-foreground`.
- Adotar componentes base via coss/ui (copy/paste) e padronizar estados (hover/focus/pressed/disabled/busy).
- Redesenhar Home com hierarquia clara: “Status” (monitores) + “Atalhos” (cards de navegação).
- Implementar App Shell premium com **Sidebar no desktop + Drawer no mobile**, com navegação clara e sem overflow.
- Colocar **TenantSelect no rodapé da sidebar**.
- Incluir **logomarca** no App Shell usando `IA/ASSETS/logoLopes.png`.
- **BREAKING (UI)**: mudanças visuais e de layout podem mudar posição/estilos; sem mudança de contratos de API e mantendo a regra “UI não chama `/api/*` direto”.

## Impact
- Affected specs: Home / monitores / app shell (sidebar/drawer) / componentes de UI base.
- Affected code:
  - `WWW/MICROSERVICE/devdash/src/app/layout.tsx`
  - `WWW/MICROSERVICE/devdash/src/app/page.tsx`
  - `WWW/MICROSERVICE/devdash/src/app/_components/*` (cards/monitores/nav)
  - `WWW/MICROSERVICE/devdash/src/stores/*` (apenas para estado de UI quando necessário)

## Pesquisa (Evidências & Síntese)
### Fontes primárias (base para tokens)
- Tailwind v4 define “theme variables” como design tokens e suporta `@theme`/`@theme inline` em CSS para gerar utilities e referenciar CSS variables externas. Fonte: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/theme.mdx e https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/colors.mdx
- shadcn/ui recomenda theming via CSS variables e usa convenção `background/foreground` + lista de variáveis (incluindo `--radius`, `--ring`, `--border`). Fonte: https://v3.shadcn.com/docs/theming
- Radix Colors documenta aliasing semântico (ex.: `accent`, `danger`, `warning`) e descreve o uso típico por step (1–12) para fundos, bordas, hover, solid e texto (incluindo “focus ring”). Fonte: https://www.radix-ui.com/colors/docs/overview/aliasing e https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- Atlassian documenta elevação como “surface + shadow” em tokens e destaca que em dark mode sombras perdem contraste, então surfaces precisam diferenciar níveis. Fonte: https://design-system-docs-proxy.services.atlassian.com/foundations/elevation/

### Termos de busca (rastreabilidade)
- “Radix Colors aliasing semantic tokens step 1-12”
- “shadcn ui theming CSS variables background foreground ring radius”
- “Tailwind v4 @theme inline CSS variables design tokens”
- “Atlassian design system elevation tokens surface shadow dark mode”

### Achados aplicáveis ao DevDash (o que vira regra)
- Tokens devem ser semânticos (ex.: `--color-success`, `--color-danger`, `--color-surface`) para permitir temas e reduzir “mistura de cinzas” por componente (Radix aliasing).
- Status de serviço não pode depender só de cor; precisa de rótulo/ícone/foco consistente (padrão a11y mínimo).
- Em dark mode, “elevação premium” depende mais de surface do que de sombra; para cards “flat”, borda + surface é preferível a sombras fortes (Atlassian elevation).
- Para Tailwind v4 + shadcn, tokens ficam em `globals.css` (ou equivalente) e são expostos via `@theme inline` para gerar classes `bg-*`/`text-*` (shadcn + Tailwind).

### Auditoria do DevDash (evidência no código atual)
- Tipografia perde consistência: o layout carrega Geist (next/font), mas o `body` força `Arial, Helvetica, sans-serif`, anulando a intenção visual. Evidência: `WWW/MICROSERVICE/devdash/src/app/globals.css` e `WWW/MICROSERVICE/devdash/src/app/layout.tsx`.
- Layout está “estreito de blog”: `max-w-5xl` dá sensação de documento, não console/dashboard. Evidência: `WWW/MICROSERVICE/devdash/src/app/layout.tsx`.
- TopNav não tem estado ativo evidente e não trata overflow em telas menores; também falta padronização de foco. Evidência: `WWW/MICROSERVICE/devdash/src/app/_components/top-nav.tsx` e `tenant-select.tsx`.

## Direção visual (recomendação com trade-off)
- Opção A (Recomendada): “Console produtivo” (neutro, compacto, borda + sombra sutil, foco bem desenhado, ativo claro).
  - Trade-off: menos “expressivo/consumer”, mas muito mais consistente e rápido de implementar sem virar colcha de retalhos.
- Opção B: “Material 3 expressivo” (mais arredondado, mais tonal).
  - Trade-off: pode ficar bonito, mas exige mais disciplina de tokens e mais trabalho de cor/tonal elevation para não misturar estilos.

## ADDED Requirements
### Requirement: Pesquisa salva e reutilizável (IA)
O sistema SHALL produzir um pacote de pesquisa e diretrizes reutilizáveis em `IA/` (sem código de runtime), contendo:
- referências (links) + resumo objetivo dos achados
- baseline de tokens (cores, tipografia, spacing, radius, shadow)
- decisões e trade-offs (por que escolhemos o caminho recomendado)
- checklist de UI “premium” para DevDash e ecommerce

#### Scenario: Reaproveitar em ecommerce
- **WHEN** um novo frontend de ecommerce for iniciado
- **THEN** o time consegue aplicar o baseline sem re-pesquisar (tokens + padrões prontos)

### Requirement: UI Kit
O sistema SHALL fornecer um conjunto de componentes de UI padronizados (Button, Card, Badge, Tooltip, Menu/Dropdown, Drawer/Sheet) usados pela Home, monitores e App Shell.
O UI kit SHALL usar coss/ui (copy/paste, baseado em Base UI + Tailwind) como referência principal de componentes.

#### Scenario: Uso consistente
- **WHEN** um novo card/monitor for criado
- **THEN** ele deve usar os componentes base do UI kit, sem estilos “inline” divergentes

### Requirement: Home com Hierarquia
O sistema SHALL renderizar a Home com duas seções visuais distintas:
- Status (monitores de serviços)
- Atalhos (cards-link para páginas internas)

#### Scenario: Leitura rápida
- **WHEN** o usuário abre a Home
- **THEN** ele identifica rapidamente quais serviços estão ON/OFF e quais ações/links principais existem

### Requirement: Monitores Operacionais
O sistema SHALL exibir no monitor:
- Estado desejado (ON/OFF)
- Estado real (UP/DOWN/UNKNOWN)
- Estado transitório (STARTING/STOPPING) quando aplicável

#### Scenario: Start em progresso
- **WHEN** um serviço está iniciando
- **THEN** o monitor mostra “STARTING” e não alterna cores/textos de forma confusa

### Requirement: Tokens semânticos (cores/status)
O sistema SHALL mapear cores via tokens semânticos e, quando usar Radix Colors, seguir o racional de steps:
- Step 6–8 para bordas e focus ring
- Step 9–10 para fundos sólidos (status forte)
- Step 11–12 para texto (baixo/alto contraste)

#### Scenario: Status forte e consistente
- **WHEN** um serviço estiver DOWN
- **THEN** o badge/botão usa `danger` (vermelho forte) com texto legível e foco visível

### Requirement: App Shell (Sidebar + Drawer) premium e responsivo
O sistema SHALL ter um App Shell com:
- Sidebar no desktop e Drawer no mobile
- estado ativo evidente em links de navegação (`aria-current="page"`)
- foco visível consistente em links/botões/selects
- TenantSelect no rodapé da sidebar (sem redundância no header)

#### Scenario: Identidade visual (logomarca)
- **WHEN** o usuário visualizar o App Shell
- **THEN** a logomarca Lopes aparece no topo da navegação usando a imagem `IA/ASSETS/logoLopes.png` (copiada para assets públicos do app na implementação)

## MODIFIED Requirements
### Requirement: Padrão de Card
Os cards de navegação SHALL manter affordance de clique no container inteiro; monitores SHALL evitar affordance de “card-link” (hover/transition de link) e apresentar ações explicitamente via botões/ícones.

### Requirement: Acessibilidade mínima
Controles por ícone (power/engrenagem) SHALL ter `aria-label` e foco visível (`focus-visible:ring-*`), sem depender apenas de cor.

## REMOVED Requirements
### Requirement: Estilo inline inconsistente
**Reason**: classes Tailwind divergentes por componente dificultam consistência e evolução visual.
**Migration**: mover estilos para componentes base (Card/Button/Badge) e variantes.
