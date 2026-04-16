# MOCK-CLIENTES Login Spec

## Why
Precisamos de um endpoint de login no MOCK-END (projeto `connect`) para testar fluxos de autenticação de clientes do ecommerce, usando dados mock e retornando também endereços e privacidade.

## What Changes
- Adicionar rota `POST /Servidor/webservice/integration/clientes/login` no `PROJETOS/connect/routes.mjs` (modo `mock`).
- Criar/atualizar arquivo de dados `PROJETOS/connect/handlers/mock/clientes.json` com `cliente[]`, `enderecos[]`, `privacidade[]` e um cliente de teste.
- Criar `ClientesController` para leitura e consulta do JSON e regra de autenticação mock.
- Criar handler `clientes.mjs` com função `login` compatível com o dispatcher (export `handlers`).
- Atualizar `IA/DESENHOS/MOCK-CLIENTES.md` para refletir o contrato real do login (senha em texto no mock + retorno incluindo cliente/enderecos/privacidade).

## Impact
- Affected specs: autenticação (login), mock de clientes, protocolo de teste pós-implementação.
- Affected code:
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs`
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/clientes.json`
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/ClientesController.mjs`
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/clientes.mjs`
  - `IA/DESENHOS/MOCK-CLIENTES.md`

## ADDED Requirements
### Requirement: Endpoint de Login (Mock)
O sistema SHALL expor `POST /Servidor/webservice/integration/clientes/login` no modo `mock`, aceitando `{ "email": string, "senha": string }`.

#### Scenario: Login OK (sem 2 fatores)
- **GIVEN** existe um cliente em `clientes.json` com `email` e `senha` correspondentes e `status = "ativo"`
- **WHEN** o client chama `POST /Servidor/webservice/integration/clientes/login`
- **THEN** a API retorna `200` com:
  - `success: true`
  - `data.cliente` (objeto do cliente, sem vazar senha)
  - `data.enderecos` (array filtrado por `clienteId`)
  - `data.privacidade` (objeto 1:1 por `clienteId`, ou `null` se ausente)
  - `data.token` (string mock)

#### Scenario: Email não encontrado
- **WHEN** `email` não existe no JSON
- **THEN** retornar `401` com `{ "error": "invalid_credentials" }`

#### Scenario: Senha incorreta
- **WHEN** `senha` não bate com o armazenado no JSON (mock em texto)
- **THEN** retornar `401` com `{ "error": "invalid_credentials" }`

#### Scenario: Cliente inativo
- **WHEN** cliente existe mas `status != "ativo"`
- **THEN** retornar `403` com `{ "error": "account_inactive" }`

### Requirement: Cliente de teste para login
O sistema SHALL conter um cliente de teste pré-carregado em `clientes.json` para validar o login sem 2 fatores.

#### Scenario: Credenciais de teste
- **WHEN** usar as credenciais documentadas no `IA/DESENHOS/MOCK-CLIENTES.md`
- **THEN** login deve retornar `200` e incluir `cliente + enderecos + privacidade`.

## MODIFIED Requirements
### Requirement: Contrato do MOCK-CLIENTES (doc)
O documento `IA/DESENHOS/MOCK-CLIENTES.md` SHALL refletir:
- `email` e `whatsapp` obrigatórios
- `id` numérico auto incremento
- `doisFatores` presente, mas login inicial sem 2 fatores
- `senha`/validação do login conforme decisão do mock (texto puro no JSON, sem vazar no retorno)

## REMOVED Requirements
Nenhuma.

