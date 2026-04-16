# MOCK-CLIENTES - Modelo de Rotas (Rascunho)

Este arquivo define o modelo de rotas/handlers/dados para o MOCK de CLIENTES, seguindo as mesmas regras do:
- [MOCK-END-MODELO-ROTA.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/MOCK-END-MODELO-ROTA.md)

Status: rascunho em construção (1º cliente: padrão ecommerce CPF/CNPJ).

## Objetivo

- Padronizar como criar rotas do recurso CLIENTES no MOCK-END.
- Garantir consistencia de rota + handler + controller + JSON + teste pos-implementacao.

## Escopo (a preencher)

- Projeto alvo: `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect`
- Recurso: `clientes`
- Prefixo de rotas:
  - Base: `/Servidor/webservice/integration/`
  - Recurso: `clientes`

## Premissas e Regras (herdadas)

- Rota define: `method`, `uri`, `auth`, `execution`, `handler_class`, `handler_function`.
- `execution.mode: "mock"` por padrao (a menos que especificado).
- `handler_class` aponta para `PROJETOS/connect/handlers/mock/<handler_class>.mjs` (sem `.mjs` no valor).
- `handler_function` deve existir em `export const handlers = { ... }`.
- Dados em JSON ficam em `PROJETOS/connect/handlers/mock/`.
- Quando ler JSON, separar:
  - Controller: leitura/cache/persistencia
  - Handler: HTTP (metodo/status/body)

## Modelo de Rotas (template)

```js
{
  method: "GET",
  uri: "/Servidor/webservice/integration/<recurso-clientes>",
  auth: {
    mode: "required",
    label: "Token da integradora (quando em modo original).",
  },
  execution: { mode: "mock" },
  handler_class: "api/<arquivo-handler>",
  handler_function: "<funcao-handler>",
}
```

## Modelo de Arquivos

- JSON base (unico, dividido por secoes):
  - `PROJETOS/connect/handlers/mock/clientes.json`
- Controller:
  - `PROJETOS/connect/handlers/mock/api/ClientesController.mjs`
- Handler:
  - `PROJETOS/connect/handlers/mock/api/clientes.mjs`

## Operacoes (modelo)

- GET (lista)
- GET (detalhe)
- POST (criar)
- PUT (atualizar)
- DELETE (remover)

## Contratos de Dados (cliente ecommerce CPF/CNPJ)

### Objetivo do contrato

Dividir dados do cliente em 3 blocos:
- dados do cliente (cadastro)
- enderecos
- privacidade (consentimentos e preferências)

### Estrutura do JSON raiz (unico arquivo)

`PROJETOS/connect/handlers/mock/clientes.json` deve ser um array de itens, onde cada item agrega:
- `cliente` (objeto)
- `enderecos` (array)
- `privacidade` (objeto)

```json
[
  {
    "cliente": {},
    "enderecos": [],
    "privacidade": {}
  }
]
```

### Entidade: Cliente

Campos recomendados (minimo + extensoes):

- `id` (number): identificador unico no mock, auto incremento.
- `tipoPessoa` (string): `PF` | `PJ`.
- `documento` (string): CPF (PF) ou CNPJ (PJ), apenas numeros ou com mascara (definir padrão e manter consistente).
- `nome` (string): nome completo (PF) ou razao social (PJ).
- `nomeFantasia` (string, opcional): apenas PJ.
- `email` (string)
- `whatsapp` (string)
- `senha` (string): no mock fica em texto no JSON (nunca retornar no login).
- `doisFatores` (object): configuracao de validacao em 2 etapas (sem segredo em texto puro).
- `doisFatores.habilitado` (boolean)
- `doisFatores.metodo` (string): `whatsapp` | `email`
- `status` (string): `ativo` | `inativo`
- `createdAt` / `updatedAt` (string ISO, opcional)

Exemplo PF:

