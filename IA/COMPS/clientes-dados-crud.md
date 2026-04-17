# Clientes — Dados/Privacidade/Endereços (CRUD) — Guia rápido

## Objetivo
Permitir, via front `connect-ecommerce`, as operações abaixo no mock de clientes:
- Atualizar `meus_dados`
- Atualizar `privacidade` (inclui `privacidade.doisFatores`)
- CRUD de `enderecos` (listar, criar, editar, excluir)

O storage é o arquivo:
- [clientes.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/clientes.json)

## Modelo (schema novo)
Cada item do array do `clientes.json` segue o formato:

```json
{
  "meus_dados": { "id": 1004, "nome": "...", "email": "...", "whatsapp": "...", "status": "ativo", "createdAt": "..." },
  "enderecos": [ { "id": 6, "clienteId": 1004, "cep": "...", "logradouro": "...", "numero": "...", "bairro": "...", "cidade": "...", "uf": "SP" } ],
  "privacidade": { "clienteId": 1004, "doisFatores": { "habilitado": false, "metodo": "email" }, "aceitaTermos": true, "updatedAt": "..." }
}
```

## Rotas (BFF no Next.js)
Essas rotas ficam no `connect-ecommerce` em `app/api/clientes/*` e devem ser chamadas pelo front (via store):

- **PUT** `/api/clientes/meus-dados`
  - [route.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/api/clientes/meus-dados/route.ts)
- **PUT** `/api/clientes/privacidade`
  - [route.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/api/clientes/privacidade/route.ts)
- **GET** `/api/clientes/enderecos/cliente/:clienteId`
  - [route.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/api/clientes/enderecos/cliente/%5BclienteId%5D/route.ts)
- **POST** `/api/clientes/enderecos`
  - [route.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/api/clientes/enderecos/route.ts)
- **PUT** `/api/clientes/enderecos/:enderecoId`
  - [route.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/api/clientes/enderecos/%5BenderecoId%5D/route.ts)
- **DELETE** `/api/clientes/enderecos/:enderecoId`
  - [route.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/api/clientes/enderecos/%5BenderecoId%5D/route.ts)

## Rotas (MOCK-END / integração)
Essas rotas existem no microserviço MOCK-END (projeto `connect`) e são chamadas pelo BFF:

- **PUT** `/Servidor/webservice/integration/clientes/meus-dados`
- **PUT** `/Servidor/webservice/integration/clientes/privacidade`
- **GET** `/Servidor/webservice/integration/clientes/enderecos/:clienteId`
- **POST** `/Servidor/webservice/integration/clientes/enderecos`
- **PUT** `/Servidor/webservice/integration/clientes/enderecos/:enderecoId`
- **DELETE** `/Servidor/webservice/integration/clientes/enderecos/:enderecoId`

Referência:
- [routes.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs#L113-L201)

## Contratos (request/response)

### 1) Update `meus_dados`
**Request (BFF e MOCK-END):**

```json
{
  "clienteId": 1004,
  "patch": {
    "nome": "Novo Nome",
    "email": "novo@email.com",
    "whatsapp": "11999990000"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "meus_dados": {
      "id": 1004,
      "tipoPessoa": "PF",
      "documento": "DOC-...",
      "nome": "Novo Nome",
      "email": "novo@email.com",
      "whatsapp": "11999990000",
      "status": "ativo",
      "createdAt": "2026-04-16T17:02:34.068Z"
    },
    "enderecos": [],
    "privacidade": { "clienteId": 1004, "doisFatores": { "habilitado": false, "metodo": "email" } }
  }
}
```

Regras importantes:
- `senha`, `id` e `createdAt` não são atualizáveis por patch.
- O retorno de `meus_dados` vem sanitizado (sem `senha`).

Implementação/allowlist no MOCK-END:
- [sanitizeMeusDadosPatch](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/ClientesController.mjs#L183-L203)

### 2) Update `privacidade`
**Request:**

```json
{
  "clienteId": 1004,
  "patch": {
    "aceitaMarketing": true,
    "aceitaTermos": true,
    "aceitaCookies": true,
    "canalPreferido": "email",
    "doisFatores": { "habilitado": true, "metodo": "email" }
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "privacidade": {
      "clienteId": 1004,
      "doisFatores": { "habilitado": true, "metodo": "email" },
      "aceitaMarketing": true,
      "aceitaTermos": true,
      "aceitaCookies": true,
      "canalPreferido": "email",
      "updatedAt": "2026-04-16T18:00:00.000Z"
    }
  }
}
```

Allowlist no MOCK-END:
- [sanitizePrivacidadePatch](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/ClientesController.mjs#L205-L217)

### 3) Endereços — Listar
**Request:**
- `GET /api/clientes/enderecos/cliente/1004`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 6,
      "clienteId": 1004,
      "cep": "01001000",
      "logradouro": "Praça da Sé",
      "numero": "100",
      "bairro": "Sé",
      "cidade": "São Paulo",
      "uf": "SP",
      "pais": "BR"
    }
  ]
}
```

### 4) Endereços — Criar
**Request:**

```json
{
  "clienteId": 1004,
  "endereco": {
    "cep": "01001000",
    "logradouro": "Praça da Sé",
    "numero": "100",
    "bairro": "Sé",
    "cidade": "São Paulo",
    "uf": "SP",
    "complemento": "lado ímpar",
    "pais": "BR"
  }
}
```

**Response:**
- Retorna a lista completa atualizada de endereços (`data: enderecos[]`).

Campos obrigatórios validados no MOCK-END:
- `cep`, `logradouro`, `numero`, `bairro`, `cidade`, `uf`

Validação no MOCK-END:
- [sanitizeEnderecoInput](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/ClientesController.mjs#L125-L148)

### 5) Endereços — Editar
**Request:**
- `PUT /api/clientes/enderecos/6`

```json
{
  "clienteId": 1004,
  "patch": {
    "cep": "01001000",
    "logradouro": "Praça da Sé",
    "numero": "101",
    "bairro": "Sé",
    "cidade": "São Paulo",
    "uf": "SP",
    "complemento": "lado par"
  }
}
```

**Response:**
- Retorna a lista completa atualizada de endereços (`data: enderecos[]`).

Observação:
- O MOCK-END exige que, após o merge, o endereço fique “completo” (os obrigatórios não podem ficar vazios).

### 6) Endereços — Excluir
**Request:**
- `DELETE /api/clientes/enderecos/6`

```json
{
  "clienteId": 1004
}
```

**Response:**
- Retorna a lista completa atualizada de endereços (`data: enderecos[]`).

## Como usar no front (padrão recomendado)
Use sempre o store (não chame o BFF direto nos componentes):
- [clientes-store.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/stores/clientes-store.ts)

Fluxo:
1) UI chama `useClientesStore().updateMeusDados(...)` / `updatePrivacidade(...)` / `createEndereco(...)` etc.
2) Store chama `/api/clientes/*` via `apiClient`.
3) BFF chama `lib/integration/clientesService.ts`.
4) Integração fala com o MOCK-END.
5) Store atualiza `loginData` com o retorno, mantendo `token`.

## Operação (importante)
O MOCK-END mantém cache em memória das rotas/handlers do projeto `connect`.
- Se você alterar `routes.mjs` ou handlers do MOCK-END: reinicie o MOCK-END (porta fixa 4000).
