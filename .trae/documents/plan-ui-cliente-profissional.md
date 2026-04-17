# Plano — UI profissional para Área do Cliente (connect-ecommerce)

## Resumo
Melhorar o design da área do cliente em `app/(shop)/cliente` com um visual mais profissional, usando como referência apenas quando fizer sentido o estilo existente em `app/dashboard` (cards, header, spacing, tipografia).

Focos pedidos:
- [privacidade/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/privacidade/page.tsx): trocar JSON/textarea por form com checkbox/select.
- [meus-dados/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-dados/page.tsx): usar mais campos do payload `meus_dados`.
- [meus-enderecos/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-enderecos/page.tsx): melhorar UI/UX.
- Ajustar layout/estrutura de `app/(shop)/cliente` para ficar consistente e “dashboard-like”.

## Estado atual (grounded)
- Layout atual do cliente: [cliente/layout.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/layout.tsx)
  - Wrapper simples (bg branco, max-w-6xl), sidebar fixa desktop e navegação em chips no mobile.
- Sidebar desktop atual: [ClienteSidebar.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/components/layout/ClienteSidebar.tsx)
  - Já tem ícones e estado ativo, mas sem “shell” com background/gradiente.
- Páginas:
  - Meus dados: só nome/email/telefone, já salva via `updateMeusDados`, mas não expõe outros campos do payload.
  - Privacidade: ainda edita JSON (textarea), embora o payload seja compatível com controls.
  - Endereços: funciona, mas UI é básica (select + inputs).
- Referência de estilo mais “profissional”: [dashboard/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/dashboard/page.tsx)
  - Fundo em gradiente, cards com `rounded-2xl`, `border`, `shadow-sm`, tipografia consistente.
- O projeto já possui primitives estilo shadcn:
  - Ex.: [components/ui/button.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/components/ui/button.tsx)

## Decisões (para guiar a implementação)
- Não adicionar dependências novas.
- Não mover rotas/URLs; apenas melhoria visual e de UX dentro das páginas.
- Manter chamadas via `useClientesStore()` (já existente) para salvar.
- Evitar grandes refactors: mudanças concentradas nos arquivos dentro de `app/(shop)/cliente/*` e, se necessário, pequenos ajustes em `components/layout/ClienteSidebar.tsx`.

## Mudanças propostas (arquivos + como)

### 1) “Shell” visual do cliente (layout)
Arquivo: [cliente/layout.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/layout.tsx)
- Trocar wrapper “bg branco + max-w-6xl” por um shell similar ao dashboard:
  - Fundo: `min-h-screen bg-[linear-gradient(...)]`
  - Espaçamento: `p-3 sm:p-5 lg:p-8`
  - Container: `mx-auto max-w-7xl`
- Header do conteúdo (desktop + mobile):
  - Título “Área do cliente”
  - Subtítulo curto (“Gerencie seus dados, endereços e privacidade”)
  - Botão “Sair” padronizado (usar `components/ui/button` quando adequado)
- Mobile nav (chips) manter, mas com estilo de “pill” consistente com o shell (bordas + background suave).

Validação:
- Desktop mantém sidebar fixa e conteúdo alinhado ao topo.
- Mobile continua com navegação por chips e botão de sair.

### 2) “Meus dados” — form mais completo (payload)
Arquivo: [meus-dados/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-dados/page.tsx)
- Evoluir o form para usar campos comuns do payload `meus_dados`:
  - `tipoPessoa` (select PF/PJ)
  - `documento` (input)
  - `nome` (input)
  - `nomeFantasia` (input; exibir só quando `tipoPessoa === "PJ"`)
  - `email` (input)
  - `whatsapp` (input)
  - `status` (select ativo/inativo) quando existir no payload
- Exibir metadados como somente leitura (sem enviar no patch):
  - `id`, `createdAt` (em texto pequeno).
