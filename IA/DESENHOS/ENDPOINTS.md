# Endpoints do Projeto

Este documento lista os endpoints usados/expostos no projeto, com base nos clientes HTTP em `lib/api` e nas rotas do Next.js em `app/api`.

## Base URL

- Base: `/api`
- Cliente: `apiClient(endpoint)` concatena `'/api' + endpoint` ([client.ts](file:///c:/LOPES/www/connect-ecommerce/lib/api/client.ts#L1-L55))

## Variáveis de ambiente (.env)

Leitura e normalização em [config.ts](file:///c:/LOPES/www/connect-ecommerce/lib/integration/config.ts#L1-L74).

| Chave | Exemplo | Uso |
|---|---|---|
| `AUTH_BASE_URL` | `https://gp.lopesecia.com.br:9002/ApiLopes/webservice/api` | Base para webservices de autenticação e para `tokenService` |
| `INTEGRATION_URL_API` | `https://gp.lopesecia.com.br:9004` | Base para webservices de integração (`/Servidor/webservice/...`) |
| `PRODUTO` | `"CONNECT"` | Campo `produto` ao gerar token no `tokenService` |
| `EAN` | `7890000002998` | Campo `ean` ao gerar token no `tokenService` |
| `IDINTEGRADORA` | `8` | Lido como `idIntegradora` (também aceita `ID_INTEGRADORA`) |
| `CODCLI` | `1219` | Lido como `codCli` (também aceita `COD_CLI`) |
| `KEY` | `ODtDT05ORUNUOzEyMTk=` | `chaveAtivacao` no cadastro (`postAutenteicaAplicativo`) |

Observações:
- URLs são normalizadas para remover `/` no final.
- Strings com aspas (ex.: `"CONNECT"`) são desaspadas.

### Arquivo de referência usado na conexão (MDK-DEV)

Arquivo: [.env](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/.env)

Conteúdo (exemplo atual):
- `AUTH_BASE_URL=https://gp.lopesecia.com.br:9002/ApiLopes/webservice/api`
- `INTEGRATION_URL_API=https://gp.lopesecia.com.br:9004`
- `PRODUTO="CONNECT"`
- `EAN=7890000002998`
- `IDINTEGRADORA=8`
- `CODCLI=1219`
- `KEY=ODtDT05ORUNUOzEyMTk=`
- `PORT=3000`

## Auth

| Método | Path | Body | Retorno | Implementação |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ responsavel, cnpj, email, whatsapp }` | `{ success, data }` | [route.ts](file:///c:/LOPES/www/connect-ecommerce/app/api/auth/register/route.ts#L8-L94) |
| POST | `/api/auth/send-token` | `{ email?, whatsapp? }` (um dos dois) | `{ success, data }` | [route.ts](file:///c:/LOPES/www/connect-ecommerce/app/api/auth/send-token/route.ts#L8-L89) |
| POST | `/api/auth/verify-token` | `{ token }` | `{ success, data: { verification, operador } }` | [route.ts](file:///c:/LOPES/www/connect-ecommerce/app/api/auth/verify-token/route.ts#L9-L141) |
| POST | `/api/auth/logout` | — | `{ success }` | [route.ts](file:///c:/LOPES/www/connect-ecommerce/app/api/auth/logout/route.ts#L1-L25) |
| GET | `/api/auth/me` | — | `{ success, data: session }` ou `401` | [route.ts](file:///c:/LOPES/www/connect-ecommerce/app/api/auth/me/route.ts#L1-L38) |

Clientes (consumo no front):
- [registerUser](file:///c:/LOPES/www/connect-ecommerce/lib/api/auth.ts#L12-L19)
- [sendLoginToken](file:///c:/LOPES/www/connect-ecommerce/lib/api/auth.ts#L21-L28)
- [verifyLoginToken](file:///c:/LOPES/www/connect-ecommerce/lib/api/auth.ts#L30-L40)
- [logout](file:///c:/LOPES/www/connect-ecommerce/lib/api/auth.ts#L42-L46)
- [getCurrentSession](file:///c:/LOPES/www/connect-ecommerce/lib/api/auth.ts#L48-L52)

### Sessão (cookie)

- Cookie: `session`
- Formato: JSON em claro (httpOnly) com shape `Session`:
  - `{ userId: string; email: string; token: string; name?: string }` ([session.ts](file:///c:/LOPES/www/connect-ecommerce/lib/auth/session.ts#L1-L42))
- Escrita: no `POST /api/auth/verify-token`, após validar token e obter operador ([verify-token route](file:///c:/LOPES/www/connect-ecommerce/app/api/auth/verify-token/route.ts#L114-L119))
- Proteção: middleware redireciona `/dashboard/*` para `/login` se não houver cookie `session` ([middleware.ts](file:///c:/LOPES/www/connect-ecommerce/middleware.ts#L1-L18))

### Endpoints externos de autenticação (AUTH_BASE_URL)

Chamados pelo backend (`app/api/auth/*`) com `Authorization: <token-cru>` obtido via `tokenService`.

| Método | URL (relativa a AUTH_BASE_URL) | Query/Body | Header | Observações |
|---|---|---|---|---|
| POST | `/tokenService` | Body: `{ produto, ean, idIntegradora, codCli }` | `Content-Type: application/json` | Geração do token do integrador ([authService.ts](file:///c:/LOPES/www/connect-ecommerce/lib/integration/authService.ts#L79-L107)) |
| POST | `/tokenService` | Body: `{ refreshToken }` | `Content-Type: application/json` | Refresh do token ([authService.ts](file:///c:/LOPES/www/connect-ecommerce/lib/integration/authService.ts#L109-L140)) |
| POST | `/postAutenteicaAplicativo` | Body: `{ chaveAtivacao, responsavel, cnpj, email, whatsapp }` | `Content-Type: application/json`, `Authorization` | Cadastro ([register route](file:///c:/LOPES/www/connect-ecommerce/app/api/auth/register/route.ts#L37-L60)) |
| POST | `/enviarToken` | Query: `email=...` ou `whatsapp=...` | `Authorization` | Envia token de login ([send-token route](file:///c:/LOPES/www/connect-ecommerce/app/api/auth/send-token/route.ts#L33-L55)) |
| POST | `/verificarTokenSistema` | Query: `token=...` | `Authorization` | Valida token de login ([verify-token route](file:///c:/LOPES/www/connect-ecommerce/app/api/auth/verify-token/route.ts#L56-L68)) |
| GET | `/getOperadorSistemaForId` | Query: `id=...` | `Authorization` | Carrega operador autenticado ([verify-token route](file:///c:/LOPES/www/connect-ecommerce/app/api/auth/verify-token/route.ts#L85-L97)) |

Formato do header:
- `Authorization` recebe o token “cru” (se vier com prefixo `Bearer `, ele é removido) ([token.ts](file:///c:/LOPES/www/connect-ecommerce/lib/integration/token.ts#L1-L11))

Response esperada de `/tokenService` (mínimo validado pelo app):
- `{ hashToken: string; dtExpira: string; refreshToken?: string; ... }` ([integration.ts](file:///c:/LOPES/www/connect-ecommerce/lib/types/integration.ts#L1-L6))

## Produtos

| Método | Path | Query | Retorno | Implementação |
|---|---|---|---|---|
| GET | `/api/products` | `idIntegradora?: number` | `{ success, data, total }` | [route.ts](file:///c:/LOPES/www/connect-ecommerce/app/api/products/route.ts#L1-L48) |
| GET | `/api/products/:codProd` | `idIntegradora?: number` | `{ success, data }` | [route.ts](file:///c:/LOPES/www/connect-ecommerce/app/api/products/%5BcodProd%5D/route.ts#L1-L65) |

Clientes (consumo no front):
- [getProducts](file:///c:/LOPES/www/connect-ecommerce/lib/api/products.ts#L15-L28)
- [getProductById](file:///c:/LOPES/www/connect-ecommerce/lib/api/products.ts#L30-L47)

### Endpoints externos de integração (INTEGRATION_URL_API)

Chamados server-to-server via `businessGet`, sempre com `Authorization: <token-cru>` obtido pelo `tokenService`.

| Método | URL (relativa a INTEGRATION_URL_API) | Query | Header | Onde é usado |
|---|---|---|---|---|
| GET | `/Servidor/webservice/integration/getIntegradora` | `id=<idIntegradora>` | `Authorization` | Boot da integração (carrega config) ([authService.ts](file:///c:/LOPES/www/connect-ecommerce/lib/integration/authService.ts#L142-L165)) |
| GET | `/Servidor/webservice/integration/getListProdutoLoja` | `idIntegradora=<id>` | `Authorization` | Lista produtos ([productsService.ts](file:///c:/LOPES/www/connect-ecommerce/lib/integration/productsService.ts#L66-L74)) |
| GET | `/Servidor/webservice/integration/getProdutoLoja` | `idIntegradora=<id>&codProd=<codProd>` | `Authorization` | Detalhe de produto ([productsService.ts](file:///c:/LOPES/www/connect-ecommerce/lib/integration/productsService.ts#L76-L88)) |

Payloads esperados (tolerantes):
- Lista pode vir como array direto ou dentro de `data|produtos|products|lista|itens` ([productsService.ts](file:///c:/LOPES/www/connect-ecommerce/lib/integration/productsService.ts#L22-L42))
- Item pode vir como objeto direto ou dentro de `data|produto|product|item` ([productsService.ts](file:///c:/LOPES/www/connect-ecommerce/lib/integration/productsService.ts#L44-L64))

Shape do `Product` (campos principais):
- Tipagem em [product.ts](file:///c:/LOPES/www/connect-ecommerce/lib/types/product.ts#L13-L54) (ex.: `codProd`, `idIntegradora`, `descricaoEcomerce`, `preco`, `qtEstoque`, `imagem`, `imagens`, `categoria`, `departamento`, etc.)

## Guia para mock do back-end (contrato)

Para mockar o back-end sem depender dos serviços externos, implemente endpoints que reproduzam:
- Os endpoints internos do app (tabelas acima), mantendo `success`, `message` e códigos HTTP iguais.
- Os endpoints externos (AUTH_BASE_URL e INTEGRATION_URL_API) com os mesmos paths/queries/bodies e exigência de `Authorization`.

Pontos críticos de autenticação/token:
- Existem dois “tokens” no projeto:
  - Token do integrador (usado server-to-server em `Authorization` para `INTEGRATION_URL_API` e `AUTH_BASE_URL`).
  - Token da sessão do usuário (campo `token` dentro do cookie `session`, setado no `verify-token`).
- `Authorization` do integrador é enviado sem prefixo `Bearer`.

## Análise para implementar no MOCK-END (não implementado)

Objetivo: permitir que o microservice [MOCK-END](file:///c:/LOPES/www/MDK-DEV/www/microservice/mock-end/server.mjs) simule **tanto** os endpoints internos do app (`/api/auth/*`, `/api/products*`) **quanto** os endpoints externos (`AUTH_BASE_URL` e `INTEGRATION_URL_API`), mantendo o contrato descrito acima.

### Estado atual do MOCK-END

O MOCK-END hoje é um servidor Node HTTP simples, orientado a “tenant”, com rotas principais:
- `GET /health`
- `GET /api/tenant/:tenant/catalogo/categorias` e `GET /api/tenant/:tenant/catalogo/categorias/:slug`
- `GET /api/tenant/:tenant/catalogo/produtos` e `GET /api/tenant/:tenant/catalogo/produtos/:slug`
- `GET|PUT|DELETE /api/tenant/:tenant/json?path=...` e `GET /api/tenant/:tenant/json/list?dir=...`
- `PUT|DELETE /api/tenant/:tenant/assets?path=...` (restrito a `THEMA/assets/images/*`)

Implicações para o contrato deste documento:
- **Isolamento de paths**: as rotas de tenant usam o prefixo `/api/tenant/:tenant/*`, evitando conflito com `/api/auth/*` e `/api/products*`.
- **CORS/métodos**: o CORS atual só anuncia `GET, PUT, DELETE, OPTIONS`. Para suportar este contrato, precisa incluir `POST` no `Access-Control-Allow-Methods`.

### Estratégia recomendada de roteamento (para não quebrar o front)

Recomendação: implementar os endpoints do Connect com **paths exatos**, sem “tenant”, antes do roteamento atual baseado em `/:tenant/...`:
- Internos do app: manter exatamente `/api/auth/*` e `/api/products*`
- Externos (bases): servir diretamente `/tokenService`, `/postAutenteicaAplicativo`, `/enviarToken`, `/verificarTokenSistema`, `/getOperadorSistemaForId`, `/Servidor/webservice/integration/*`

Por quê: os clientes do app já assumem `Base: /api` e que `AUTH_BASE_URL`/`INTEGRATION_URL_API` são bases “raiz”; se colocar “tenant” no path, exigiria alterar clientes/rotas/config.

### Regras de autenticação no mock (mínimo útil)

Para ficar compatível com o app, o mock deve respeitar:
- **`Authorization` obrigatório** nos endpoints externos (AUTH_BASE_URL e INTEGRATION_URL_API). Se ausente/vazio: `401`.
- **Token “cru”**: aceitar `Authorization: <token>` e também `Authorization: Bearer <token>` (remover `Bearer ` antes de validar/usar), para reproduzir o comportamento descrito.
- **Sessão do usuário**: ao “logar” (`/api/auth/verify-token`), setar cookie `session` (httpOnly) com `{ userId, email, token, name? }`. `/api/auth/me` retorna `401` se não houver cookie.

Persistência sugerida (opcional, mas prática): reaproveitar a pasta `COMMERCE/` por tenant (já existe seed de `users.json`, `sessions.json`, `orders.json`) para guardar:
- cadastro (register) e operador (me)
- tokens emitidos e sessões “ativas”

### Mapeamento de dados (produtos)

O mock atual tem `CATALOGO/produtos.json` por tenant (com `slug` e dados de e-commerce). Para suportar `/api/products` e `/api/products/:codProd`:
- gerar um `codProd` estável por item (ex.: índice + offset, ou hash do `slug`)
- preencher `idIntegradora` a partir de query (`idIntegradora`) ou valor default fixo
- mapear campos principais para o shape do `Product` esperado (ex.: `descricaoEcomerce`, `preco`, `qtEstoque`, `imagem/imagens`, `categoria/departamento`)

### Checklist de contrato para o MOCK-END

- Internos:
  - `POST /api/auth/register`: valida body `{ responsavel, cnpj, email, whatsapp }` e retorna `{ success, data }` com o mesmo padrão de erro/HTTP do app.
  - `POST /api/auth/send-token`: exige `email` ou `whatsapp` e retorna `{ success, data }`.
  - `POST /api/auth/verify-token`: valida `{ token }`, retorna `{ success, data: { verification, operador } }` e grava cookie `session`.
  - `POST /api/auth/logout`: limpa cookie `session` e retorna `{ success }`.
  - `GET /api/auth/me`: retorna `{ success, data: session }` ou `401`.
  - `GET /api/products` e `GET /api/products/:codProd`: retornar `{ success, data, total? }` conforme tabela.

- Externos (AUTH_BASE_URL):
  - `POST /tokenService`: suportar body de geração (`{ produto, ean, idIntegradora, codCli }`) e refresh (`{ refreshToken }`), retornando no mínimo `{ hashToken, dtExpira, refreshToken? }`.
  - `POST /postAutenteicaAplicativo`: exige `Authorization` e body `{ chaveAtivacao, responsavel, cnpj, email, whatsapp }`.
  - `POST /enviarToken`: exige `Authorization` e query `email` ou `whatsapp`.
  - `POST /verificarTokenSistema`: exige `Authorization` e query `token`.
  - `GET /getOperadorSistemaForId`: exige `Authorization` e query `id`.

- Externos (INTEGRATION_URL_API):
  - `GET /Servidor/webservice/integration/getIntegradora?id=...`: exige `Authorization`, retorna config mínima usada no boot.
  - `GET /Servidor/webservice/integration/getListProdutoLoja?idIntegradora=...`: exige `Authorization`, retorna lista tolerante (array ou encapsulado em `data|produtos|products|lista|itens`).
  - `GET /Servidor/webservice/integration/getProdutoLoja?idIntegradora=...&codProd=...`: exige `Authorization`, retorna item tolerante (objeto ou encapsulado em `data|produto|product|item`).

### Tarefa: Collection do Postman para testar o MOCK-END

Criar um JSON de collection compatível com Postman (v2.1) contendo:
- Variáveis (collection/environment): `baseUrl` (ex.: `http://localhost:4000`), `AUTH_BASE_URL`, `INTEGRATION_URL_API`, `authorizationToken`, `tenant` e os valores do `.env` (`PRODUTO`, `EAN`, `IDINTEGRADORA`, `CODCLI`, `KEY`)
- Requests para todos os endpoints deste documento (internos e externos), incluindo exemplos de body/query:
  - `/api/auth/*`
  - `/api/products*`
  - `/tokenService`, `/postAutenteicaAplicativo`, `/enviarToken`, `/verificarTokenSistema`, `/getOperadorSistemaForId`
  - `/Servidor/webservice/integration/getIntegradora`, `/getListProdutoLoja`, `/getProdutoLoja`
- Headers prontos (quando aplicável): `Content-Type: application/json` e `Authorization: {{authorizationToken}}`





deixando mais claro o objetivo
esse dir é um ecommerce que estou refatorando [text](../../WWW/REFERENCIAS/connect-ecommerce-develop), vou chamar ele de connect-site
ele usa um back-end incompleto, porem eu vou usar o mesmo formato, no mockend
essa é a .env do connect-site
AUTH_BASE_URL=https://gp.lopesecia.com.br:9002/ApiLopes/webservice/api
INTEGRATION_URL_API=https://gp.lopesecia.com.br:9004
PRODUTO="CONNECT"
EAN=7890000002998
IDINTEGRADORA=8
CODCLI=1219
KEY=ODtDT05ORUNUOzEyMTk=
PORT=3000

Vamos encontrar quais end-point sao usados na home do connect-site, o arquivo é esse: [text](../../WWW/REFERENCIAS/connect-ecommerce-develop/app/(shop)/page.tsx)
é certo que o end-point usado aqui prescisa token. Inicialmente add nesse arquivo em um paragrafo abaixo esse mapeamento, e continuamos na sequencia

Mapeamento (home do connect-site):
- Chamada direta no browser: `GET /api/products` (query opcional `idIntegradora`). Não envia `Authorization` nem parâmetro `tenant` (ver [page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce-develop/app/(shop)/page.tsx#L19-L36) e [products.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce-develop/lib/api/products.ts#L15-L28)).
- Token necessário é do integrador e acontece no server-to-server (dentro do handler de `/api/products`), que por sua vez chama o fluxo de integração (`/tokenService` e `/Servidor/webservice/integration/getListProdutoLoja`) usando `AUTH_BASE_URL`/`INTEGRATION_URL_API` do `.env` (ver [route.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce-develop/app/api/products/route.ts#L8-L34) e [productsService.ts](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce-develop/lib/integration/productsService.ts#L66-L74)).


quero alterar o .env do connect-site para 
AUTH_BASE_URL=http://localhost:4000
INTEGRATION_URL_API=http://localhost:4000

e quero no momento que o mockend faça a mesma chamada no back usando esse [text](.env), pode incluir esse arquivo no mock end! Eu tenho um motivo para fazer isso... vai fazer sentido mais tarde. Porem eu quero isso o connect-site vai chamar o mock-end, e o mock chama o back original e retorna
eu vou testar rodano o run dev no connect-site
quero ver o mesmo que vejo usando o .env original

