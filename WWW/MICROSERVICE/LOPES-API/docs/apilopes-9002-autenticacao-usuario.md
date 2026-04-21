# Autenticação de Usuário — ApiLopes (9002)

Fonte: [apilopes-9002.openapi.sanitized.json](file:///workspace/WWW/MICROSERVICE/LOPES-API/specs/apilopes-9002.openapi.sanitized.json)

## Base URL

- `https://gp.lopesecia.com.br:9002/ApiLopes`

## Visão geral (camadas)

Na prática aparecem duas camadas diferentes:

1) **Token de serviço (hashToken)**  
   - Emitido pelo `tokenService`.  
   - Usado no header `Authorization` para “autorizar chamadas” de integrações/serviços (inclui endpoints que depois permitem operar no 9004).

2) **Chave de acesso do usuário (token / OTP)**  
   - Gerada/entregue via `enviarToken` (email/whatsapp).  
   - Validada via `verificarToken` / `verificarTokenSistema`.  
   - Retorna dados de acesso do sistema (`ItensSistemaBean`), incluindo `urlApi` e `tokenApi`.

## 1) tokenService (gera token de serviço)

### POST /webservice/api/tokenService

- Tag: `Sistema`
- Descrição (spec): Registra um Operador no sistema / emite token
- Body (schema `DadosTokenServicoBean`):
  - `produto` (string)
  - `ean` (string)
  - `idIntegradora` (int)
  - `codCli` (int)
- Resposta 200 (spec): `DadosTokenServicoBean`

Observação prática:
- No uso real, o response inclui o `hashToken` (token de serviço) que é o valor usado em `Authorization`.

Exemplo:

```bash
curl -X POST \
  'https://gp.lopesecia.com.br:9002/ApiLopes/webservice/api/tokenService' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  --data '{
    "produto": "CONNECT",
    "ean": "7890000002998",
    "idIntegradora": 8,
    "codCli": 1219
  }'
```

## 2) postAutenticaAplicativo (cadastra terminal/app offline)

### POST /webservice/api/postAutenticaAplicativo

- Tag: `Sistema`
- Descrição (spec): Cadastra um aplicativo de terminal offline
- Auth: requer `Authorization` (token de serviço)
- Body (schema `DadosAplicativoBean`):
  - `chaveAtivacao` (string)
  - `responsavel` (string)
  - `cnpj` (string)
  - `email` (string)
  - `whatsapp` (string)
- Respostas: 200/404/500

#### chaveAtivacao (padrão observado)

Pelo exemplo que usamos, a `chaveAtivacao` é um Base64 do padrão:

- `base64("{IDINTEGRADORA};{PRODUTO};{CODCLI}")`

Exemplo:
- string: `8;CONNECT;1219`
- base64: `ODtDT05ORUNUOzEyMTk=`

#### Exemplo (curl)

```bash
curl -X POST \
  'https://gp.lopesecia.com.br:9002/ApiLopes/webservice/api/postAutenticaAplicativo' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Authorization: {{hashToken}}' \
  --data '{
    "chaveAtivacao": "ODtDT05ORUNUOzEyMTk=",
    "responsavel": "Operador Mock",
    "cnpj": "00.000.000/0000-00",
    "email": "operador@mock.local",
    "whatsapp": "5511999999999"
  }'
```

#### Retorno real (exemplo que observei)

O response real veio com campos adicionais (além do schema básico), incluindo um objeto `key` com `urlApi` e `codCli`:

```json
{
  "cnpj": "00.000.000/0000-00",
  "idUsuario": 1232,
  "idIntegradora": 8,
  "key": {
    "produto": "INTEGRADORA LOPES",
    "codigo": "7890000005418",
    "codUnico": "CONNECT",
    "codCli": 1219,
    "urlApi": "https://gp.lopesecia.com.br:9004",
    "status": true
  }
}
```

## 3) enviarToken (envia chave de acesso ao usuário)

### POST /webservice/api/enviarToken

- Tag: `Sistema`
- Descrição (spec): Envia uma chave de acesso ao usuário
- Query (opcionais):
  - `email` (string)
  - `whatsapp` (string)
- Resposta 200 (spec): `string`

