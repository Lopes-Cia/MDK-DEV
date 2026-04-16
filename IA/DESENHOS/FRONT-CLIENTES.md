# FRONT-CLIENTES - Implementacao do Recurso (IA-Friendly)

Este arquivo define a IMPLEMENTACAO do recurso CLIENTES no FRONT, seguindo o modelo:
- [FRONT-END-MODELO-FLUXO.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/FRONT-END-MODELO-FLUXO.md)

E consumindo apenas os endpoints existentes no MOCK:
- [MOCK-CLIENTES.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/MOCK-CLIENTES.md)

Status: implementacao inicial (somente `login` e `cadastro`).

## Objetivo

- Documentar o consumo do recurso CLIENTES no front sem inventar endpoints.
- Definir contrato de BFF interno (`/api/...`) que chama a integracao externa (`/Servidor/...`) do mock.

## Regra de Ouro (obrigatoria)

- Este arquivo lista como "endpoints do recurso" apenas endpoints cujo metodo + URI estejam explicitamente definidos como implementados no `MOCK-CLIENTES.md`.
- Operacoes-modelo no mock (GET/POST/PUT/DELETE sem URI fechada) nao entram aqui como endpoints existentes.

## Escopo

- Dominio interno (BFF): `/api/clientes`
- Integracao externa (MOCK-END): `/Servidor/webservice/integration/clientes`

## Endpoints Existentes (alinhado ao MOCK)

### 1) Login

- Metodo: `POST`
- BFF: `/api/clientes/login`
- Integracao: `/Servidor/webservice/integration/clientes/login`
- Body:

```json
{ "email": "teste@exemplo.com", "senha": "123456" }
```

Respostas esperadas (mock):
- `401 { "error": "invalid_credentials" }`
- `403 { "error": "account_inactive" }`
- `200 { success: true, data: { cliente, enderecos, privacidade, token } }`

### 2) Cadastro

- Metodo: `POST`
- BFF: `/api/clientes/cadastro`
- Integracao: `/Servidor/webservice/integration/clientes/cadastro`
- Body (minimo + obrigatorios):
  - `tipoPessoa`: `PF` | `PJ`
  - `documento`: string
  - `nome`: string
  - `nomeFantasia`: string (obrigatorio se PJ)
  - `email`: string
  - `whatsapp`: string
  - `senha`: string
  - `doisFatores`: `{ habilitado: boolean, metodo: whatsapp|email }`
  - `enderecos`: `[]` (min 1)
  - `privacidade`: `{ ... }`

Respostas esperadas (mock):
- `201 { success: true, data: { cliente, enderecos, privacidade } }`
- `400 { error: "invalid_payload" }` / `{ error: "invalid_body" }`
- `409 { error: "email_already_exists" }` / `{ error: "documento_already_exists" }`

## Contrato de Dados (agregado)

O front deve tratar o cliente como um agregado com 3 blocos:

```json
{
  "cliente": {},
  "enderecos": [],
  "privacidade": {}
}
```

Regra:
- nunca retornar `senha` em payload de login/cadastro.

## Modelo do Fluxo (shape)

```js
{
  feature: "clientes",
  domain: "clientes",
  mock: { resourceDoc: "IA/DESENHOS/MOCK-CLIENTES.md" },
  integration: { baseUri: "/Servidor/webservice/integration/clientes" },
  bff: { baseUri: "/api/clientes" },
  endpoints: [
    {
      method: "POST",
      bffUri: "/api/clientes/login",
      integrationUri: "/Servidor/webservice/integration/clientes/login",
      existsInMock: true
    },
    {
      method: "POST",
      bffUri: "/api/clientes/cadastro",
      integrationUri: "/Servidor/webservice/integration/clientes/cadastro",
      existsInMock: true
    }
  ],
  dev: {
    page: "app/(shop)/dev/page.tsx",
    routes: [
      { label: "Clientes Login", url: "/api/clientes/login" },
      { label: "Clientes Cadastro", url: "/api/clientes/cadastro" }
    ]
  }
}
```

## Modelo de Arquivos (mapa)

Arquivos sugeridos (padrao do `FRONT-END-MODELO-FLUXO.md`) para suportar apenas login/cadastro:

- Tipos:
  - `lib/types/clientes.ts`
- API client (browser -> /api):
  - `lib/api/clientes.ts`
- Integration service (server -> /Servidor/...):
  - `lib/integration/clientesService.ts`
- API Routes (Next):
  - `app/api/clientes/login/route.ts` (POST)
  - `app/api/clientes/cadastro/route.ts` (POST)
- Store:
  - `stores/clientes-store.ts`
  - registro no `control-store`
- UI (referencia):
  - `app/(shop)/login/page.tsx`
  - `app/(shop)/cadastro/page.tsx`

## Teste Manual (DEV page)

Adicionar na pagina `dev` apenas as rotas que existem no recurso hoje:

```txt
{ label: "Clientes Login", url: "/api/clientes/login" }
{ label: "Clientes Cadastro", url: "/api/clientes/cadastro" }
```

## Evolucao (quando o mock crescer)

Quando o `MOCK-CLIENTES.md` publicar URIs fechadas para CRUD/subrecursos, este arquivo deve ser atualizado para incluir os novos endpoints, seguindo a Regra de Ouro.
