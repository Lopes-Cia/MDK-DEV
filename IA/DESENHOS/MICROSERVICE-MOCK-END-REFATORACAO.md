# MOCK-END — Desenho de Refatoração (multi-projetos + proxy por base)

Este desenho define a refatoração do microservice MOCK-END para suportar múltiplos “projetos” com `.env` por base, preservando compatibilidade com o connect-site e mantendo o comportamento de proxy para o backend original.

Referências:
- Contrato de endpoints do Connect: [ENDPOINTS.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/ENDPOINTS.md)
- Connect-site (espelho de chamadas): [connect-ecommerce-develop](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce-develop)
- MOCK-END atual (entrypoint): [server.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/server.mjs)
- Proxy atual: [routes/proxy.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/routes/proxy.mjs)

## Objetivo

Permitir que o connect-site aponte suas bases para o MOCK-END mantendo o mesmo “shape” de URL (host/porta mudam; path base é preservado), enquanto o MOCK-END decide o upstream real via `.env` do projeto correspondente.

Exemplo (espelho por base):
- Original AUTH: `https://gp.lopesecia.com.br:9002/ApiLopes/webservice/api`
- Local AUTH: `http://localhost:4000/ApiLopes/webservice/api`
- Original INTEGRATION: `https://gp.lopesecia.com.br:9004`
- Local INTEGRATION: `http://localhost:4000/connect`

## Premissas e restrições

- Porta padrão do MOCK-END: `4000`.
- O connect-site pode configurar bases com subpaths (ex.: `/ApiLopes/webservice/api` e `/connect`).
- O MOCK-END deve operar em modo “proxy p/ backend original” (upstream), mantendo compatibilidade com o que o connect-site já faz hoje.
- Conteúdo “tenant” / rotas de tenant não devem atrapalhar o fluxo do Connect; se existirem, devem ficar isoladas como legado (fora do caminho principal).
- Não usar fallback do modelo antigo para URLs de upstream: se o `.env` do projeto/base não existir (ou não tiver a variável exigida), falhar explicitamente com `500` (`proxy_not_configured`).

## Terminologia

- **Base local**: prefixo HTTP que o connect-site chama no MOCK-END.
  - AUTH local base: `/ApiLopes/webservice/api`
  - INTEGRATION local base: `/connect`
- **Projeto**: pasta dentro de `PROJETOS/` que representa uma base local e contém o `.env` daquela base.
- **Upstream**: backend real (ex.: `gp.lopesecia.com.br`) para o qual o MOCK-END faz proxy.

## Estrutura de diretórios (proposta)

Diretório do microservice:
- `WWW/MICROSERVICE/MOCK-END/`
  - `server.mjs` (entrypoint fino)
  - `routes/` (roteamento principal)
  - `lib/` (helpers)
  - `PROJETOS/` (projetos/base → `.env` por base)
    - `ApiLopes/webservice/api/.env` (config do upstream AUTH)
    - `connect/.env` (config do upstream INTEGRATION)
  - `LEGADO/` (código legado isolado, sem impacto no roteamento principal)

Observação: `PROJETOS/` replica a “forma” do path base local. Isso facilita perceber as similaridades com a rota original e reduz confusão ao mapear o que é base do quê.

## Regras de resolução de `.env` por base

### Onde fica o `.env`

- Para requisições que começam com `/ApiLopes/webservice/api/...`:
  - Ler `.env` em `PROJETOS/ApiLopes/webservice/api/.env`
- Para requisições que começam com `/connect/...`:
  - Ler `.env` em `PROJETOS/connect/.env`

### Artefatos obrigatórios por projeto/base

Cada projeto/base deve existir no repositório com estes arquivos (não é para “cair” em `.env` global do root):

- `PROJETOS/ApiLopes/webservice/api/.env`
- `PROJETOS/ApiLopes/webservice/api/routes.mjs`
- `PROJETOS/connect/.env`
- `PROJETOS/connect/routes.mjs`

## Rotas declarativas por projeto (routes)

