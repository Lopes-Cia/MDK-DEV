# DEVDASH (Next.js) Spec

## Why
Precisamos de um dashboard interno para desenvolvimento/testes que centralize utilidades (Mock-End, Builder/Bricks, seeding e validações) para acelerar iteração e reduzir retrabalho.

## What Changes
- Criar um novo app Next.js em `WWW/MICROSERVICE/DEVDASH` para uso local (dev).
- Implementar páginas utilitárias focadas nos recursos já existentes no repo (Mock-End e Builder).
- Implementar ações seguras para rodar scripts do `MOCK-END` (seeding/geração/verificações) via UI.
- Adicionar infraestrutura mínima de testes (Vitest/RTL + Playwright) para manter qualidade do DEVDASH.

## Impact
- Affected specs: Ferramentas de dev/teste; suporte a Mock-End/Builder.
- Affected code:
  - Novo app: `WWW/MICROSERVICE/DEVDASH/*`
  - Leitura/execução: `WWW/MICROSERVICE/MOCK-END/*` (somente uso/integração; não alterar scripts existentes nesta entrega, salvo necessidade explícita)
- Dependências: Next.js + Tailwind (alinhado ao padrão de `WWW/n1`), ferramentas de teste (Vitest/RTL/Playwright).

## ADDED Requirements
### Requirement: App DEVDASH
O sistema SHALL fornecer um app Next.js (App Router) em `WWW/MICROSERVICE/DEVDASH` para desenvolvimento local.

#### Scenario: Acesso ao dashboard
- **WHEN** o dev iniciar o app do DEVDASH
- **THEN** deve ver uma home com navegação para as ferramentas (Mock-End, Builder, Seeding/Jobs, Verificações).

### Requirement: Integração com Mock-End
O sistema SHALL analisar e expor, no DEVDASH, os recursos disponíveis do `MOCK-END` (servidor e dados do filesystem).

#### Scenario: Status e endpoints
- **WHEN** o dev abrir a página Mock-End
- **THEN** o DEVDASH deve:
  - Checar o health do Mock-End (`/health`) e mostrar status (ok/erro).
  - Listar tenants detectados a partir da estrutura do `MOCK-END` no filesystem.
  - Exibir links/ações para endpoints principais do Mock-End (categorias/produtos).

### Requirement: Acesso ao Builder (Bricks/Puck)
O sistema SHALL oferecer, no DEVDASH, acesso rápido ao Builder de bricks (Puck) já existente no projeto.

#### Scenario: Abrir builder por tenant
- **WHEN** o dev selecionar um tenant e clicar em “Abrir Builder”
- **THEN** o DEVDASH deve redirecionar para a rota do builder no app existente (`/{tenant}/dashboard/builder`) no host local configurado.

### Requirement: Seeding e Jobs do Mock-End
O sistema SHALL permitir executar, via UI do DEVDASH, um conjunto permitido (allowlist) de scripts do `MOCK-END`.

#### Scenario: Rodar script permitido
- **WHEN** o dev solicitar “seed:catalog”, “gen:builder”, “gen:blueprint”, “extract:xlsx” ou “verify”
- **THEN** o DEVDASH deve executar o comando no diretório `WWW/MICROSERVICE/MOCK-END`, capturar saída (stdout/stderr) e retornar o resultado na UI.
- **AND** o DEVDASH deve bloquear qualquer comando fora da allowlist.

### Requirement: Qualidade mínima (testes)
O sistema SHALL incluir testes automatizados mínimos para o DEVDASH.

#### Scenario: Smoke tests
- **WHEN** rodar testes unit/component
- **THEN** deve existir ao menos 1 teste de renderização da home.
- **WHEN** rodar testes E2E
- **THEN** deve existir ao menos 1 teste smoke que abre a home e valida que a navegação principal aparece.

## MODIFIED Requirements
Nenhum.

## REMOVED Requirements
Nenhum.

