objetivo

eu criei um mock-end para simular o back-end real do sistema. agora preciso de uma ferramenta para criar um contrato entre o BACK e o MOCK:

- encontrar no BACK os endpoints paralelos ao que o MOCK atende (mock vs proxy)
- listar os gaps entre BACK e MOCK
- iniciar com uma arquitetura MVP e aprofundar a analise aos poucos

referencias (pastas/arquivos)

- MOCK (catalogo de rotas do connect):
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs`
- MOCK (logica de proxy que decide mock vs upstream):
  - `WWW/MICROSERVICE/MOCK-END/routes/proxy.mjs`
- token (legado):
  - `WWW/MICROSERVICE/LEAR_LOPES/LEGADO/gerar-token-acesso.mjs`
  - `WWW/MICROSERVICE/LEAR_LOPES/LEGADO/token-acesso.json`

como rodar (mvp)

Essa abrodagem não gerou nenhum dado relevante, vamos fazer o seguinte :

uma analise profunda do MOCK-end, , todos endpoints, com todas as rotas., com request e response e playloads , sumarios e etc

fluxo (analise profunda do mock-end)

1) capturar exemplos (request/result) do /connect (modo seguro: GET-only)

```bash
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\LEGADO\mockend-capture.mjs
```

- saida: `WWW/MICROSERVICE/LEAR_LOPES/DOCS/mock-end-deep/CAPTURE_SUMMARY.json`
- exemplos: `WWW/MICROSERVICE/LEAR_LOPES/data/<stepId>/request.json` e `result.json`

para incluir endpoints de escrita (POST/PUT/DELETE), use:

```bash
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\LEGADO\mockend-capture.mjs --write
```

2) gerar documentacao consolidada (catalogo + hints de payload)

```bash
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\LEGADO\mockend-docgen.mjs
```

- docs: `WWW/MICROSERVICE/LEAR_LOPES/DOCS/mock-end-deep/README.md`
- tabela: `WWW/MICROSERVICE/LEAR_LOPES/DOCS/mock-end-deep/ENDPOINTS.md`
- json ia friendly: `WWW/MICROSERVICE/LEAR_LOPES/DOCS/mock-end-deep/endpoints.json`
- exemplos ok: `WWW/MICROSERVICE/LEAR_LOPES/DOCS/mock-end-deep/EXAMPLES.md`

http_server (back + mock)

objetivo: subir 2 servidores (back e mock) com o mesmo fluxo de token e executar requests salvando `request.json/result.json` por ambiente.

arquivos:

- servidor: `WWW/MICROSERVICE/LEAR_LOPES/HTTP_SERVER/lib/http-server.mjs`
- token: `WWW/MICROSERVICE/LEAR_LOPES/HTTP_SERVER/lib/token-manager.mjs`
- start: `WWW/MICROSERVICE/LEAR_LOPES/HTTP_SERVER/start-dual.mjs`
- cli token: `WWW/MICROSERVICE/LEAR_LOPES/HTTP_SERVER/cli-token.mjs`
- cli request: `WWW/MICROSERVICE/LEAR_LOPES/HTTP_SERVER/cli-request.mjs`

1) gerar token (por ambiente)

```bash
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\HTTP_SERVER\cli-token.mjs --env=BACK --generate
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\HTTP_SERVER\cli-token.mjs --env=MOCK --generate
```

2) subir os 2 servidores

```bash
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\HTTP_SERVER\start-dual.mjs
```

- back: `http://localhost:3100/health`
- mock: `http://localhost:3101/health`

3) executar 1 request (cli) salvando request/result

```bash
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\HTTP_SERVER\cli-request.mjs --env=MOCK --base=integration --method=GET --path=/Servidor/webservice/integration/produtos/categorias
```

saida:

- BACK: `WWW/MICROSERVICE/LEAR_LOPES/BACK/token-acesso.json` e `WWW/MICROSERVICE/LEAR_LOPES/BACK/data/*`
- MOCK: `WWW/MICROSERVICE/LEAR_LOPES/MOCK/token-acesso.json` e `WWW/MICROSERVICE/LEAR_LOPES/MOCK/data/*`







/webservice/integration/getListCategoria
/webservice/integration/getCategoria

/webservice/integration/getProdutoLoja
/webservice/integration/getListProdutoLoja
/webservice/integration/getListProdutoLoja



node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\HTTP_SERVER\cli-request.mjs --env=BACK --base=integration --method=GET --path=/Servidor/webservice/integration/getListProdutoLoja --query="idIntegradora=8"




no back
esse end retorna a lista de categorias
/webservice/integration/getListCategoria
e esse end retorna a categoria
/webservice/integration/getCategoria

mostra pra mim em um json salvo em `WWW/MICROSERVICE/LEAR_LOPES/BACK/data/CATEGORIA/list.json` com o result da lista
e use os dados dessa lista para salvar pelo menus 2 amostras do result de categoria individual em `WWW/MICROSERVICE/LEAR_LOPES/BACK/data/CATEGORIA/<id>.json`


pesquise no swagger https://gp.lopesecia.com.br:9004/Servidor/swagger-ui/index.html#/ , use as skill instaladas para fazer isso
os endpoints de produto, relacionados a categoria , eu ja encontrei 2 deles, 
/webservice/integration/getListCategoria
/webservice/integration/getCategoria
quero o restante
salve uma doc com os endpoints de categoria (incluindo os que eu encontrei), em `WWW/MICROSERVICE/LEAR_LOPES/BACK/endpoints/CATEGORIA.md`