- UI: estruturar em cards (`rounded-2xl border ... shadow-sm`), grid responsiva, labels + helper text.
- Patch enviado:
  - Enviar apenas os campos do form (sem `senha`, sem `id`, sem `createdAt`).

Validação:
- Preenchimento inicial usa `loginData.meus_dados` integralmente quando disponível.
- Salvar continua chamando `updateMeusDados(patch)` e refletindo no store.

### 3) “Privacidade” — trocar JSON por controls
Arquivo: [privacidade/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/privacidade/page.tsx)
- Substituir textarea por form com controles:
  - Preferências (checkbox):
    - `aceitaMarketing`
    - `aceitaTermos`
    - `aceitaCookies`
  - Canal preferido (select):
    - `canalPreferido` (ex.: `email`, `whatsapp`)
  - Dois fatores:
    - `doisFatores.habilitado` (checkbox)
    - `doisFatores.metodo` (select `email`/`whatsapp`)
- Gerar patch no formato esperado pelo store:
  - `{ aceitaMarketing, aceitaTermos, aceitaCookies, canalPreferido, doisFatores: { habilitado, metodo } }`
- UI: dividir em seções/cards, com descrição curta e estado “Salvando...”.

Validação:
- Estado inicial é derivado de `loginData.privacidade`.
- Salvar chama `updatePrivacidade(patch)` e atualiza `loginData.privacidade`.

### 4) “Meus endereços” — UX mais clara e completa
Arquivo: [meus-enderecos/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-enderecos/page.tsx)
- UI:
  - Cabeçalho com descrição + ação “Novo endereço” (reseta para modo novo).
  - Lista/seleção:
    - Manter select no mobile (simples).
    - No desktop, considerar lista em coluna (cards clicáveis) ou manter select com melhor label.
  - Form expandido com campos mais comuns do endereço:
    - `rotulo` (Casa/Trabalho)
    - `principal` (checkbox)
    - `pais` (input com default `BR`)
    - `referencia` (input/textarea curto)
    - manter os obrigatórios (`cep`, `logradouro`, `numero`, `bairro`, `cidade`, `uf`, `complemento`)
- Comportamento:
  - No mount, chamar `useClientesStore().listEnderecos()` para sincronizar `loginData.enderecos` com o backend (evita UI “desatualizada”).
  - Salvar: create/update como hoje, mas com patch/endereco mais completo.
  - Excluir: manter botão “Excluir”, opcionalmente pedir confirmação via `confirm()`.

Validação:
- Criar/editar/excluir continua refletindo no store e no select/lista.
- Validação mínima no client continua impedindo submit sem os campos obrigatórios.

### 5) Ajustes pontuais no sidebar (se necessário)
Arquivo: [ClienteSidebar.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/components/layout/ClienteSidebar.tsx)
- Só se necessário para “casar” com o novo shell:
  - Ajustar paddings/cores/bordas para harmonizar com cards.
  - Não mexer na estrutura de rotas.

Validação:
- Menu ativo continua evidente.

## Passos (3–8) + pontos de validação
1) Atualizar `cliente/layout.tsx` para o novo shell (background/spacing/header/nav mobile).
   - Validar visual em desktop e mobile.
2) Refatorar `meus-dados/page.tsx` para form completo do payload.
   - Validar preenchimento inicial + salvar.
3) Refatorar `privacidade/page.tsx` para checkboxes/selects.
   - Validar salvar e persistência.
4) Melhorar `meus-enderecos/page.tsx` (campos extras + listEnderecos no mount + UX).
   - Validar create/update/delete.
5) Ajustar `ClienteSidebar.tsx` se necessário para consistência visual.
6) Validar no browser com `npm run dev` (sem rodar testes automáticos).

## Fora de escopo
- Componentização ampla (criar um design system completo).
- Adicionar biblioteca de formulário/validação nova (zod, react-hook-form, etc.).
- Persistir sessão além do que já existe no store.