Além do `.env` por base, cada projeto pode ter um arquivo de rotas declarativas para documentar (e depois dirigir) o comportamento por endpoint, especialmente quando houver necessidade de mock local.

### Onde fica

- `PROJETOS/<base>/routes.mjs`
  - Ex.: `PROJETOS/connect/routes.mjs`

### Formato (contrato)

O arquivo exporta um array `routes`. Cada item descreve um endpoint:

- `method`: método HTTP (ex.: `GET`)
- `uri`: path (ex.: `/api/products`)
- `auth`: rótulo simples de autenticação
  - Observação: o MOCK-END não precisa impor auth, mas o rótulo ajuda a preservar o modelo original e guiar futuras implementações.
- `execution`: define o que acontece quando essa rota é atendida
  - `mode` (um de): `original` | `mock` | `hybrid`
    - `original`: executar o comportamento original
    - `mock`: executar função customizada do mock-end
    - `hybrid`: executar o original e complementar com lógica customizada (merge/ajustes)
- `handler_class` e `handler_function`: referência explícita (estilo “Controller::method”) para facilitar navegação
  - `handler_class`: caminho relativo dentro de `PROJETOS/<base>/handlers/` (ex.: `api/auth`)
  - `handler_function`: chave/ação (string) dentro do handler (ex.: `verify-token`)

Exemplo:

```js
export const routes = [
  {
    method: "POST",
    uri: "/api/auth/verify-token",
    auth: {
      mode: "none",
      label: "Sem auth no mock-end; manter rótulo para futura auth seguindo o modelo original.",
    },
    execution: {
      mode: "original",
    },
    handler_class: "api/auth",
    handler_function: "verify-token",
  },
];
```

### Handlers (organização)

Para manter o roteamento legível e com navegação direta:

- Os handlers do projeto ficam em `PROJETOS/<base>/handlers/`
  - Ex.: `PROJETOS/connect/handlers/api/auth.mjs`
- Cada arquivo exporta `handlers`:
  - `export const handlers = { "verify-token": async (req, res, ctx) => { ... } }`

### Como aplicar para outros endpoints

- Para cada endpoint novo do Connect (ou comportamento local necessário), criar um item no `routes.mjs` do projeto correspondente.
- Usar `execution.mode` para escolher rapidamente entre: manter proxy puro (`original`), mock local (`mock`) ou proxy + complemento (`hybrid`).

### Conteúdo mínimo esperado

- `PROJETOS/ApiLopes/webservice/api/.env` (AUTH upstream):
  - `AUTH_BASE_URL=https://gp.lopesecia.com.br:9002/ApiLopes/webservice/api`
  - `PRODUTO`, `EAN`, `IDINTEGRADORA`, `CODCLI`, `KEY` (se o fluxo do integrador precisar desses campos)

- `PROJETOS/connect/.env` (INTEGRATION upstream):
  - `INTEGRATION_URL_API=https://gp.lopesecia.com.br:9004`

### Precedência (quando existir mais de um lugar)

Ao tratar uma request:
1. Carregar variáveis de processo já definidas (execução do Node) como override.
2. Carregar `.env` do projeto (base específica da request).
3. Opcional: carregar um `.env` global (se existir) apenas para defaults comuns (porta, flags), sem conter URLs de upstream.

Resultado: o proxy sempre usa o `.env` do projeto/base correspondente ao path.

## Roteamento (visão de alto nível)

Ordem recomendada do roteamento no entrypoint:
1. `OPTIONS` (preflight)
2. Rotas de proxy (upstream) baseadas em prefixo:
   - `/ApiLopes/webservice/api/*` → AUTH upstream (usando `.env` de `PROJETOS/ApiLopes/webservice/api`)
   - `/connect/*` → INTEGRATION upstream (usando `.env` de `PROJETOS/connect`)
3. Rotas internas do Connect (se houver necessidade de comportamento local):
   - `/api/auth/*`
   - `/api/products*`
4. (Opcional/infra) `/health`
5. Legado (se habilitado explicitamente)

## Mapeamento de endpoints (Connect-site → MOCK-END → Upstream)

### Auth (base `/ApiLopes/webservice/api`)

