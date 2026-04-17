# Padronizar uso do Front Modal (Dialog) — Spec

## Why
O projeto possui múltiplos `alert()`/`confirm()` e redirecionamentos “secos” (ex.: para login) que quebram consistência visual, acessibilidade e UX. O `frontModal` já existe e deve ser usado como padrão para confirmações, feedback de sucesso/erro/atenção e escolhas.

## What Changes
- Substituir `alert()` e `confirm()` por `frontModal.success/error/warning/confirm` nos fluxos de cliente e checkout.
- Adicionar confirmação (modal) antes de ações destrutivas (ex.: excluir endereço, logout).
- Trocar alerts de “debug JSON” por mensagens humanas via modal (checkout e login).
- Melhorar o fluxo de “login necessário” exibindo modal antes do redirect (quando aplicável), evitando retorno `null` “silencioso”.
- **Sem mudanças de contrato de API**: apenas UX/feedback e confirmação de ações.

## Impact
- Affected specs: UX de feedback, acessibilidade (focus trap, ESC), prevenção de ações destrutivas acidentais.
- Affected code (principais arquivos):
  - `app/(shop)/cliente/meus-enderecos/page.tsx`
  - `app/(shop)/cliente/meus-dados/page.tsx`
  - `app/(shop)/cliente/privacidade/page.tsx`
  - `app/(shop)/checkout/_components/CheckoutForm.tsx`
  - `app/(auth)/login/_components/LoginForm.tsx`
  - `app/(shop)/checkout/page.tsx`
  - `app/(shop)/cliente/layout.tsx`
  - `components/layout/{Header,SidebarMenu,ClienteSidebar,DashboardSidebar}.tsx` (onde houver logout)

## ADDED Requirements

### Requirement: Feedback padronizado por modal
O sistema SHALL exibir feedback por modal (success/error/warning) em ações de salvar/atualizar/criar/excluir quando o fluxo for relevante para o usuário.

#### Scenario: Sucesso ao salvar dados/endereço/privacidade
- **WHEN** o usuário conclui uma ação de salvar e a API responde com sucesso
- **THEN** o sistema mostra `frontModal.success` com título curto e descrição objetiva.

#### Scenario: Erro ao salvar dados/endereço/privacidade
- **WHEN** a ação falha (erro de validação do backend, rede, etc.)
- **THEN** o sistema mostra `frontModal.error` com mensagem amigável (sem JSON bruto).

#### Scenario: Validação de campos obrigatórios
- **WHEN** o usuário tenta salvar com campos obrigatórios faltando/invalidos
- **THEN** o sistema mostra `frontModal.warning` orientando o que falta.

### Requirement: Confirmação antes de ações destrutivas
O sistema SHALL solicitar confirmação via `frontModal.confirm` antes de ações destrutivas/irreversíveis executadas por clique único.

#### Scenario: Excluir endereço
- **WHEN** o usuário clica em “Excluir endereço”
- **THEN** o sistema abre `frontModal.confirm`
- **AND** só chama `deleteEndereco(...)` se o usuário confirmar.

#### Scenario: Logout
- **WHEN** o usuário clica em “Sair”
- **THEN** o sistema abre `frontModal.confirm`
- **AND** só executa `logout()` e navega para `/login` se confirmar.

### Requirement: Login necessário com modal (progressivo)
O sistema SHOULD informar claramente quando um fluxo exige login.

#### Scenario: Usuário não logado acessa checkout/área do cliente
- **WHEN** `isLoggedIn` for falso e a tela redirecionaria para `/login`
- **THEN** mostrar `frontModal.warning`/`frontModal.confirm` com:
  - título “Login necessário”
  - descrição curta (“Faça login para continuar.”)
  - ação para navegar para `/login` (via `hrefOnConfirm` ou `href` em `success/warning`)
- **AND** garantir que o modal apareça apenas uma vez por entrada na página (evitar loop).

## MODIFIED Requirements

### Requirement: Fluxos atuais que usam alert/confirm
Os fluxos existentes que hoje usam `alert()`/`confirm()` MUST ser migrados para `frontModal.*`, removendo alerts/confirm do caminho principal do usuário.

## REMOVED Requirements

### Requirement: Uso de alert/confirm no fluxo principal
**Reason**: não acessível, inconsistente visualmente, e degradante para UX (inclui “debug JSON”).
**Migration**: substituir por `frontModal.success/error/warning/confirm` conforme os cenários acima.

