# Tasks

- [x] 1) Migrar Meus Endereços para frontModal
  - [x] Substituir `alert("Preencha ...")` por `frontModal.warning(...)`
  - [x] Substituir alerts de sucesso/erro por `frontModal.success/error(...)`
  - [x] Substituir `confirm("Excluir este endereço?")` por `frontModal.confirm(...)`
  - [x] Garantir que delete só ocorre após confirmação

- [x] 2) Migrar Meus Dados para frontModal
  - [x] Substituir alert de sucesso por `frontModal.success(...)`
  - [x] Substituir alert de erro por `frontModal.error(...)`

- [x] 3) Migrar Privacidade para frontModal
  - [x] Substituir alert de JSON inválido / “precisa ser objeto” por `frontModal.warning(...)`
  - [x] Substituir alert de sucesso por `frontModal.success(...)`
  - [x] Substituir alert de erro por `frontModal.error(...)`

- [x] 4) Migrar Checkout (CheckoutForm) para frontModal
  - [x] Remover `alert(JSON.stringify(...))` de sucesso e trocar por `frontModal.success(...)`
  - [x] Remover `alert(JSON.stringify(...))` de erro e trocar por `frontModal.error(...)`
  - [x] Manter `uiMessage` como suporte opcional (sem JSON bruto)

- [x] 5) Migrar Login para frontModal
  - [x] Trocar alerts de sucesso/erro (JSON) por `frontModal.success/error(...)`
  - [x] Caso “sucesso sem token”: exibir `frontModal.warning/error(...)` com instrução clara

- [x] 6) Confirmar logout via frontModal nos pontos de UI
  - [x] Aplicar `frontModal.confirm(...)` antes de `logout()` + navegação `/login` em:
    - `app/(shop)/cliente/layout.tsx`
    - `components/layout/ClienteSidebar.tsx`
    - `components/layout/SidebarMenu.tsx`
    - `components/layout/Header.tsx`
    - `components/layout/DashboardSidebar.tsx` (se aplicável)

- [x] 7) Login necessário com modal (progressivo)
  - [x] Em `app/(shop)/checkout/page.tsx`, antes de `router.replace("/login")`, mostrar modal 1x informando “Login necessário” com ação para ir ao login
  - [x] Em `app/(shop)/cliente/layout.tsx`, mesma estratégia de modal 1x antes do redirect
  - [x] Evitar loop: usar flag/ref local para não abrir repetidamente

- [x] 8) Verificação
  - [x] Verificar que não restaram `alert()`/`confirm()` nos arquivos alvo
  - [x] Verificar TypeScript diagnostics dos arquivos alterados

# Task Dependencies
- (7) depende de (6) apenas se o logout/redirect compartilhar o mesmo handler de navegação (caso contrário, pode ser paralelo).