O Connect chama (via server-to-server do connect-site) endpoints como:
- `/tokenService`
- `/postAutenteicaAplicativo`
- `/enviarToken`
- `/verificarTokenSistema`
- `/getOperadorSistemaForId`

No modo espelho local, o connect-site irá chamar:
- `http://localhost:4000/ApiLopes/webservice/api/tokenService` (etc.)

E o MOCK-END repassa para:
- `${AUTH_BASE_URL}/tokenService` (etc.), usando `PROJETOS/ApiLopes/webservice/api/.env`.

### Integração (base `/connect`)

O Connect chama (via server-to-server do connect-site) endpoints como:
- `/Servidor/webservice/integration/getIntegradora`
- `/Servidor/webservice/integration/getListProdutoLoja`
- `/Servidor/webservice/integration/getProdutoLoja`

No modo espelho local, o connect-site irá chamar:
- `http://localhost:4000/connect/Servidor/webservice/integration/getListProdutoLoja` (etc.)

E o MOCK-END repassa para:
- `${INTEGRATION_URL_API}/Servidor/webservice/integration/getListProdutoLoja` (etc.), usando `PROJETOS/connect/.env`.

### Home do connect-site

Na home, o browser chama apenas:
- `GET /api/products` (sem `Authorization`)

O token necessário é do integrador e ocorre dentro da rota server-to-server do connect-site, que por sua vez usa as bases `AUTH_BASE_URL`/`INTEGRATION_URL_API`.

## Proxy: regras de encaminhamento

O proxy deve:
- Preservar método, path e querystring.
- Preservar headers relevantes e remover hop-by-hop.
- Evitar acoplamento de `origin`/`referer` para não criar problemas de CORS no upstream.
- Repassar `Set-Cookie` (quando houver) e responder com o mesmo status/body do upstream.

## Legado

Todo comportamento “tenant” (ou qualquer outra estratégia de dados local que não seja proxy por base) deve ficar em `LEGADO/` e não ser carregado por default.

Critério: o código do Connect não deve precisar referenciar “tenant” para escolher fonte de dados; a escolha deve ser por **base/projeto** (prefixo).

## Observabilidade (mínimo)

- Log de erro de proxy deve incluir método + URL target e mensagem do erro, sem imprimir dados sensíveis.
- Erro de configuração deve retornar `500` com payload padrão:
  - `{ error: "proxy_not_configured", env: "<ENV_KEY>" }`

## Resultado esperado

Com as bases do connect-site apontando para `localhost:4000` e com `.env` por projeto em `PROJETOS/`, o usuário deve conseguir rodar o `dev` do connect-site e ver o mesmo comportamento que via `.env` original, com o MOCK-END atuando como camada intermediária.

## Próximo passo (a ser iniciado quando solicitado)

Ao confirmar este desenho, será criada uma lista de tarefas para implementar a refatoração completa conforme as seções acima.

Tarefa adicional (higienização/legado):
- Analisar todo o código do MOCK-END e mover tudo que for legado (rotas, libs, estratégias antigas, fluxos não usados pelo Connect) para `LEGADO/`, mantendo o caminho principal limpo e focado no proxy por base + Connect.

## Feedback incorporado (alinhamento de expectativa)

- Não manter fallback/compatibilidade com o “modelo antigo” para upstream:
  - Se `PROJETOS/<base>/.env` não existir ou não tiver `AUTH_BASE_URL`/`INTEGRATION_URL_API`, responder `500` com `{ error: "proxy_not_configured", env: "<ENV_KEY>" }`.
- `PROJETOS/` não é apenas “proposta”: os diretórios e arquivos `.env`/`routes.mjs` devem ser criados de forma explícita, pois o comportamento esperado depende deles.
- Evitar confusão de roteamento: o comportamento do Connect deve ser descrito/dirigido a partir do modelo `PROJETOS/<base>/routes.mjs`.
  - O arquivo `WWW/MICROSERVICE/MOCK-END/routes/connect.mjs` (se existir) deve virar apenas um “dispatcher/loader” (ou ser removido) e não concentrar a definição das rotas do Connect.
