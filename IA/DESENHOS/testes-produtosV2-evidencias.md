# Desenho: Testes Automatizados com Evidências (produtosV2)

## Objetivo

Definir um plano único e sem ambiguidade para validar:

- Endpoints externos V2 no mock-end (`/Servidor/webservice/integration/produtos/...`)
- Endpoints internos V2 no front (`/api/produtosV2/...`)
- Fluxo real em navegador (store -> BFF -> integração), com evidências em disco

Este desenho não mistura fluxo V1 no plano de execução.

---

## Regras operacionais obrigatórias

- Ordem de start:
  1. subir `mock-end`
  2. subir `front` (`connect-ecommerce`)
- Ordem de stop:
  1. parar `front`
  2. parar `mock-end`
- Toda fase salva evidências mesmo em falha parcial.
- Se qualquer check falhar, execução final fica `failed`.
- Qualquer coisa que não funcionar vira item em uma lista de correções (TODO) e não bloqueia a geração de evidências.

---

## Escopo fechado (sem conflito)

### Mock-end (externo V2)

Base:

- `http://localhost:4000/connect`

Endpoints sob teste:

- `GET /Servidor/webservice/integration/produtos/categorias`
- `GET /Servidor/webservice/integration/produtos/categorias/:idCategoria`
- `GET /Servidor/webservice/integration/produtos/by-categoria/:idCategoria?includeDescendants=1&page=1&pageSize=24`
- `GET /Servidor/webservice/integration/produtos/by-id/:idProduto`
- `GET /Servidor/webservice/integration/produtos/by-slug/:slug`

### Front (BFF interno V2)

Base:

- `http://localhost:3000`

Endpoints sob teste:

- `GET /api/produtosV2/categorias`
- `GET /api/produtosV2/categorias/:idCategoria`
- `GET /api/produtosV2/by-categoria/:idCategoria?includeDescendants=1&page=1&pageSize=24`
- `GET /api/produtosV2/by-id/:idProduto`
- `GET /api/produtosV2/by-slug/:slug`

### Mapa 1:1 (obrigatório)

- Mock `GET /connect/Servidor/webservice/integration/produtos/categorias` <-> Front `GET /api/produtosV2/categorias`
- Mock `GET /connect/Servidor/webservice/integration/produtos/categorias/:idCategoria` <-> Front `GET /api/produtosV2/categorias/:idCategoria`
- Mock `GET /connect/Servidor/webservice/integration/produtos/by-categoria/:idCategoria` <-> Front `GET /api/produtosV2/by-categoria/:idCategoria`
- Mock `GET /connect/Servidor/webservice/integration/produtos/by-id/:idProduto` <-> Front `GET /api/produtosV2/by-id/:idProduto`
- Mock `GET /connect/Servidor/webservice/integration/produtos/by-slug/:slug` <-> Front `GET /api/produtosV2/by-slug/:slug`

---

## Regras de consumo no front (store-first)

- Componente/página não chama endpoint direto.
- Chamada interna ocorre no `produtosV2-store` via `lib/api/produtosV2.ts`.
- A página de teste (ex.: `/dev/test/produtos/ref`) só dispara action do store e renderiza estado reativo.
- Evidência do front considera o objeto reativo do store (`data`, `loading` ou `status`, `error`, paginação).
- Browser não pode chamar `/Servidor/webservice/...` diretamente no client.

---

## Campos sob validação (contrato mínimo)

Campos mínimos esperados nas respostas:

- envelope: `success` e `data`
- paginação (apenas em `by-categoria`): `page`, `pageSize`, `total`, `totalPages`

Campos de imagem que entram na checagem:

- categorias:
  - `data[].image` em `/categorias`
  - `data.category.image` e `data.children[].image` em `/categorias/:idCategoria`
- produtos:
  - `data[].image` em `/by-categoria/:idCategoria`
  - `data.image` em `/by-id/:idProduto` e `/by-slug/:slug`

Se algum desses campos estiver ausente ou inválido: registrar TODO de correção com exemplo do payload.

---

## Fase A: Teste direto no mock-end

Validações mínimas por endpoint:

- HTTP status (`200`, e cenários de erro `400` ou `404`)
- contrato mínimo (`success`, `data`, paginação quando aplicável)
- tempo de resposta (`durationMs`)
- validação de imagens (quando houver `image` em `data`)

#### Regra de validação de imagem (obrigatória)

Quando existir campo `image` no retorno:

- Aceitar:
  - URL absoluta `http://` ou `https://`
  - caminho absoluto iniciando com `/` (ex.: `/assets/...`)
- Rejeitar:
  - vazio/nulo
  - qualquer outro formato não identificável

Se rejeitar: registrar TODO de correção e anexar exemplo no `summary.json` (sem travar execução).

#### Regra extra: URL resolvível (quando for caminho)

Quando `image` vier como caminho iniciando com `/`:

- considerar o valor “sintaticamente válido”
- ainda assim registrar um check posterior “resolvível”:
  - `GET <frontBaseUrl><image>` deve retornar `200`

Se não retornar `200`: registrar TODO com o `image` e o status retornado.

### Postman obrigatório (mock-end)

Arquivos:

- `WWW/MICROSERVICE/MOCK-END/postman/produtosV2-mock.postman_collection.json`
- `WWW/MICROSERVICE/MOCK-END/postman/produtosV2-dev.postman_environment.json`

Conteúdo obrigatório:

- 1 request por endpoint V2
- requests de sucesso e erro esperado (`400` ou `404`)
- scripts `pm.test` para status + campos obrigatórios

Payload dev (completo):

- `Authorization: <token-dev-completo>`
- `Accept: application/json`
- `Content-Type: application/json` quando aplicável
- path/query completos (sem simplificação)

---

## Fase B: Teste do front BFF

Validações mínimas:

- status HTTP dos endpoints internos
- contrato estável para consumo do store
- confirmação de que o fluxo client-side usa store (não fetch direto em componente)
- confirmação de ausência de chamada client-side para `/Servidor/webservice/...`
- validação de imagens (quando houver `image` no payload consumido pelo store)

Se falhar: registrar TODO de correção e manter evidências do request/response.

---

## Fase C: Teste no navegador (Playwright)

Validações:

- abrir rota de teste do front
- capturar screenshot
- capturar requests de rede para `/api/produtosV2/*`
- capturar console (quando usado como evidência de estado reativo)
- opcional: trace `.zip`

---

## Estrutura de evidências

Base:

- `.trae/specs/implementar-produtosv2-api/evidence/`

Arquivos:

- `mock/<endpoint-slug>/request.json`
- `mock/<endpoint-slug>/response.json`
- `mock/<endpoint-slug>/meta.json`
- `front/<endpoint-slug>/request.json`
- `front/<endpoint-slug>/response.json`
- `front/<endpoint-slug>/meta.json`
- `browser/screenshots/*.png`
- `browser/network/*.json`
- `browser/trace/*.zip`
- `postman/mock-report.json`
- `fixtures/front/produtosV2/*.json`
- `summary.json`

`meta.json` mínimo:

- `url`
- `method`
- `status`
- `durationMs`
- `timestamp`

### Formato do summary.json (mínimo)

```json
{
  "runId": "2026-04-15T00:00:00.000Z",
  "status": "passed",
  "checks": {
    "total": 0,
    "passed": 0,
    "failed": 0
  },
  "artifacts": {
    "mock": [],
    "front": [],
    "browser": [],
    "postman": []
  },
  "correcoes": []
}
```

Regras:

- `status` é `failed` se qualquer check falhar
- `correcoes[]` replica a lista TODO (um item por falha) com links para evidências

### Fixtures JSON para front (obrigatório)

- `fixtures/front/produtosV2/categorias.json`
- `fixtures/front/produtosV2/categoria-<id>.json`
- `fixtures/front/produtosV2/by-categoria-<id>-page-<n>.json`
- `fixtures/front/produtosV2/by-id-<id>.json`
- `fixtures/front/produtosV2/by-slug-<slug>.json`

Regras:

- salvar response body completo (sem truncar)
- gerar também fixtures de erro (`400` e `404`)
- referenciar todos os arquivos no `summary.json`

---

## Orquestração (scripts)

- `npm run test:stack:start` -> sobe mock-end e front na ordem correta
- `npm run test:api:mock:evidence` -> executa Fase A
- `npm run test:postman:mock` -> executa coleção Postman e salva relatório
- `npm run test:api:front:evidence` -> executa Fase B
- `npm run test:browser:evidence` -> executa Fase C
- `npm run test:stack:stop` -> para front e depois mock-end
- `npm run test:e2e:evidence` -> start -> A -> postman -> B -> C -> stop

Regra de robustez:

- `test:e2e:evidence` sempre chama `stop` em `finally`

---

## Critérios de pronto

- execução ponta a ponta com um comando
- evidências de mock, front, browser e postman
- fixtures JSON versionáveis para o front
- regra store-first aplicada no fluxo de teste de UI
- `summary.json` com totais, `passed/failed` e caminhos de artefatos
- lista de correções (TODO) preenchida com tudo que não funcionou (inclui imagens inválidas)

---

## Lista de correções (TODO)

Formato recomendado (um item por falha):

- `correcao: <area> | <endpoint> | <problema>`
  - `area`: `mock` | `front` | `browser` | `postman`
  - `endpoint`: path completo (ou página/rota no caso de browser)
  - `problema`: descrição objetiva + campo/valor (quando aplicável)
  - `evidencia`: caminho(s) em `.trae/specs/implementar-produtosv2-api/evidence/...`

Exemplos:

- `correcao: mock | /Servidor/webservice/integration/produtos/categorias | image inválida em categoria id=20 (image="cervejas.webp")`
- `correcao: front | /api/produtosV2/by-id/1001 | campo image ausente em data`
- `correcao: browser | /dev/test/produtos/ref | store não entrou em estado reativo esperado (loading não transicionou)`

---

## Fora de escopo deste desenho

- endpoints V1 (`/api/products*`)
- endpoints legados externos (`getListProdutoLoja`, `getProdutoLoja`)
- cenários híbridos mock+real

Se necessário, esses itens entram em desenho separado de migração/compatibilidade.

---

## Relação com o desenho de API

Este desenho complementa:

- [produtos-api.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/produtos-api.md)
