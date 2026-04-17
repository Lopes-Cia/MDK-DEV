# Plano — Contrato BACK ↔ MOCK (MVP) — API 9004

## Resumo

Construir uma ferramenta **MVP (Node.js)** para criar um **contrato comparável** entre:

- **BACK**: OpenAPI da API 9004 (Servidor), usando o dump local em `WWW/MICROSERVICE/LEAR_LOPES/DOCS/lopes_9004/api-docs.json`.
- **MOCK**: o que o `MOCK-END` atende na base `/connect`, distinguindo:
  - endpoints **explicitamente mockados** (presentes em `PROJETOS/connect/routes.mjs` com `execution.mode = mock|hybrid`)
  - endpoints **apenas proxied** (não declarados em `routes.mjs`, mas atendidos via proxy cego para o upstream)

Entrega MVP: **somente relatório de gaps** (Markdown + JSON), com filtro por tags do OpenAPI.

Tags escolhidas para este MVP: **Produto**, **Customer**, **Pedido**.

## Estado atual (análise do repo)

### 1) Fonte do BACK (9004)

- OpenAPI dump: `WWW/MICROSERVICE/LEAR_LOPES/DOCS/lopes_9004/api-docs.json`
  - O spec usa paths do tipo `/webservice/integration/...` e server base com `/Servidor`.
- Swagger UI pode falhar ao carregar, mas o JSON em `/Servidor/v3/api-docs` é a fonte confiável (já baixada).

### 2) Fonte do MOCK (MOCK-END)

- Rotas declarativas do projeto `/connect`: `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs`
  - Esse catálogo é usado pelo proxy da base `/connect` para decidir se executa handler mock/hybrid/original.
- Mecanismo do proxy: `WWW/MICROSERVICE/MOCK-END/routes/proxy.mjs`
  - Se a rota **não existir** em `routes.mjs`, o mock-end **faz proxy** para `INTEGRATION_URL_API`.
  - Se a rota existir e `execution.mode = mock|hybrid`, ele chama `PROJETOS/connect/handlers/mock/<handler_class>.mjs`.
- `.env` da base `/connect`: `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/.env`
  - `INTEGRATION_URL_API=https://gp.lopesecia.com.br:9004`

### 3) Observação importante (por que o relatório é útil)

- O OpenAPI 9004 contém centenas de endpoints `/webservice/integration/...` (ex.: `getIntegradora`, `getListProdutoLoja`, etc).
- As rotas mockadas do Connect hoje são majoritariamente endpoints “de e-commerce” (ex.: `/Servidor/webservice/integration/produtos/categorias`), que **não aparecem** no OpenAPI 9004.
- Portanto, para as tags **Produto/Customer/Pedido**, o esperado é:
  - muitos endpoints do BACK estarão como **gap** (apenas proxied, sem rota mock declarada).
  - e haverá rotas mock-only (rotas do Connect não existentes no spec 9004).

## Objetivo e critérios de sucesso

### Objetivo

Gerar um relatório que responda:

1) Quais endpoints do BACK (filtrados por tags) **já têm rota mock declarada** no MOCK-END?
2) Quais endpoints do BACK **não têm rota** no `routes.mjs` e portanto rodam como **proxy** (gap de mock)?
3) Quais rotas do Connect existem no mock, mas **não existem no OpenAPI 9004** (mock-only)?

### Critérios de sucesso (MVP)

- Rodar via Node.js (sem Python, sem libs externas).
- Entrada configurável:
  - caminho do OpenAPI `api-docs.json`
  - caminho do `routes.mjs` do Connect
  - tags: Produto, Customer, Pedido
- Saída em arquivo:
  - `report.json` (estrutura fácil para IA consumir)
  - `report.md` (leitura humana)
- Normalização correta dos paths:
  - OpenAPI `/webservice/integration/x`
  - Mock routes usam `/Servidor/webservice/integration/x`
- O relatório lista contagens e exemplos por categoria (mocked/proxied/mock-only).

## Mudanças propostas (arquitetura MVP)

### A) Criar um “contract tool” em LEAR_LOPES (Node)

**Novos arquivos (sugestão de local):**

- `WWW/MICROSERVICE/LEAR_LOPES/contract/contract-9004.mjs`
  - Responsável por: ler OpenAPI + ler routes.mjs + gerar relatório.
