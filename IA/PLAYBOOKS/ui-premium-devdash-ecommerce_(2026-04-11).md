# UI Premium (DevDash + Fábrica de Ecommerce)

## Objetivo
Consolidar uma base de design “TOP” (premium) reutilizável para:
- DEVDASH (dashboard interno: UI densa, operacional, legível rápido)
- frontends de ecommerce (UI orientada a conversão, mas com consistência de tokens)

Este documento é **pesquisa + síntese aplicável** (tokens, regras e padrões) para evitar “achismo” e retrabalho.

## Fontes (pesquisa rastreável)
- Tailwind v4: tokens em CSS via `@theme` e `@theme inline` (theme variables)  
  - https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/theme.mdx  
  - https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/colors.mdx
- shadcn/ui: convenção `background/foreground`, lista de CSS variables e exposição via `@theme inline`  
  - https://v3.shadcn.com/docs/theming
- Radix Colors: aliasing semântico e o “sentido” dos steps 1–12 para uso em UI  
  - https://www.radix-ui.com/colors/docs/overview/aliasing  
  - https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- Atlassian (elevation): “surface + shadow” e atenção especial em dark mode (sombra sozinha não resolve)  
  - https://design-system-docs-proxy.services.atlassian.com/foundations/elevation/
- coss/ui: biblioteca copy/paste em cima de Base UI + Tailwind; camadas Primitives/Particles/Atoms  
  - https://coss.com/ui/docs
- shadcn community registries (para referência de alternativas e blocos)  
  - https://ui.shadcn.com/docs/directory

## Termos de busca (reprodutíveis)
- “Tailwind v4 @theme inline CSS variables design tokens”
- “shadcn ui theming background foreground ring radius”
- “Radix Colors understanding the scale steps 1-12 focus ring border hover”
- “Radix Colors aliasing semantic tokens accent danger warning”
- “Atlassian elevation tokens surface shadow dark mode”
- “coss ui Base UI Tailwind copy paste particles”

## Princípios de UI “TOP” (regras que viram padrão)
### 1) Tokens primeiro (não componentes primeiro)
- Definir tokens semânticos (cor/spacing/radius/shadow/typography) e só depois componentizar.
- O objetivo é eliminar estilos “por componente” e evitar mix de cinzas/radius/sombras.

### 2) Densidade com legibilidade (DevDash)
- Dashboard precisa ser escaneável em 2–3 segundos: título → seção → status → ações.
- Priorizar hierarquia e agrupamento por superfície (borda + surface) em vez de sombras pesadas.

### 3) Acessibilidade mínima como parte do “premium”
- Controles por ícone com `aria-label`.
- Foco visível consistente (ring + offset).
- Status não depende só de cor (badge com texto +, quando possível, ícone).

### 4) Reaproveito em ecommerce (sem “cara de dashboard”)
- Mesmos tokens base (typography/spacing/radius/shadow).
- Paleta e densidade podem variar por tenant/brand, mas o “sistema” é o mesmo.

## Tokens (baseline recomendado)
### Spacing (base 4px)
Use uma escala curta e repetível (evita “gap aleatório”):
- 4, 8, 12, 16, 24, 32, 40, 48

Regras:
- Cards: padding 16–24
- Seções: gap vertical 24–32
- Controles (toolbar): gap 8–12

### Tipografia (UI densa)
Regras:
- Base de UI (labels, botões, inputs): 14/20
- Metadados/auxiliar: 12/16
- Título de seção: 16/20 ou 18/24
- Título de página: 20/24 ou 24/28

Observação prática do DevDash:
- Se o app carrega fontes via `next/font` (ex.: Geist), **não** sobrescrever `font-family` global com Arial, senão perde consistência de “acabamento”.

### Radius (escala curta)
Regras:
- Controles (botões, inputs): 6–8
- Cards/surfaces: 12
- Pills/badges: full (quando for semântico)

### Shadow / Elevação
Baseado no racional de elevation (surface + shadow):
- Card “flat” no dashboard: **surface + border** (sombra mínima ou nenhuma)
- Hover/overlay: sombra sutil + ajuste de surface (em dark, surface precisa diferenciar)

