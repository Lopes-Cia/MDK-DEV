# Guia (IA friendly) — API Lopes & Cia (Servidor / 9004)

## Objetivo

Ter a documentacao da API salva localmente e um jeito rapido de:

- achar endpoints por palavra-chave
- ver detalhes de um endpoint (metodo, tags, params, schemas)
- entender o padrao de autenticacao

## Onde esta o contrato

- Swagger UI (pode falhar ao carregar configuracao): https://gp.lopesecia.com.br:9004/Servidor/swagger-ui/index.html
- OpenAPI JSON (dump offline): `api-docs.json`

O Swagger UI pode mostrar “Failed to load remote configuration”, mas o JSON em `/Servidor/v3/api-docs` costuma estar acessivel e e o que voce precisa para consultar offline.

## Base URL (servidor)

No OpenAPI, o server listado e:

- `https://gp.lopesecia.com.br:9005/Servidor`

No seu ambiente, voce esta consultando a documentacao em:

- `https://gp.lopesecia.com.br:9004/Servidor/...`

Na pratica, o prefixo dos paths do OpenAPI ja vem com `/webservice/...`, entao a URL final tende a ser:

`{BASE}/webservice/integration/...`

## Autenticacao

O OpenAPI define uma security global do tipo `apiKey` no header:

- Header: `Authorization`

Formato padrao:

```http
Authorization: <token>
```

## Como navegar (sem Python, so Node.js)

Use o script `openapi-cli.mjs` nesta pasta.

### 1) Listar tags

```bash
node .\openapi-cli.mjs list-tags
```

### 2) Procurar endpoints por palavra

Exemplos:

```bash
node .\openapi-cli.mjs search produto
node .\openapi-cli.mjs search cliente
node .\openapi-cli.mjs search token
```

### 3) Listar todos os endpoints

```bash
node .\openapi-cli.mjs list-all
```

Se quiser salvar em arquivo:

```bash
node .\openapi-cli.mjs list-all > .\endpoints.txt
```

### 4) Ver detalhes de um endpoint especifico

Exemplo:

```bash
node .\openapi-cli.mjs detail "/webservice/integration/getListProdutoLoja" get
```

O comando imprime um JSON com a operacao completa (inclui tags, description, parametros e schemas).

## Fluxo sugerido (progressivo)

Quando voce estiver integrando/validando:

1. Comece por um endpoint simples (GET) que lista dados (ex.: `getList*`).
2. Garanta que o `Authorization` esta correto (401/403 indica token ausente/invalido).
3. So depois avance para endpoints de escrita (POST/PUT/DELETE).
4. Registre request/response para comparar com o mock/end local.