Observação importante:
- Esse endpoint pode disparar envio real (email/whatsapp). Evite rodar em produção sem alinhamento.

Comportamento observado (execução real):

- Status 200
- Body: `true` (boolean em JSON), indicando que o envio foi disparado com sucesso

Exemplo:

```bash
curl -X POST \
  'https://gp.lopesecia.com.br:9002/ApiLopes/webservice/api/enviarToken?email=operador%40mock.local' \
  -H 'Accept: application/json' \
  -H 'Authorization: {{hashToken}}'
```

## 4) verificarToken e verificarTokenSistema (valida chave de acesso)

Esses endpoints validam o token recebido pelo usuário (OTP/chave) e retornam dados de acesso do sistema.

### POST /webservice/api/verificarToken

- Descrição (spec): Valida uma chave de acesso ao usuário
- Query:
  - `token` (obrigatório, string)
- Resposta 200: `array<ItensSistemaBean>`

### POST /webservice/api/verificarTokenSistema

- Descrição (spec): Valida o acesso de um usuário
- Query:
  - `token` (obrigatório, string)
  - `idIntegradora` (opcional, int)
- Resposta 200: `array<ItensSistemaBean>`

### Schema: ItensSistemaBean (campos relevantes)

- `idIntegradora` (int)
- `codCli` (int)
- `urlApi` (string)
- `tokenApi` (string)
- `codUnico` (string)
- `produto` (string)
- `codigo` (string)
- `unidade` (string)
- `status` (int)
- `qtUsuario` (int)
- `idFilial` (int)

Interpretação prática:
- `urlApi` tende a apontar para o host de integração (ex.: `https://gp.lopesecia.com.br:9004`).
- `tokenApi` tende a ser o token que o cliente/app usa para chamar a API do `urlApi`.

Exemplo:

```bash
curl -X POST \
  'https://gp.lopesecia.com.br:9002/ApiLopes/webservice/api/verificarTokenSistema?token={{tokenRecebido}}&idIntegradora=8' \
  -H 'Accept: application/json' \
  -H 'Authorization: {{hashToken}}'
```

### Comportamento observado (execução real)

Na execução real com um token recebido por e-mail (OTP), o comportamento foi diferente do que a spec sugere:

1) `POST /webservice/api/verificarTokenSistema?token=...&idIntegradora=8`
- Status: 200
- Retorno: **objeto** (não array) com dados da validação e vínculo com cliente

Exemplo de retorno (valores sensíveis redigidos):

```json
{
  "idUsuario": 1231,
  "tentativas": 0,
  "maxTentativas": 5,
  "hashToken": "<redacted>",
  "canal": "eduardo.rezende@lopesecia.com.br",
  "cnpjCliente": "25231575000146",
  "dtCriacao": "2026-04-21T10:03:12.052-03:00",
  "dtExpira": "2026-04-21T10:33:12.052-03:00",
  "usado": false
}
```

Leitura prática:
- Esse retorno confirma **qual cliente** está associado ao OTP (`cnpjCliente`) e a janela de expiração (`dtExpira`).
- O campo `hashToken` retornado aqui não deve ser assumido como “token de serviço” (ele pode representar outro tipo de credencial/identificador, dependendo da implementação).

2) `POST /webservice/api/verificarToken?token=...`
- Status: 400
- Body: `"Ususem acesso!"`

Ou seja: no ambiente testado, `verificarTokenSistema` foi o endpoint efetivo para validar o OTP; `verificarToken` não concedeu acesso (possível regra de permissão/fluxo diferente).

## Como isso se conecta com “o pedido”

Para inserir pedido no 9004 (ex.: `insertDadoIntegration`), você precisa de um `Authorization` válido.

Os caminhos mais comuns são:

- **Integração serviço-a-serviço**: usar o `hashToken` do `tokenService` diretamente nas requisições ao 9004.
- **Integração usuário/app**: validar o token do usuário (`verificarTokenSistema`) e obter `urlApi` + `tokenApi`, usando `tokenApi` para chamar o 9004.

Se você me disser qual token você usa hoje no 9004 (hashToken vs tokenApi), dá para fechar qual é o fluxo “correto” do seu caso.
