# Categorias de Produtos — Servidor (9004)

Fonte: [servidor-9004.openapi.json](file:///workspace/WWW/MICROSERVICE/LOPES-API/specs/servidor-9004.openapi.json)

## Base URL

- `https://gp.lopesecia.com.br:9004/Servidor`

## Autenticação

- A especificação indica `security: Authorization`, então em geral é necessário enviar:
  - `Authorization: {{authorizationToken}}`
- O token costuma vir do `tokenService` do ApiLopes (9002) e funciona no 9004 sem `Bearer` (quando o upstream aceita token “cru”).

## Modelo (schema) principal

Os endpoints de categoria usam o schema `VinculoCatMercadoLivreBean`:

- `idIntegradora` (int)
- `codigo` (int)
- `codPai` (int)
- `categoria` (string)
- `idMercadoLivre` (string)
- `nomeMercadoLivre` (string)
- `detalhamento` (string)
- `imagem` (string)
- `codProd` (int)
- `sequencia` (int)

## Fluxo rápido (como pensar)

- Listar categorias: `getListCategoria`
- Buscar uma categoria específica: `getCategoria`
- Criar/alterar/excluir categoria: `insertCategoria`, `updateCategoria`, `deleteCategoria`
- Se você precisa do vínculo com marketplace (Mercado Livre): `getListVinculoCatMercadoLivre` e `getVinculoCatMercadoLivre`, além do CRUD de vínculo.

## Endpoints — Categorias

### GET /webservice/integration/getListCategoria

- Descrição: Retorna lista de categorias
- Query:
  - obrigatórios: `idIntegradora` (int)
  - opcionais: `codigo` (int), `codPai` (int), `categoria` (string), `idCatMarketplace` (string), `nomeCatMarketplace` (string)
- Respostas:
  - 200: `application/json` **array** de `VinculoCatMercadoLivreBean`
  - 404, 500

Exemplo:

```bash
curl -X GET \
  'https://gp.lopesecia.com.br:9004/Servidor/webservice/integration/getListCategoria?idIntegradora=8' \
  -H 'Accept: application/json' \
  -H 'Authorization: {{authorizationToken}}'
```

### GET /webservice/integration/getCategoria

- Descrição: Retorna uma categoria
- Query obrigatória:
  - `idIntegradora` (int)
  - `codigo` (int)
- Respostas:
  - 200: `VinculoCatMercadoLivreBean`
  - 404, 500

Exemplo:

```bash
curl -X GET \
  'https://gp.lopesecia.com.br:9004/Servidor/webservice/integration/getCategoria?idIntegradora=8&codigo=123' \
  -H 'Accept: application/json' \
  -H 'Authorization: {{authorizationToken}}'
```

### POST /webservice/integration/insertCategoria

- Descrição: Adiciona uma categoria de produto
- Body: `application/json` (`VinculoCatMercadoLivreBean`)
- Respostas:
  - 200: `VinculoCatMercadoLivreBean`
  - 404, 500

Exemplo:

```bash
curl -X POST \
  'https://gp.lopesecia.com.br:9004/Servidor/webservice/integration/insertCategoria' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Authorization: {{authorizationToken}}' \
  --data '{"idIntegradora":8,"codigo":123,"categoria":"Bebidas"}'
```

### PUT /webservice/integration/updateCategoria

- Descrição: Altera uma categoria de produto
- Body: `application/json` (`VinculoCatMercadoLivreBean`)
- Respostas:
  - 200: `VinculoCatMercadoLivreBean`
  - 404, 500

### DELETE /webservice/integration/deleteCategoria

- Descrição: Exclui uma categoria de produto
- Body: `application/json` (`VinculoCatMercadoLivreBean`)
- Respostas:
  - 200: `VinculoCatMercadoLivreBean`
  - 404, 500

Nota: esse DELETE exige body (padrão incomum em REST). Se der erro, a primeira suspeita é “body inválido/ausente”.

## Endpoints — Vínculo de Categoria (Mercado Livre)

### GET /webservice/integration/getListVinculoCatMercadoLivre

- Descrição: Retorna uma lista de categoria vinculadas ao mercado livre
- Query:
  - obrigatórios: `idIntegradora` (int)
  - opcionais: `codigo` (int), `codPai` (int), `categoria` (string), `idCatMercadoLivre` (string), `nomeCatMercadoLivre` (string)
- Respostas:
  - 200: `VinculoCatMercadoLivreBean`
  - 404, 500

### GET /webservice/integration/getVinculoCatMercadoLivre

- Descrição: Retorna uma lista de categoria vinculadas ao mercado livre
- Query obrigatória:
  - `idIntegradora` (int)
  - `codigo` (int)
- Respostas:
  - 200: `VinculoCatMercadoLivreBean`
  - 404, 500

### POST /webservice/integration/insertVinculoCatMercadoLivre

- Body: `application/json` (`VinculoCatMercadoLivreBean`)
- Respostas: 200/404/500

### PUT /webservice/integration/updateVinculoCatMercadoLivre

- Body: `application/json` (`VinculoCatMercadoLivreBean`)
- Respostas: 200/404/500

### DELETE /webservice/integration/deleteVinculoCatMercadoLivre

- Body: `application/json` (`VinculoCatMercadoLivreBean`)
- Respostas: 200/404/500