Regra de ouro:
- Em dark mode, diferenciar elevação mais por **surface** do que por sombra.

## Cores (modelo semântico + Radix steps)
### 1) Por que semântico
Radix recomenda aliasing semântico (ex.: `accent`, `danger`, `warning`) para suportar theming e reduzir conflito (“yellow serve warning e pending”, etc.).  
Fonte: https://www.radix-ui.com/colors/docs/overview/aliasing

### 2) Como usar os steps 1–12 (mapa prático)
Radix descreve o uso típico por step:
- Step 1: app background
- Step 2: subtle background
- Step 3: UI element background
- Step 4: hovered UI element background
- Step 5: active/selected background
- Step 6: subtle borders/separators
- Step 7: UI border e focus rings
- Step 8: hovered border
- Step 9: solid backgrounds
- Step 10: hovered solid backgrounds
- Step 11: low-contrast text
- Step 12: high-contrast text  
Fonte: https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale

### 3) Status do DevDash (forte e legível)
Definir tokens semânticos (nomes exemplos):
- `--success` / `--success-foreground`
- `--danger` / `--danger-foreground`
- `--warning` / `--warning-foreground`
- `--info` / `--info-foreground`

Regras:
- Badge “UP”: usar success sólido (step 9–10) + foreground legível (white/near-white)
- Badge “DOWN”: danger sólido (step 9–10) + foreground legível
- Ring/focus: step 7–8 do mesmo semantic (evita ring cinza invisível)

## Tailwind v4 + CSS variables (padrão de implementação)
### Theme variables em CSS (Tailwind v4)
Tailwind v4 trata “theme variables” como design tokens e permite definir via `@theme` em CSS.  
Para referenciar variáveis externas (ex.: `--background`) e gerar utilities, usar `@theme inline`.  
Fontes:  
- https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/theme.mdx  
- https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/colors.mdx

### Convenção shadcn: background/foreground
shadcn usa:
- `bg-background text-foreground`
- `bg-primary text-primary-foreground`
e mantém tokens em `:root` e `.dark`, expondo em `@theme inline`.  
Fonte: https://v3.shadcn.com/docs/theming

### Regras de ouro (sem exceção)
- Tokens no global CSS; componentes só consomem classes sem inventar cor inline.
- Não criar “cor por feature”; criar “token por semântica”.
- Se usar registries de terceiros (shadcn directory), revisar o código antes de incorporar.

## Padrões de componente (reutilizáveis)
### Cards: separar “navegação” de “operação”
Regra:
- **AppCard** (atalho/link): card inteiro clicável, hover com affordance de navegação.
- **StatusCard** (monitor): não parece link; ações explícitas (power/settings), status em badge, estados busy/starting claros.

### TopNav: menu premium e responsivo
Regras:
- Estado ativo evidente (ex.: pill/underline + `aria-current="page"`).
- Em telas pequenas: overflow controlado (scroll horizontal com fade) ou menu colapsado (drawer).

### IconButton: densidade e acessibilidade
Regras:
- Tamanho coerente (quadrado) e alvo de toque razoável.
- Sempre `aria-label`.
- Foco visível consistente (ring + offset).

## Biblioteca/padrões: como usar coss/ui sem virar refém
### Estratégia recomendada
- Usar coss/ui como “banco de patterns” (particles) e como referência de composição acessível.
- Copiar/adaptar o padrão para os componentes locais, mantendo nossos tokens e nossa regra de store.

### Risco conhecido
- coss/ui e Base UI podem quebrar APIs (early access/beta). Copiar padrões reduz o acoplamento.

## Checklist “TOP” (para revisar qualquer tela)
- Hierarquia: título de página, seções claras, status no primeiro olhar.
- Consistência: radius, border, shadow, spacing repetíveis.
- Estados: loading/empty/error/busy sem flicker.
- A11y mínimo: foco visível, `aria-label` em ícones, status não depende só de cor.
- Responsivo: 360/768/1440 sem overflow de header/menu.
