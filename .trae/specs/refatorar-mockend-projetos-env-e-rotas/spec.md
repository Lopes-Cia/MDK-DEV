# MOCK-END multi-projetos (env por base + rotas declarativas) — Spec

## Why
Hoje o MOCK-END carrega um único `.env` global e decide o upstream por `process.env`, o que dificulta manter múltiplas “bases” (AUTH e INTEGRATION) com configuração isolada e reduz clareza quando novos endpoints precisarem de comportamento customizado. O objetivo é seguir o desenho e manter o comportamento do proxy igual ao original.

## What Changes
- Implementar resolução de **projeto/base** por prefixo de path (`/ApiLopes/webservice/api` e `/connect`) para carregar `.env` específico em `PROJETOS/`.
- Alterar o proxy para usar **configuração por base** (env por projeto) mantendo o mesmo comportamento de encaminhamento (método, status, headers e body).
- Introduzir suporte a **rotas declarativas por projeto** via `PROJETOS/<base>/routes.mjs` (formato documentado no desenho), sem quebrar o fluxo atual:
  - Por padrão, o modo de execução deve ser `original` (proxy).
- Manter e reforçar a regra de **LEGADO isolado**: código/rotas não usados pelo Connect ficam em `LEGADO/` e não são carregados por default.

## Impact
- Affected specs:
  - Proxy por base (AUTH vs INTEGRATION)
  - Resolução de `.env` por projeto (multi-projetos)
  - Catálogo de rotas declarativas (documentação + base para execução)
  - Higienização de legado (organização de pastas)
- Affected code:
  - `WWW/MICROSERVICE/MOCK-END/server.mjs` (contexto por request)
  - `WWW/MICROSERVICE/MOCK-END/routes/proxy.mjs` (resolução de upstream por base)
  - `WWW/MICROSERVICE/MOCK-END/lib/env.mjs` (leitura de `.env` por projeto)
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/*` (novos artefatos de projeto)
  - `WWW/MICROSERVICE/MOCK-END/LEGADO/*` (movimentações)

## ADDED Requirements

### Requirement: Resolução de base/projeto
O sistema SHALL identificar a base do request a partir do `pathname` e selecionar um **projeto** correspondente em `PROJETOS/`.

#### Scenario: AUTH base
- **WHEN** a request iniciar com `/ApiLopes/webservice/api/`
- **THEN** o projeto ativo SHALL ser `PROJETOS/ApiLopes/webservice/api`

#### Scenario: INTEGRATION base
- **WHEN** a request iniciar com `/connect/`
- **THEN** o projeto ativo SHALL ser `PROJETOS/connect`

### Requirement: `.env` por projeto com fallback
O sistema SHALL carregar variáveis de ambiente do projeto (`PROJETOS/<base>/.env`) para resolver upstreams, mantendo override por `process.env` (variáveis de processo vencem).

#### Scenario: Env do projeto presente
- **WHEN** existir `PROJETOS/<base>/.env`
- **THEN** o proxy SHALL usar os valores desse arquivo (respeitando overrides de `process.env`)

#### Scenario: Env do projeto ausente
- **WHEN** não existir `PROJETOS/<base>/.env`
- **THEN** o proxy SHALL manter o comportamento atual usando os valores globais já disponíveis (ex.: `.env` do root), sem quebrar requests

### Requirement: Proxy com comportamento preservado
O sistema SHALL manter o comportamento de proxy equivalente ao atual:
- preservar método, path e querystring
- remover hop-by-hop headers
- repassar `Set-Cookie` quando presente
- preservar status e body do upstream

#### Scenario: Encaminhamento bem sucedido
- **WHEN** uma rota de proxy for reconhecida
- **THEN** a resposta SHALL espelhar o upstream (status/body) e incluir CORS conforme hoje

### Requirement: Rotas declarativas por projeto (base)
O sistema SHALL suportar a presença de `PROJETOS/<base>/routes.mjs` com `export const routes = [...]` para documentar (e, quando habilitado) dirigir o comportamento de endpoints.

#### Scenario: Sem impacto por default
- **WHEN** existir um `routes.mjs` com uma rota marcada como `execution.mode = "original"`
- **THEN** o comportamento SHALL continuar sendo proxy (ou handler original), sem executar lógica customizada

## MODIFIED Requirements

### Requirement: Legado isolado
O sistema SHALL manter o código de legado em `LEGADO/` e SHALL evitar carregá-lo no roteamento principal por default.

## REMOVED Requirements
N/A

