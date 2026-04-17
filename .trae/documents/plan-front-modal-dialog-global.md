# Plano — Front Modal (Dialog global)

## Resumo
Implementar um componente de **dialog/modal global**, acessível de qualquer parte do `connect-ecommerce`, baseado no padrão do projeto (**shadcn/ui New York + Tailwind + Radix**). O modal suportará comportamentos prontos: **erro**, **sucesso**, **atenção**, **confirmar (sim/não)**, **escolha única** e **escolha múltipla**, com visual consistente (cores/ícones/backdrop/botões), e API por **Promise**.

Também será criado um guia “IA friendly” em `IA/COMPS/front-modal.md` para padronizar o uso.

## Estado atual (repo)
- O projeto já usa shadcn/ui (config `style: "new-york"`) em [components.json](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/components.json).
- Existem wrappers Radix no padrão shadcn em [dropdown-menu.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/components/ui/dropdown-menu.tsx) e botão com variantes em [button.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/components/ui/button.tsx).
- Ainda **não** há `components/ui/dialog.tsx` e o pacote `@radix-ui/react-dialog` ainda **não** está em [package.json](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/package.json).
- Providers globais existem em [AppProviders.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/components/providers/AppProviders.tsx), que é um bom ponto para “montar” um host global do modal.

## Decisões confirmadas
- Se abrir um dialog enquanto outro estiver aberto: **Substituir** (o anterior resolve como cancelado).
- Tipos informativos (erro/sucesso/atenção): padrão de botão **Só “OK”**.
- Retorno: API por **Promise resolve**.
- Conteúdo customizado: **não** (apenas título/descrição/lista e botões).

## Proposta (arquitetura)
### 1) Dialog base (shadcn/ui)
Adicionar `components/ui/dialog.tsx` (wrapper do Radix Dialog), seguindo o estilo New York e o padrão de `cn`/Tailwind do repo.

Dependência necessária:
- `@radix-ui/react-dialog`

### 2) Store global do modal (Zustand)
Criar um store (ex.: `stores/front-modal-store.ts`) que guarda:
- `open: boolean`
- `kind`: `"success" | "error" | "warning" | "confirm" | "chooseOne" | "chooseMany"`
- `title`, `description`
- `actions` (botões) e comportamento padrão por `kind`
- `options` (para chooseOne/chooseMany) e seleção (value(s))
- `resolver` interno para Promise

API pública (imperativa e “IA friendly”, sem precisar hook):
- `frontModal.success(...) -> Promise<void>`
- `frontModal.error(...) -> Promise<void>`
- `frontModal.warning(...) -> Promise<void>`
- `frontModal.confirm(...) -> Promise<boolean>`
- `frontModal.chooseOne(...) -> Promise<string | null>`
- `frontModal.chooseMany(...) -> Promise<string[]>`
- `frontModal.close()` (resolve como cancelado conforme o `kind`)

Regras de cancelamento (quando substitui/ESC/click fora):
- `confirm` resolve `false`
- `chooseOne` resolve `null`
- `chooseMany` resolve `[]`
- informativos resolvem `void`

### 3) Host global montado nos providers
Adicionar um componente “host” (ex.: `components/providers/FrontModalHost.tsx`) e montá-lo em `AppProviders.tsx`, garantindo que o modal exista em qualquer rota.

O host:
- Usa `Dialog`/`DialogContent` do `components/ui/dialog.tsx`
- Usa `useRouter()` para suportar ação comum de navegação via `href` (sem obrigar o caller a receber router)
- Renderiza ícone/cores/backdrop/botões de acordo com `kind`
- Renderiza lista de opções usando inputs nativos (`radio`/`checkbox`) para acessibilidade

### 4) Visuais por comportamento
Mapeamento padrão (ajustável via config):
- **success**: ícone “check”, destaque verde, botão “OK”
- **error**: ícone “x/circle”, destaque vermelho, botão “OK” (ou `destructive` se solicitado no futuro)
- **warning/atenção**: ícone “alert”, destaque âmbar, botão “OK”
- **confirm**: ícone “help”, botões “Não” (secondary) e “Sim” (default/destructive configurável)
- **chooseOne**: lista radio + botões “Cancelar” e “Confirmar”
- **chooseMany**: lista checkbox + botões “Cancelar” e “Confirmar”

Backdrop:
- por padrão `bg-black/60` com blur leve; para `error/success/warning`, aplicar “tint” sutil no overlay (sem reduzir contraste do conteúdo).

### 5) Guia “IA friendly”
Criar `WWW/REFERENCIAS/connect-ecommerce/IA/COMPS/front-modal.md` com:
- Objetivo e quando usar
- Assinaturas/contratos das funções
- Exemplos copy/paste (success/error/warning/confirm/chooseOne/chooseMany)
- Padrão recomendado para navegação por `href`
- Regras de cancelamento e como tratar retorno

## Mudanças previstas (arquivos)
- **Adicionar**: `WWW/REFERENCIAS/connect-ecommerce/components/ui/dialog.tsx`
- **Adicionar**: `WWW/REFERENCIAS/connect-ecommerce/stores/front-modal-store.ts` (nome final a confirmar na implementação, mantendo padrão da pasta `stores/`)
- **Adicionar**: `WWW/REFERENCIAS/connect-ecommerce/components/providers/FrontModalHost.tsx`
- **Atualizar**: `WWW/REFERENCIAS/connect-ecommerce/components/providers/AppProviders.tsx` (montar `FrontModalHost`)
- **Atualizar**: `WWW/REFERENCIAS/connect-ecommerce/package.json` (+ `@radix-ui/react-dialog`)
- **Adicionar**: `WWW/REFERENCIAS/connect-ecommerce/IA/COMPS/front-modal.md` (e criar pasta `IA/COMPS/` se não existir)

## Passos de implementação (execução)
1. Adicionar dependência `@radix-ui/react-dialog` no `package.json` e instalar (mantendo lockfile atualizado).
2. Criar `components/ui/dialog.tsx` no padrão shadcn New York (Radix Dialog + animações + overlay/content/header/footer helpers).
3. Criar `stores/front-modal-store.ts` com API `frontModal.*` por Promise e política de “substituir”.
4. Criar `FrontModalHost.tsx` (client component) consumindo o store, com:
   - render por `kind`
   - inputs nativos para escolhas
   - botões com `components/ui/button`
   - suporte a `href` para navegação via `useRouter`
5. Montar o host em `AppProviders.tsx`.
6. Escrever o guia em `IA/COMPS/front-modal.md`.

## Validação (manual, sem testes automáticos)
- Abrir uma página client (ex.: `app/(shop)/cliente/meus-dados/page.tsx`) e disparar `frontModal.*` via um botão temporário (ou via console) para validar:
  - abertura/fechamento, ESC, click fora, foco preso no dialog
  - visuais por tipo (ícone/cor/backdrop/botões)
  - `confirm()` resolve `true/false` conforme ação/cancelamento
  - `chooseOne()` resolve `id` selecionado ou `null` no cancelamento
  - `chooseMany()` resolve lista de `id`s ou `[]` no cancelamento
  - ação com `href` navega e fecha o dialog

## Fora de escopo
- Conteúdo customizado (ReactNode) dentro do dialog.
- Sistema de fila (queue) de dialogs.
- Toasts/notificações não-modais.

