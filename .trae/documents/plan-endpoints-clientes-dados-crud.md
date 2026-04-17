# Plano — Endpoints CRUD de dados do cliente (MOCK-END + connect-ecommerce)

## Resumo
Implementar endpoints no MOCK-END (projeto `connect`) para:
- Atualizar `meus_dados` (ex.: nome, email, whatsapp, etc.) em `handlers/mock/clientes.json`.
- Atualizar `privacidade` (incluindo `privacidade.doisFatores`).
- CRUD completo de `enderecos` (listar, criar, editar, excluir).

Em seguida, implementar o BFF no `connect-ecommerce` (rotas Next em `app/api/clientes/*`) e ações no `stores/clientes-store.ts` para consumir esses endpoints. Criar um guia IA-friendly em `IA/COMPS/clientes-dados-crud.md` descrevendo contrato, rotas e exemplos.

Decisões já confirmadas:
- Sem compatibilidade legada (usar apenas schema novo: `meus_dados`, `enderecos`, `privacidade.doisFatores`).
- Identificação do cliente nos endpoints via `clienteId` no body (sem token).

## Análise do estado atual (grounded)
### MOCK-END (connect)
- Rotas existentes: apenas login e cadastro de cliente
  - [routes.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs#L113-L135)
  - Handler: [clientes.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/clientes.mjs#L14-L62)
  - Controller: [ClientesController.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/ClientesController.mjs)
- Storage já está no schema novo:
  - [clientes.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/clientes.json#L1-L41)

### connect-ecommerce
- Existe BFF para login:
  - [app/api/clientes/login/route.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/api/clientes/login/route.ts)
- Integração server-only só tem `loginCliente` por POST:
  - [clientesService.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/lib/integration/clientesService.ts#L51-L61)
- Store atual guarda `loginData` com `{ meus_dados, enderecos, privacidade, token }`, sem ações de update:
  - [clientes-store.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/stores/clientes-store.ts#L23-L56)

## Mudanças propostas (arquivos e como)

### 1) MOCK-END — Novas rotas (PROJETOS/connect/routes.mjs)
Adicionar rotas mock para clientes:
- **PUT** `/Servidor/webservice/integration/clientes/meus-dados` → handler `api/clientes` fn `updateMeusDados`
- **PUT** `/Servidor/webservice/integration/clientes/privacidade` → handler `api/clientes` fn `updatePrivacidade`
- **GET** `/Servidor/webservice/integration/clientes/enderecos/:clienteId` → handler `api/clientes` fn `listEnderecos`
- **POST** `/Servidor/webservice/integration/clientes/enderecos` → handler `api/clientes` fn `createEndereco`
- **PUT** `/Servidor/webservice/integration/clientes/enderecos/:enderecoId` → handler `api/clientes` fn `updateEndereco`
- **DELETE** `/Servidor/webservice/integration/clientes/enderecos/:enderecoId` → handler `api/clientes` fn `deleteEndereco`

Notas:
- Auth do router não é aplicado automaticamente; validações ficam no handler/controller.
- Os parâmetros `:clienteId` e `:enderecoId` são suportados pelo dispatcher do connect.

### 2) MOCK-END — Handler HTTP (handlers/mock/api/clientes.mjs)
Expandir o handler existente (mantendo login/cadastro) com:
- `updateMeusDados(req, res, ctx)` (PUT)
- `updatePrivacidade(req, res, ctx)` (PUT)
- `listEnderecos(req, res, ctx)` (GET)
- `createEndereco(req, res, ctx)` (POST)
- `updateEndereco(req, res, ctx)` (PUT)
- `deleteEndereco(req, res, ctx)` (DELETE)

Regras de request/response (padrão):
- Respostas JSON:
  - Sucesso: `{ success: true, data: ... }`
  - Erro: `{ success: false, message?: string, error?: string }`
- Validação mínima:
  - `clienteId` obrigatório no body para updates e criação.
  - Para `:clienteId` e `:enderecoId`, usar `ctx.routeParams`.

### 3) MOCK-END — Controller (handlers/mock/api/ClientesController.mjs)
Adicionar métodos focados no schema novo:
- `updateMeusDados({ clienteId, patch })`
  - Localiza item por `meus_dados.id === clienteId`
  - Aplica patch permitido (lista allowlist) em `meus_dados` (sem aceitar `senha` via update)
  - Persiste em `clientes.json`
  - Retorna `{ meus_dados, enderecos, privacidade }` atualizado
- `updatePrivacidade({ clienteId, patch })`
  - Atualiza `privacidade` (inclui `doisFatores`, `aceitaMarketing`, `aceitaTermos`, `aceitaCookies`, `canalPreferido`, `updatedAt`)
- Endereços:
  - `listEnderecos({ clienteId })` → retorna `enderecos[]`
  - `createEndereco({ clienteId, endereco })` → cria com `id` autoincrement, `clienteId`, valida campos obrigatórios (cep/logradouro/numero/bairro/cidade/uf)
  - `updateEndereco({ clienteId?, enderecoId, patch })` → atualiza campos permitidos; se `clienteId` vier, validar correspondência
  - `deleteEndereco({ clienteId?, enderecoId })` → remove; se `clienteId` vier, validar correspondência

Decisão de reversibilidade:
- Todas as novas rotas e funções ficam concentradas em `routes.mjs` + `clientes.mjs` + `ClientesController.mjs`.
- Para rollback rápido: reverter apenas esses arquivos (ou remover as rotas novas), sem mexer em login/cadastro.

### 4) connect-ecommerce — BFF (app/api/clientes/*)
Criar rotas Next (BFF) espelhando as integrações:
- `PUT app/api/clientes/meus-dados/route.ts`
- `PUT app/api/clientes/privacidade/route.ts`
- `GET app/api/clientes/enderecos/[clienteId]/route.ts`
- `POST app/api/clientes/enderecos/route.ts`
- `PUT app/api/clientes/enderecos/[enderecoId]/route.ts`
- `DELETE app/api/clientes/enderecos/[enderecoId]/route.ts`

Todas essas rotas:
- Validam body/params e retornam `{ success: false, message }` em 400.
- Chamam `lib/integration/clientesService.ts` (novas funções) para falar com o mock-end.

### 5) connect-ecommerce — Integração (lib/integration/clientesService.ts)
Evoluir a integração para suportar métodos além de POST:
- Criar helper `integrationRequest<T>(method, path, body?)` usando `fetchWithRetry`.
- Implementar funções:
  - `updateMeusDadosCliente(payload)`
  - `updatePrivacidadeCliente(payload)`
  - `listEnderecosCliente(clienteId)`
  - `createEnderecoCliente(payload)`
  - `updateEnderecoCliente(enderecoId, payload)`
  - `deleteEnderecoCliente(enderecoId, payloadOpcional)`

### 6) connect-ecommerce — Store (stores/clientes-store.ts)
Adicionar ações CRUD no store:
- `updateMeusDados(input)` → chama `/api/clientes/meus-dados`, atualiza `loginData.meus_dados`
- `updatePrivacidade(input)` → chama `/api/clientes/privacidade`, atualiza `loginData.privacidade`
- `listEnderecos(clienteId)` → chama `/api/clientes/enderecos/:clienteId`, atualiza `loginData.enderecos`
- `createEndereco(input)` / `updateEndereco(...)` / `deleteEndereco(...)` → atualizam `loginData.enderecos`

Observação:
- As páginas já possuem forms com “Salvar” hoje; após endpoints, trocar `alert("Endpoint não implementado")` por chamada real ao store e alert de sucesso/erro.

### 7) Guia IA-friendly
Criar arquivo:
- `c:\LOPES\www\MDK-DEV\IA\COMPS\clientes-dados-crud.md`

Conteúdo:
- Tabela de endpoints (MOCK-END + BFF)
- Contratos de request/response (JSON)
- Fluxo recomendado no front (store → BFF → integração → mock-end)
- Exemplos de payload baseados em `clientes.json` (meus_dados/enderecos/privacidade)
- Checklist de rollback (remover rotas novas + desfazer chamadas do store/forms)

## Assunções
- O schema do arquivo `clientes.json` permanece como array de itens `{ meus_dados, enderecos[], privacidade }`.
- O cliente é identificado via `clienteId` no body (e/ou param em listagem), conforme decisão confirmada.
- Sem persistência de sessão no front neste plano; o `clienteId` pode ser obtido de `loginData.meus_dados.id`.

## Verificação (sem testes automáticos)
- MOCK-END:
  - Enviar requests manuais (Postman/curl) para:
    - atualizar `meus_dados` e conferir persistência no `clientes.json`
    - atualizar `privacidade` (incluindo `doisFatores`) e conferir persistência
    - criar/editar/excluir endereços e conferir no arquivo
- connect-ecommerce:
  - Logar, abrir `/cliente/meus-dados`, salvar e ver alteração refletida no painel/sidebars
  - Abrir `/cliente/meus-enderecos`, criar/editar/excluir e ver refletir no checkout (select de endereços)