```json
{
  "id": 1,
  "tipoPessoa": "PF",
  "documento": "12345678901",
  "nome": "Maria da Silva",
  "email": "maria@exemplo.com",
  "whatsapp": "11999990000",
  "senha": "123456",
  "doisFatores": {
    "habilitado": true,
    "metodo": "whatsapp"
  },
  "status": "ativo"
}
```

Exemplo PJ:

```json
{
  "id": 2,
  "tipoPessoa": "PJ",
  "documento": "12345678000199",
  "nome": "Empresa Exemplo LTDA",
  "nomeFantasia": "Exemplo",
  "email": "contato@empresa.com",
  "whatsapp": "1133334444",
  "senha": "123456",
  "doisFatores": {
    "habilitado": false,
    "metodo": "email"
  },
  "status": "ativo"
}
```

### Entidade: Endereco

Campos recomendados:

- `id` (number): identificador unico do endereco, auto incremento.
- `clienteId` (number, opcional): pode existir para redundancia, mas o vinculo principal e pelo item (cliente 1:N enderecos dentro do mesmo item).
- `rotulo` (string, opcional): ex. `casa`, `trabalho`
- `principal` (boolean, opcional)
- `cep` (string)
- `logradouro` (string)
- `numero` (string)
- `complemento` (string, opcional)
- `bairro` (string)
- `cidade` (string)
- `uf` (string)
- `pais` (string, opcional): default `BR`
- `referencia` (string, opcional)

Exemplo:

```json
{
  "id": 1,
  "clienteId": 1,
  "rotulo": "casa",
  "principal": true,
  "cep": "01311000",
  "logradouro": "Avenida Paulista",
  "numero": "1000",
  "complemento": "10º andar",
  "bairro": "Bela Vista",
  "cidade": "Sao Paulo",
  "uf": "SP",
  "pais": "BR"
}
```

### Entidade: Privacidade

Campos recomendados:

- `clienteId` (number, opcional): pode existir para redundancia, mas o vinculo principal e pelo item (cliente 1:1 privacidade dentro do mesmo item).
- `aceitaMarketing` (boolean)
- `aceitaTermos` (boolean)
- `aceitaCookies` (boolean, opcional)
- `canalPreferido` (string, opcional): `email` | `sms` | `whatsapp` | `nenhum`
- `updatedAt` (string ISO, opcional)

Exemplo:

```json
{
  "clienteId": 1,
  "aceitaMarketing": false,
  "aceitaTermos": true,
  "aceitaCookies": true,
  "canalPreferido": "email"
}
```

### Relacionamentos

- Cliente 1:N Enderecos dentro do mesmo item.
- Cliente 1:1 Privacidade dentro do mesmo item.

## Checklist Pos-Implementacao (obrigatorio)

Seguir o protocolo do `MOCK-END-MODELO-ROTA.md`:
- criar `WWW/MICROSERVICE/MOCK-END/TEST/<nome-implementacao>/`
- reiniciar o MOCK-END
- rodar endpoints e salvar retornos/erros
- gerar `relatorio-final.md`

## Clientes (a preencher com voce)

- Cliente 1:
  - nome: Cliente padrão ecommerce (PF/PJ)
  - rotas (a definir com voce):
    - base clientes: lista/detalhe/criar/atualizar/remover
    - subrecurso enderecos: lista/detalhe/criar/atualizar/remover
    - subrecurso privacidade: obter/atualizar
  - JSON: `PROJETOS/connect/handlers/mock/clientes.json` (array de itens)
  - exemplos de payload: definidos acima
  - casos de teste: seguir o protocolo do MOCK-END-MODELO-ROTA.md

## Cliente de teste (para login)

Objetivo: ter um cliente fixo para testar o endpoint de login usando `email + senha`, sem 2 fatores.

### Registro no `clientes.json`

Inserir um item no array com `cliente`, `enderecos` e `privacidade`:

