# Plano — CRUD de dados do cliente (endpoints + wiring no connect-ecommerce)

## Resumo
Você pediu endpoints para:
- Atualizar `meus_dados` (clientes.json: [L238-L248](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/clientes.json#L238-L248)).
- Atualizar `privacidade` (clientes.json: [L266-L277](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/clientes.json#L266-L277)).
- Para `enderecos` (clientes.json: [L249-L265](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/clientes.json#L249-L265)): listar, criar, editar e excluir.

O MOCK-END + BFF já estão implementados no repo. Falta “ligar” no `connect-ecommerce` (store + páginas) e criar o guia IA-friendly em `IA/COMPS/clientes-dados-crud.md`.

## Estado atual (grounded)

### 1) MOCK-END (PROJETOS/connect) — já pronto
- Rotas novas já existem em [routes.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs#L113-L201):
  - PUT `/Servidor/webservice/integration/clientes/meus-dados`
  - PUT `/Servidor/webservice/integration/clientes/privacidade`
  - GET `/Servidor/webservice/integration/clientes/enderecos/:clienteId`
  - POST `/Servidor/webservice/integration/clientes/enderecos`
  - PUT `/Servidor/webservice/integration/clientes/enderecos/:enderecoId`
  - DELETE `/Servidor/webservice/integration/clientes/enderecos/:enderecoId`
- Handler HTTP já existe em [clientes.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/clientes.mjs#L59-L228).
- Persistência/validação já existe no [ClientesController.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/ClientesController.mjs#L367-L537).

### 2) connect-ecommerce — BFF + integração já prontos
- Integração server-only já exposta em [clientesService.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/lib/integration/clientesService.ts#L32-L143):
  - updateMeusDadosCliente, updatePrivacidadeCliente
  - listEnderecosCliente, createEnderecoCliente, updateEnderecoCliente, deleteEnderecoCliente
- Rotas BFF Next já existem em `app/api/clientes/*`:
  - [meus-dados](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/api/clientes/meus-dados/route.ts)
  - [privacidade](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/api/clientes/privacidade/route.ts)
  - [enderecos GET](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/api/clientes/enderecos/%5BclienteId%5D/route.ts)
  - [enderecos POST](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/api/clientes/enderecos/route.ts)
  - [enderecos PUT/DELETE](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/api/clientes/enderecos/%5BenderecoId%5D/route.ts)

### 3) connect-ecommerce — store e telas ainda não usam os endpoints
- Store atual só faz login e mantém `loginData`/`isLoggedIn` em [clientes-store.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/stores/clientes-store.ts#L48-L96).
- Telas ainda exibem `alert("Endpoint não implementado")`:
  - [meus-dados/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-dados/page.tsx#L31-L37)
  - [meus-enderecos/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-enderecos/page.tsx#L87-L93)
  - [privacidade/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/privacidade/page.tsx#L22-L33)

## Decisões e contratos (definidos pelo código atual)
- Schema alvo é somente o novo: `{ meus_dados, enderecos, privacidade }` (sem compat legada).
- Identificação do cliente:
  - Updates/criação: `clienteId` no body.
  - Listagem: `:clienteId` na URL.
  - Update/delete endereço: `:enderecoId` na URL; `clienteId` no body é opcional (para “amarrar” por segurança).
- `meus_dados` não aceita update de `senha`, `id`, `createdAt` (controller sanitiza/ignora).

## Plano de implementação (3–8 passos) + validação

### Passo 1 — Consolidar contrato de payloads (front)
Objetivo: padronizar no `connect-ecommerce` o formato esperado pelos endpoints.
- `meus_dados` (patch): `{ nome, email, whatsapp, tipoPessoa, documento, nomeFantasia, status }` (somente os campos que forem enviados).
- `privacidade` (patch): `{ aceitaMarketing, aceitaTermos, aceitaCookies, canalPreferido, doisFatores: { habilitado, metodo } }`.
- `enderecos`:
  - create: `{ clienteId, endereco: { cep, logradouro, numero, bairro, cidade, uf, complemento?, pais?, referencia?, rotulo?, principal? } }`
  - update: `{ clienteId?, patch: { ...campos... } }`

Validação:
- Conferir que as páginas atuais coletam pelo menos os campos obrigatórios (endereços) e que `clienteId` vem de `loginData.meus_dados.id`.

### Passo 2 — Implementar ações CRUD no store de clientes
Arquivo: [clientes-store.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/stores/clientes-store.ts)
- Adicionar ações:
  - `updateMeusDados(patch)` → `PUT /api/clientes/meus-dados` e atualiza `loginData.meus_dados` (e também `enderecos/privacidade` se vierem no response).
  - `updatePrivacidade(patch)` → `PUT /api/clientes/privacidade` e atualiza `loginData.privacidade`.
  - `listEnderecos()` → `GET /api/clientes/enderecos/:clienteId` e atualiza `loginData.enderecos`.
  - `createEndereco(endereco)` → `POST /api/clientes/enderecos` e atualiza `loginData.enderecos`.
  - `updateEndereco(enderecoId, patch, clienteIdOpcional)` → `PUT /api/clientes/enderecos/:enderecoId` e atualiza `loginData.enderecos`.
  - `deleteEndereco(enderecoId, clienteIdOpcional)` → `DELETE /api/clientes/enderecos/:enderecoId` e atualiza `loginData.enderecos`.
- Regras de erro:
  - Se não estiver logado ou não houver `clienteId`, falhar com mensagem clara.
  - Reaproveitar `ApiError/apiClient` e `getApiErrorMessage`.

Validação:
- Verificar tipagem e que `loginData` mantém `token` intacto após updates.

### Passo 3 — Ligar “Meus dados” ao store
Arquivo: [meus-dados/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-dados/page.tsx)
- Trocar `alert("Endpoint não implementado")` por:
  - chamada `updateMeusDados({ nome, email, whatsapp: telefone })`
  - `alert` de sucesso/erro (mantendo o padrão atual simples).

Validação:
- Garantir que o payload não envia `senha`.

### Passo 4 — Ligar “Privacidade” ao store
Arquivo: [privacidade/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/privacidade/page.tsx)
- Trocar `alert("Endpoint não implementado")` por:
  - `const parsed = JSON.parse(value || "null")`
  - chamada `updatePrivacidade(parsed)` (o controller vai filtrar os campos válidos).
  - `alert` de sucesso/erro.

Validação:
- Manter validação de JSON inválido antes de enviar.

### Passo 5 — Ligar “Meus endereços” ao store (create/update/delete)
Arquivo: [meus-enderecos/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-enderecos/page.tsx)
- No submit:
  - Se `selectedIndex === "new"` → `createEndereco({ cep, logradouro: rua, numero, complemento, bairro, cidade, uf })`
  - Senão → pegar `enderecoId` do endereço selecionado e fazer `updateEndereco(enderecoId, { cep, logradouro: rua, numero, complemento, bairro, cidade, uf })`
- Adicionar um botão “Excluir endereço” quando selecionado um endereço existente:
  - chama `deleteEndereco(enderecoId)`
- Validação mínima no client:
  - exigir `cep/logradouro/numero/bairro/cidade/uf` antes de salvar (para não bater no 400 do mock-end).

Validação:
- Após create/update/delete, garantir que a lista em memória (`loginData.enderecos`) reflete o retorno do endpoint.

### Passo 6 — Criar guia IA-friendly
Arquivo novo: `c:\LOPES\www\MDK-DEV\IA\COMPS\clientes-dados-crud.md`
- Conteúdo:
  - Mapa de rotas (BFF Next e rotas do MOCK-END)
  - Contratos de request/response com exemplos reais baseados no `clientes.json`
  - Fluxo recomendado: UI → `clientes-store` → `/api/clientes/*` (BFF) → `clientesService.ts` → MOCK-END
  - Observação operacional: reiniciar MOCK-END (porta 4000) ao alterar rotas/handlers

Validação:
- Conferir que os exemplos batem com o schema novo (`meus_dados`, `enderecos`, `privacidade.doisFatores`).

## Itens fora de escopo (para não “crescer” a entrega)
- Persistência de sessão/login no front além do estado atual do store.
- UI avançada de loading/error (vai ficar no padrão simples atual com `alert`, sem componente novo).
- Validação com zod (não vou introduzir dependência nova aqui).

## Verificação sugerida (manual, sem testes)
- Fluxo base:
  - Logar com cliente existente.
  - Abrir `/cliente/meus-dados`, editar e salvar; conferir que `loginData.meus_dados` muda.
  - Abrir `/cliente/privacidade`, editar JSON (ex.: `doisFatores.habilitado`) e salvar; conferir persistência.
  - Abrir `/cliente/meus-enderecos`: criar, editar e excluir; conferir refletindo no `loginData.enderecos`.
- Persistência:
  - Conferir o arquivo `clientes.json` atualizado após as operações (no MOCK-END).

