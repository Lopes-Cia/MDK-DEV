# Galeria de UX + SSE (Próximos Avanços) — Spec

## Why
O microservice DEVDASH precisa evoluir de “painel funcional” para uma base reutilizável de UI e DX (developer experience) que acelere a construção da fábrica de ecommerce. Dois próximos avanços destravam isso: (1) uma Galeria de UX (biblioteca viva de padrões) e (2) SSE para eliminar “pisca/polling” nos monitores.

## What Changes
- Criar um plano em aberto para 2 novos recursos do microservice:
  - **Galeria de UX**: uma área do DEVDASH para visualizar e reaproveitar padrões (cards, menus, dialogs, empty/error/loading, tabelas) com referências rastreáveis.
  - **SSE (Server-Sent Events)**: streaming de eventos do backend para o frontend para reduzir polling e estabilizar estados (UP/DOWN/STARTING) sem flicker.
- Salvar **2 referências** de bibliotecas/registries para UI:
  - **coss/ui** (skill já instalada): base em Base UI + Tailwind, filosofia copy/paste e catálogo de “particles”.
  - **Um registry alternativo via shadcn directory** (com critério e shortlist), usando o padrão do CLI `npx shadcn add @<registry>/<component>`.
- Marcar ambos como **próximos avanços** do DEVDASH (sem implementação agora).

## Impact
- Affected specs: evolução do DEVDASH como plataforma (UI, padrões, observabilidade UX).
- Affected code (quando implementar):
  - `WWW/MICROSERVICE/devdash/src/app/**` (novas rotas/páginas)
  - `WWW/MICROSERVICE/devdash/src/stores/**` (store será o único consumidor de `/api/*`, inclusive SSE)
  - `WWW/MICROSERVICE/devdash/src/app/api/**/route.ts` (novas rotas SSE)

## Referências (salvar e reaproveitar)
### Referência 1 (confirmada): coss/ui
- URL: https://coss.com/ui/docs
- Por que entra na fábrica de ecommerce:
  - Componentes acessíveis e composáveis em React, baseados em Base UI + Tailwind.
  - Filosofia copy/paste (você “possui o código”), alinhada ao nosso padrão de não depender de pacotes fechados para UI.
  - Catálogo de “particles” (padrões prontos) útil para acelerar e padronizar UI densa (dashboard e backoffice).
- Risco assumido:
  - Early Access / Base UI em beta → pode ter breaking changes; usar com disciplina (copiar padrões, não acoplar demais).

### Referência 2 (a pesquisar): shadcn community registries
- URL: https://ui.shadcn.com/docs/directory
- Nota operacional:
  - O CLI suporta registries sem config extra. Padrão: `npx shadcn add @<registry>/<component>`.
- Critério para escolher 1 registry “semelhante” (para ecommerce):
  - foco em componentes/padrões de app (não só landing/efeitos)
  - acessibilidade e DX (copy/paste, Tailwind, TS)
  - densidade (tables, menus, filters, dialogs, empty states)
  - estabilidade/manutenção (evitar libs “showcase-only”)
- Shortlist inicial (a validar no diretório):
  - `@unlumen-ui` (ênfase em animação e design; pode servir para partes de marketing/landing do ecommerce)
  - `@aevr` (componentes focados em produção para React/Next.js)

## ADDED Requirements
### Requirement: Galeria de UX (plano)
O sistema SHALL definir um plano para uma Galeria de UX no DEVDASH contendo:
- catálogo de padrões (mínimo: Card, Button/IconButton, Menu, Dialog, Drawer, Toast, Table)
- critérios de “pronto para reutilizar” (acessibilidade mínima, estados, responsivo)
- regra de consumo: UI não chama `/api/*` direto; consumo de dados e eventos passa por stores

#### Scenario: Reaproveitar padrão no ecommerce
- **WHEN** for necessário implementar um padrão (ex.: menu mobile, card de produto, tabela administrativa)
- **THEN** o time encontra um exemplo pronto e replicável na Galeria, com referência de origem (coss/shadcn registry)

### Requirement: SSE para monitores (plano)
O sistema SHALL definir um plano para SSE no DEVDASH:
- endpoint SSE em `/api/**` que emite eventos (status do MOCK-END, status do N1, etc.)
- store como cliente único do SSE (UI consome estado do store)
- fallback para polling (caso SSE não suporte o ambiente ou falhe)

#### Scenario: Estado estável sem flicker
- **WHEN** o serviço alternar estados (STARTING → UP, UP → DOWN)
- **THEN** a UI atualiza com transições previsíveis e sem “piscar” por revalidação agressiva

## MODIFIED Requirements
Nenhum.

## REMOVED Requirements
Nenhum.