```json
{
  "cliente": {
    "id": 999,
    "tipoPessoa": "PF",
    "documento": "11122233344",
    "nome": "Cliente Teste",
    "email": "teste@exemplo.com",
    "whatsapp": "11999990000",
    "senha": "123456",
    "doisFatores": {
      "habilitado": false,
      "metodo": "email"
    },
    "status": "ativo"
  },
  "enderecos": [
    {
      "id": 1,
      "clienteId": 999,
      "rotulo": "casa",
      "principal": true,
      "cep": "01311000",
      "logradouro": "Avenida Paulista",
      "numero": "1000",
      "complemento": "10º andar",
      "bairro": "Bela Vista",
      "cidade": "Sao Paulo",
      "uf": "SP",
      "pais": "BR"
    }
  ],
  "privacidade": {
    "clienteId": 999,
    "aceitaMarketing": false,
    "aceitaTermos": true,
    "aceitaCookies": true,
    "canalPreferido": "email"
  }
}
```

### Credenciais de teste

- `email`: `teste@exemplo.com`
- `senha`: `123456`
- `doisFatores.habilitado`: `false`

### Endpoint de login (implementado)

- Metodo: `POST`
- URI: `/Servidor/webservice/integration/clientes/login`
- Body: `{ "email": "teste@exemplo.com", "senha": "123456" }`
- Comportamento esperado (mock):
  - a senha fica em texto no JSON (somente mock) e nunca deve ser retornada no login
  - se `email` nao existir: `401 { "error": "invalid_credentials" }`
  - se `senha` nao bater: `401 { "error": "invalid_credentials" }`
  - se `status` != `ativo`: `403 { "error": "account_inactive" }`
  - se autenticar: `200` com `cliente + enderecos + privacidade + token`

Resposta `200` (exemplo):

```json
{
  "success": true,
  "data": {
    "cliente": {
      "id": 999,
      "tipoPessoa": "PF",
      "documento": "11122233344",
      "nome": "Cliente Teste",
      "email": "teste@exemplo.com",
      "whatsapp": "11999990000",
      "doisFatores": {
        "habilitado": false,
        "metodo": "email"
      },
      "status": "ativo"
    },
    "enderecos": [
      {
        "id": 1,
        "clienteId": 999,
        "rotulo": "casa",
        "principal": true,
        "cep": "01311000",
        "logradouro": "Avenida Paulista",
        "numero": "1000",
        "complemento": "10º andar",
        "bairro": "Bela Vista",
        "cidade": "Sao Paulo",
        "uf": "SP",
        "pais": "BR"
      }
    ],
    "privacidade": {
      "clienteId": 999,
      "aceitaMarketing": false,
      "aceitaTermos": true,
      "aceitaCookies": true,
      "canalPreferido": "email"
    },
    "token": "mock-client-token-999-..."
  }
}
```

### Endpoint de cadastro (implementado)

- Metodo: `POST`
- URI: `/Servidor/webservice/integration/clientes/cadastro`
- Body (minimo):
  - `tipoPessoa`: `PF` | `PJ`
  - `documento`: string
  - `nome`: string
  - `nomeFantasia`: string (obrigatorio se PJ)
  - `email`: string
  - `whatsapp`: string
  - `senha`: string
  - `doisFatores`: `{ habilitado: boolean, metodo: whatsapp|email }`
  - `status`: `ativo` | `inativo` (default `ativo`)
- Body (opcional):
- Body (obrigatorio):
  - `enderecos`: `[]` (min 1; cada item vira registro em `enderecos[]` com `clienteId`)
  - `privacidade`: `{ ... }` (vira registro em `privacidade[]` com `clienteId`)
- Respostas:
  - `201` `{ success: true, data: { cliente, enderecos, privacidade } }` (sem retornar `senha`)
  - `400` `{ error: "invalid_payload" }` / `{ error: "invalid_body" }`
  - `409` `{ error: "email_already_exists" }` / `{ error: "documento_already_exists" }`
