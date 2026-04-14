# Tasks

- [x] Task 1: Mapear base/projeto e contexto por request
  - [x] Definir função de resolução de base (`/ApiLopes/webservice/api` e `/connect`) → `PROJETOS/<base>`
  - [x] Garantir que o contexto enviado para rotas inclua `projectDir` e `basePrefix`
  - [x] Validação: requests fora dessas bases continuam com `404 not_found` como hoje

- [x] Task 2: Implementar leitura de `.env` por projeto com fallback
  - [x] Adicionar função para ler `.env` do projeto e retornar um objeto `{ [key]: value }` (sem poluir `process.env`)
  - [x] Aplicar precedência: `process.env` > `.env` do projeto > `.env` global (se existir)
  - [x] Validação: ausência de `.env` do projeto não quebra proxy (usa config atual)

- [x] Task 3: Atualizar proxy para resolver upstream por base usando env do projeto
  - [x] Ajustar `routes/proxy.mjs` para resolver `AUTH_BASE_URL` e `INTEGRATION_URL_API` do env efetivo do projeto
  - [x] Manter comportamento do proxy (hop-by-hop, Set-Cookie, status/body)
  - [x] Validação: os mesmos paths reconhecidos hoje continuam reconhecidos e encaminhados

- [x] Task 4: Suporte a `routes.mjs` por projeto (somente catálogo / sem mudança de comportamento)
  - [x] Definir loader opcional do `PROJETOS/<base>/routes.mjs` (quando existir) e disponibilizar no contexto
  - [x] Garantir que `execution.mode: "original"` não altere comportamento (apenas documentação/telemetria futura)
  - [x] Validação: não alterar respostas existentes por causa da presença do arquivo

- [x] Task 5: Higienização de legado (sem quebrar fluxo principal)
  - [x] Analisar o código atual e identificar rotas/libs/fluxos não usados pelo Connect
  - [x] Mover para `LEGADO/` mantendo imports ajustados (somente quando ainda houver referência explícita)
  - [x] Garantir que `routes/index.mjs` não carregue legado por default
  - [x] Validação: fluxo principal (proxy por base + rotas Connect ativas) continua funcionando igual ao original

# Task Dependencies
- Task 3 depende de Task 1 e Task 2.
- Task 4 depende de Task 1.
- Task 5 pode ocorrer após Task 1 (mas deve respeitar dependências reais de imports).