- `WWW/MICROSERVICE/LEAR_LOPES/contract/contract-9004.config.json`
  - Responsável por: declarar paths e tags (evita hardcode no script).
- Saída:
  - `WWW/MICROSERVICE/LEAR_LOPES/DOCS/lopes_9004/contract/report.json`
  - `WWW/MICROSERVICE/LEAR_LOPES/DOCS/lopes_9004/contract/report.md`

**Sem dependências externas**: usar apenas `fs`, `path`, `url` e `import()` para carregar o `routes.mjs`.

### B) Modelo de dados (para IA-friendly)

`report.json` conterá:

- `meta`: timestamp, caminhos usados, tags filtradas
- `backEndpoints`: lista normalizada `{ method, path, mockUri, operationId, tags, requiredQueryParams, security }`
- `mockRoutes`: lista normalizada `{ method, uri, executionMode, handler_class, handler_function }`
- `match`:
  - `mocked`: endpoints do BACK que têm rota no mock com `mode=mock|hybrid`
  - `original`: endpoints do BACK que têm rota com `mode=original` (se aparecer)
  - `proxied`: endpoints do BACK sem rota correspondente (gap)
  - `mockOnly`: rotas do mock sem endpoint correspondente no BACK (no universo filtrado ou total — ver decisão abaixo)

`report.md` conterá:

- sumário por tag (contagens)
- tabela/lista dos top gaps (ex.: 20 primeiros por tag)
- lista de rotas mock-only (para evidenciar divergência)

### C) Matching/normalização (regra do MVP)

- Para cada operação do OpenAPI:
  - `openapiPath = "/webservice/integration/..."`.
  - `mockUri = "/Servidor" + openapiPath`.
  - “Chave” = `${METHOD} ${mockUri}`.
- Para cada rota do mock:
  - “Chave” = `${METHOD} ${uri}`.
- Match por igualdade exata (MVP).
  - Sem resolver `{param}` vs `:param` neste MVP (podemos adicionar depois).

## Decisões já fechadas

- Escopo do BACK: **só 9004 (Servidor)**.
- Entrega MVP: **só relatório de gaps** (sem gerar rotas/stubs).
- Filtro por tags (MVP): **Produto**, **Customer**, **Pedido**.
- Runtime: **Node.js** (sem Python).

## Assunções

- O `MOCK-END` atende `/connect/*` via `routes/proxy.mjs`, então endpoint “sem rota declarada” é classificado como **proxied** (não mockado).
- A fonte do spec estável é `api-docs.json` já presente em `DOCS/lopes_9004`.

## Passos de implementação

1) Criar pasta `WWW/MICROSERVICE/LEAR_LOPES/contract/`.
2) Criar `contract-9004.config.json` com:
   - `openapiPath`: `.../DOCS/lopes_9004/api-docs.json`
   - `mockRoutesPath`: `.../MOCK-END/PROJETOS/connect/routes.mjs`
   - `tags`: `["Produto","Customer","Pedido"]`
   - `outputDir`: `.../DOCS/lopes_9004/contract`
3) Implementar `contract-9004.mjs`:
   - carregar config
   - ler e parsear `api-docs.json`
   - filtrar operações por tags
   - importar `routes.mjs` e extrair `routes`
   - normalizar + comparar
   - escrever `report.json` e `report.md`
4) Atualizar `WWW/MICROSERVICE/LEAR_LOPES/IA/AGENTS.md` com:
   - como rodar a ferramenta
   - como interpretar o relatório (mocked vs proxied vs mock-only)
5) Rodar manualmente (verificação) e iterar:
   - validar contagens esperadas
   - validar pelo menos 1 endpoint conhecido (ex.: `/webservice/integration/getIntegradora` deve cair em proxied hoje)

## Verificação (sem testes automatizados)

- Executar:
  - `node .../contract/contract-9004.mjs`
- Checar existência de:
  - `.../DOCS/lopes_9004/contract/report.json`
  - `.../DOCS/lopes_9004/contract/report.md`
- Checar sanity:
  - `report.json.meta.tags` == `["Produto","Customer","Pedido"]`
  - `proxied.length` > 0
  - `mocked.length` pode ser 0 (provável no estado atual)

