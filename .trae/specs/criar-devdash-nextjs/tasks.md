# Tasks
- [ ] (FALHOU) Criar o app `WWW/MICROSERVICE/DEVDASH` (Next.js App Router + TypeScript) alinhado ao padrão do repo.
  - [x] Incluir Tailwind CSS (v4, conforme `WWW/n1`) e lint básico.
  - [x] Documentar como rodar (README do app).

- [x] Implementar layout e navegação do DEVDASH.
  - [x] Home com cards/links para: Mock-End, Builder, Seeding/Jobs, Verificações.
  - [x] Seletor de tenant (origem: filesystem do MOCK-END).

- [x] Implementar página “Mock-End”.
  - [x] Checar `http://localhost:4000/health` e mostrar status.
  - [x] Listar tenants detectados no filesystem (reutilizar abordagem do `WWW/n1/src/lib/mockend/root.ts` para localizar o Mock-End).
  - [x] Mostrar links dos endpoints principais (categorias/produtos) para o tenant selecionado.

- [x] Implementar página “Builder”.
  - [x] Gerar link para `/{tenant}/dashboard/builder` no app existente (host configurável via env).
  - [x] Mostrar aviso claro caso tenant não esteja selecionado.

- [x] Implementar página “Seeding/Jobs”.
  - [x] Expor allowlist de scripts do `MOCK-END` (seed:catalog, extract:xlsx, gen:blueprint, gen:builder, verify).
  - [x] Implementar API route/handler no DEVDASH para executar o script (cwd `WWW/MICROSERVICE/MOCK-END`) e devolver stdout/stderr.
  - [x] Exibir logs/resultados na UI.

- [x] Infra de testes (qualidade mínima).
  - [x] Configurar Vitest + Testing Library para unit/component.
  - [x] Criar teste unit/component (home render).
  - [ ] (REMOVIDO) Configurar Playwright para E2E.
  - [ ] (REMOVIDO) Criar teste E2E smoke (home render + nav).

- [ ] Validação final.
  - [x] Rodar lint/test (se scripts existirem) e corrigir falhas.
  - [ ] Validar manualmente o fluxo: selecionar tenant → abrir Mock-End → abrir Builder → rodar 1 script allowlist.

# Task Dependencies
- A página Mock-End depende de função para localizar e ler tenants no filesystem do MOCK-END.
- Seeding/Jobs depende de API segura com allowlist e captura de logs.
