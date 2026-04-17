# Produtos GET — Análise (Lopes 9004)

Fonte: apenas artefatos em `DOCS/lopes_9004` (OpenAPI `api-docs.json`, índices locais e `contract/report.md`).

## Base URL e autenticação

- Base (OpenAPI servers[0]): `https://gp.lopesecia.com.br:9005/Servidor`
- Auth: header `Authorization: <token>` (security global no OpenAPI).
- Observação: a pasta é rotulada 9004, mas o OpenAPI aponta 9005; trate como variação de ambiente (host/porta), mantendo o path do endpoint.

## Guia rápido (como acessar produtos)

Padrão dominante no OpenAPI (tag `Produto`):
- Quase todos os endpoints exigem `idIntegradora` (query) como parâmetro obrigatório.
- Para identificar produto, os filtros mais recorrentes são: `codProd`, `ean`, `skuId`, `productId`, `descricaoErp` (todos query).

**Produto (lista)**
- `getListProduto` → `/webservice/integration/getListProduto` (objeto) (descrição diz lista, schema 200 não é array)
- `getListProdutoLoja` → `/webservice/integration/getListProdutoLoja` (objeto) (descrição diz lista, schema 200 não é array)
- `getListProdutoOnfood` → `/webservice/integration/getListProdutoOnfood` (objeto) (descrição diz lista, schema 200 não é array)
- `getListProdutoPresta` → `/webservice/integration/getListProdutoPresta` (objeto) (descrição diz lista, schema 200 não é array)

**Produto (detalhe)**
- `getProduto` → `/webservice/integration/getProduto` (objeto)
- `getProdutoLoja` → `/webservice/integration/getProdutoLoja` (objeto)
- `getProdutoOnfood` → `/webservice/integration/getProdutoOnfood` (objeto)
- `getProdutoPresta` → `/webservice/integration/getProdutoPresta` (objeto)

**Categoria / vínculo**
- `getListCategoria` → `/webservice/integration/getListCategoria` (lista)
- `getCategoria` → `/webservice/integration/getCategoria` (objeto)
- `getListVinculoCatMercadoLivre` → `/webservice/integration/getListVinculoCatMercadoLivre` (objeto) (descrição diz lista, schema 200 não é array)
- `getVinculoCatMercadoLivre` → `/webservice/integration/getVinculoCatMercadoLivre` (objeto) (descrição diz lista, schema 200 não é array)
- `getListVinculoCategoriaProdutoLoja` → `/webservice/integration/getListVinculoCategoriaProdutoLoja` (lista)

**Preço**
- `getListPreco` → `/webservice/integration/getListPreco` (objeto) (descrição diz lista, schema 200 não é array)
- `getPreco` → `/webservice/integration/getPreco` (objeto)
- `getListPrecoPromo` → `/webservice/integration/getListPrecoPromo` (objeto) (descrição diz lista, schema 200 não é array)
- `getListPrecoMagento` → `/webservice/integration/getListPrecoMagento` (objeto) (descrição diz lista, schema 200 não é array)
- `getPrecoMagento` → `/webservice/integration/getPrecoMagento` (objeto)
- `getListPrecoOnfood` → `/webservice/integration/getListPrecoOnfood` (objeto) (descrição diz lista, schema 200 não é array)
- `getPrecoOnfood` → `/webservice/integration/getPrecoOnfood` (objeto)
- `getListPrecoPresta` → `/webservice/integration/getListPrecoPresta` (objeto) (descrição diz lista, schema 200 não é array)
- `getPrecoPresta` → `/webservice/integration/getPrecoPresta` (objeto)
- `getPrecoProdutoPresta` → `/webservice/integration/getPrecoProdutoPresta` (objeto)

**Variante / SKU**
- `getVariante` → `/webservice/integration/getVariante` (objeto)
- `getProximoSkuId` → `/webservice/integration/getProximoSkuId` (objeto)
- `getProximoSkuIdOnfood` → `/webservice/integration/getProximoSkuIdOnfood` (objeto)
- `getProximoSkuIdPresta` → `/webservice/integration/getProximoSkuIdPresta` (objeto)

Exemplos de filtros (query) comuns:

- `.../getListProduto?idIntegradora=1&codProd=123`
- `.../getProduto?idIntegradora=1&ean=789...`
- `.../getListProdutoLoja?idIntegradora=1&cnpjCliente=...&idCategoria=10`

## Índice (OpenAPI — tag Produto, método GET)

| Path | operationId | Parâmetros (query/path) |
|---|---|---|
| `/webservice/integration/getCategoria` | `getCategoria` | idIntegradora*:query:integer(int32), codigo*:query:integer(int32) |
| `/webservice/integration/getListCategoria` | `getListCategoria` | idIntegradora*:query:integer(int32), codigo:query:integer(int32), codPai:query:integer(int32), categoria:query:string, idCatMarketplace:query:string, nomeCatMarketplace:query:string |
| `/webservice/integration/getListEstoqueVtex` | `getListEstoqueVtex` | idIntegradora*:query:integer(int32), ean:query:string, wharehouseid:query:string, skuId:query:string |
| `/webservice/integration/getListPreco` | `getListPreco` | idIntegradora*:query:integer(int32), idTab:query:integer(int32), codProd:query:integer(int32), qtUnit:query:integer(int32), skuId:query:string |
| `/webservice/integration/getListPrecoMagento` | `getListPrecoMagento` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), qtUnit:query:integer(int32), skuId:query:string |
| `/webservice/integration/getListPrecoOnfood` | `getListPrecoOnfood` | idIntegradora*:query:integer(int32), idTab:query:integer(int32), codProd:query:integer(int32), qtUnit:query:integer(int32), skuId:query:string |
| `/webservice/integration/getListPrecoPresta` | `getListPrecoPresta` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), idTab:query:integer(int32), qtUnit:query:number, skuId:query:string |
| `/webservice/integration/getListPrecoPromo` | `getListPrecoPromo` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), qtUnit:query:integer(int32), skuId:query:string, dtInicio*:query:string, dtFinal*:query:string |
| `/webservice/integration/getListProduto` | `getListProduto` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), categoriaPrincipal:query:integer(int32), ean:query:string, codFilial:query:string, productId:query:string, descricaoErp:query:string, skuId:query:string |
| `/webservice/integration/getListProdutoLoja` | `getListProdutoLoja` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), ean:query:string, productId:query:string, descricaoErp:query:string, skuId:query:string, cnpjCliente:query:string, idCategoria:query:integer(int32) |
| `/webservice/integration/getListProdutoOnfood` | `getListProdutoOnfood` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), ean:query:string, productId:query:string, descricaoErp:query:string, skuId:query:string, listaFit:query:boolean |
| `/webservice/integration/getListProdutoPresta` | `getListProdutoPresta` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), ean:query:string, productId:query:string, descricaoErp:query:string, skuId:query:string, idVariant:query:integer(int32) |
| `/webservice/integration/getListVinculoCategoriaProdutoLoja` | `getListVinculoCategoriaProdutoLoja` | idIntegradora*:query:integer(int32), idCategoria:query:integer(int32), codProd:query:integer(int32) |
| `/webservice/integration/getListVinculoCatMercadoLivre` | `getListVinculoCatMercadoLivre` | idIntegradora*:query:integer(int32), codigo:query:integer(int32), codPai:query:integer(int32), categoria:query:string, idCatMercadoLivre:query:string, nomeCatMercadoLivre:query:string |
| `/webservice/integration/getPreco` | `getPreco` | idIntegradora*:query:integer(int32), idTab:query:integer(int32), codProd:query:integer(int32), qtUnit:query:integer(int32), skuId:query:string |
| `/webservice/integration/getPrecoMagento` | `getPrecoMagento` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), qtUnit:query:integer(int32), skuId:query:string |
| `/webservice/integration/getPrecoOnfood` | `getPrecoOnfood` | idIntegradora*:query:integer(int32), idTab:query:integer(int32), codProd:query:integer(int32), qtUnit:query:integer(int32), skuId:query:string |
| `/webservice/integration/getPrecoPresta` | `getPrecoPresta` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), idTab:query:integer(int32), qtUnit:query:number, skuId:query:string |
| `/webservice/integration/getPrecoProdutoPresta` | `getPrecoProdutoPresta` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), qtUnit:query:number, skuId:query:string |
| `/webservice/integration/getProduto` | `getProduto` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), ean:query:string, codFilial:query:string, productId:query:string, descricaoErp:query:string, skuId:query:string |
| `/webservice/integration/getProdutoLoja` | `getProdutoLoja` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), ean:query:string, productId:query:string, descricaoErp:query:string, skuId:query:string, cnpjCliente:query:string |
| `/webservice/integration/getProdutoOnfood` | `getProdutoOnfood` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), ean:query:string, productId:query:string, descricaoErp:query:string, skuId:query:string |
| `/webservice/integration/getProdutoPresta` | `getProdutoPresta` | idIntegradora*:query:integer(int32), codProd:query:integer(int32), ean:query:string, productId:query:string, descricaoErp:query:string, skuId:query:string, idVariant:query:integer(int32) |
| `/webservice/integration/getProximoSkuId` | `getProximoSkuId` | idIntegradora*:query:integer(int32) |
| `/webservice/integration/getProximoSkuIdOnfood` | `getProximoSkuIdOnfood` | idIntegradora*:query:integer(int32) |
| `/webservice/integration/getProximoSkuIdPresta` | `getProximoSkuIdPresta` | idIntegradora*:query:integer(int32) |
| `/webservice/integration/getVariante` | `getVariante` | idIntegradora*:query:integer(int32), productId:query:string, varianteId:query:string |
| `/webservice/integration/getVinculoCatMercadoLivre` | `getVinculoCatMercadoLivre` | idIntegradora*:query:integer(int32), codigo*:query:integer(int32) |

## Detalhes por endpoint (OpenAPI)

### GET /webservice/integration/getCategoria

- operationId: `getCategoria`
- description: Retorna uma categoria

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getCategoria
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codigo` (query, required, integer(int32))

**Responses**

- `200` — Sucesso

```json
{
  "$ref": "#/components/schemas/VinculoCatMercadoLivreBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getListCategoria

- operationId: `getListCategoria`
- description: Retorna lista de categorias

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getListCategoria
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codigo` (query, optional, integer(int32))
- `codPai` (query, optional, integer(int32))
- `categoria` (query, optional, string)
- `idCatMarketplace` (query, optional, string)
- `nomeCatMarketplace` (query, optional, string)

**Responses**

- `200` — Sucesso

```json
{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/VinculoCatMercadoLivreBean"
  }
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getListEstoqueVtex

- operationId: `getListEstoqueVtex`
- description: Retorna a lista de estoque e-commerce Vtex de produtos (wharehouse)

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getListEstoqueVtex
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `ean` (query, optional, string)
- `wharehouseid` (query, optional, string)
- `skuId` (query, optional, string)

**Responses**

- `200` — Produto listado com sucesso

```json
{
  "$ref": "#/components/schemas/EstoqueVtexBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getListPreco

- operationId: `getListPreco`
- description: Retorna uma lista de preço

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getListPreco
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `idTab` (query, optional, integer(int32))
- `codProd` (query, optional, integer(int32))
- `qtUnit` (query, optional, integer(int32))
- `skuId` (query, optional, string)

**Responses**

- `200` — Prelistados com sucesso

```json
{
  "$ref": "#/components/schemas/PrecoEcommerceBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getListPrecoMagento

- operationId: `getListPrecoMagento`
- description: Retorna uma lista de preço

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getListPrecoMagento
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `qtUnit` (query, optional, integer(int32))
- `skuId` (query, optional, string)

**Responses**

- `200` — Prelistados com sucesso

```json
{
  "$ref": "#/components/schemas/PrecoEcommerceMagentoBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getListPrecoOnfood

- operationId: `getListPrecoOnfood`
- description: Retorna uma lista de preço

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getListPrecoOnfood
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `idTab` (query, optional, integer(int32))
- `codProd` (query, optional, integer(int32))
- `qtUnit` (query, optional, integer(int32))
- `skuId` (query, optional, string)

**Responses**

- `200` — Prelistados com sucesso

```json
{
  "$ref": "#/components/schemas/PrecoEcommerceBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getListPrecoPresta

- operationId: `getListPrecoPresta`
- description: Retorna uma lista de prePresta

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getListPrecoPresta
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `idTab` (query, optional, integer(int32))
- `qtUnit` (query, optional, number)
- `skuId` (query, optional, string)

**Responses**

- `200` — Prepresta listado com sucesso

```json
{
  "$ref": "#/components/schemas/ProdutoPrestaBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getListPrecoPromo

- operationId: `getListPrecoPromo`
- description: Retorna uma lista de preem promoção

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getListPrecoPromo
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `qtUnit` (query, optional, integer(int32))
- `skuId` (query, optional, string)
- `dtInicio` (query, required, string)
- `dtFinal` (query, required, string)

**Responses**

- `200` — Prepromocional listado com sucesso

```json
{
  "$ref": "#/components/schemas/PrecoPromoBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getListProduto

- operationId: `getListProduto`
- description: Retorna a lista de produtos

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getListProduto
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `categoriaPrincipal` (query, optional, integer(int32))
- `ean` (query, optional, string)
- `codFilial` (query, optional, string)
- `productId` (query, optional, string)
- `descricaoErp` (query, optional, string)
- `skuId` (query, optional, string)

**Responses**

- `200` — Produto listado com sucesso

```json
{
  "$ref": "#/components/schemas/ProdutoBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getListProdutoLoja

- operationId: `getListProdutoLoja`
- description: Retorna a lista de produtos

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getListProdutoLoja
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `ean` (query, optional, string)
- `productId` (query, optional, string)
- `descricaoErp` (query, optional, string)
- `skuId` (query, optional, string)
- `cnpjCliente` (query, optional, string)
- `idCategoria` (query, optional, integer(int32))

**Responses**

- `200` — Sucesso

```json
{
  "$ref": "#/components/schemas/ProdutoLojaBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getListProdutoOnfood

- operationId: `getListProdutoOnfood`
- description: Retorna a lista de produtos

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getListProdutoOnfood
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `ean` (query, optional, string)
- `productId` (query, optional, string)
- `descricaoErp` (query, optional, string)
- `skuId` (query, optional, string)
- `listaFit` (query, optional, boolean)

**Responses**

- `200` — Produto listado com sucesso

```json
{
  "$ref": "#/components/schemas/ProdutoOnfoodBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getListProdutoPresta

- operationId: `getListProdutoPresta`
- description: Retorna uma lista de produtos presta

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getListProdutoPresta
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `ean` (query, optional, string)
- `productId` (query, optional, string)
- `descricaoErp` (query, optional, string)
- `skuId` (query, optional, string)
- `idVariant` (query, optional, integer(int32))

**Responses**

- `200` — Produto presta listado com sucesso

```json
{
  "$ref": "#/components/schemas/ProdutoPrestaBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getListVinculoCategoriaProdutoLoja

- operationId: `getListVinculoCategoriaProdutoLoja`
- description: Retorna lista de categorias

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getListVinculoCategoriaProdutoLoja
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `idCategoria` (query, optional, integer(int32))
- `codProd` (query, optional, integer(int32))

**Responses**

- `200` — Sucesso

```json
{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/VinculoCatMercadoLivreBean"
  }
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getListVinculoCatMercadoLivre

- operationId: `getListVinculoCatMercadoLivre`
- description: Retorna uma lista de categoria vinculadas ao mercado livre

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getListVinculoCatMercadoLivre
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codigo` (query, optional, integer(int32))
- `codPai` (query, optional, integer(int32))
- `categoria` (query, optional, string)
- `idCatMercadoLivre` (query, optional, string)
- `nomeCatMercadoLivre` (query, optional, string)

**Responses**

- `200` — Sucesso

```json
{
  "$ref": "#/components/schemas/VinculoCatMercadoLivreBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getPreco

- operationId: `getPreco`
- description: Retorna um preço

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getPreco
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `idTab` (query, optional, integer(int32))
- `codProd` (query, optional, integer(int32))
- `qtUnit` (query, optional, integer(int32))
- `skuId` (query, optional, string)

**Responses**

- `200` — Preretornado com sucesso

```json
{
  "$ref": "#/components/schemas/PrecoEcommerceBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getPrecoMagento

- operationId: `getPrecoMagento`
- description: Retorna um preço

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getPrecoMagento
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `qtUnit` (query, optional, integer(int32))
- `skuId` (query, optional, string)

**Responses**

- `200` — Preretornado com sucesso

```json
{
  "$ref": "#/components/schemas/PrecoEcommerceMagentoBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getPrecoOnfood

- operationId: `getPrecoOnfood`
- description: Retorna um preço

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getPrecoOnfood
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `idTab` (query, optional, integer(int32))
- `codProd` (query, optional, integer(int32))
- `qtUnit` (query, optional, integer(int32))
- `skuId` (query, optional, string)

**Responses**

- `200` — Preretornado com sucesso

```json
{
  "$ref": "#/components/schemas/PrecoEcommerceBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getPrecoPresta

- operationId: `getPrecoPresta`
- description: Retorna um prePresta

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getPrecoPresta
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `idTab` (query, optional, integer(int32))
- `qtUnit` (query, optional, number)
- `skuId` (query, optional, string)

**Responses**

- `200` — Produto presta retornado com sucesso

```json
{
  "$ref": "#/components/schemas/ProdutoPrestaBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getPrecoProdutoPresta

- operationId: `getPrecoProdutoPresta`
- description: Retorna o prede um produto Presta

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getPrecoProdutoPresta
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `qtUnit` (query, optional, number)
- `skuId` (query, optional, string)

**Responses**

- `200` — Predo produto presta retornado com sucesso

```json
{
  "$ref": "#/components/schemas/ProdutoPrestaBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getProduto

- operationId: `getProduto`
- description: Retorna um produto específico

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getProduto
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `ean` (query, optional, string)
- `codFilial` (query, optional, string)
- `productId` (query, optional, string)
- `descricaoErp` (query, optional, string)
- `skuId` (query, optional, string)

**Responses**

- `200` — Produto retornado com sucesso

```json
{
  "$ref": "#/components/schemas/ProdutoBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getProdutoLoja

- operationId: `getProdutoLoja`
- description: Retorna um produto específico

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getProdutoLoja
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `ean` (query, optional, string)
- `productId` (query, optional, string)
- `descricaoErp` (query, optional, string)
- `skuId` (query, optional, string)
- `cnpjCliente` (query, optional, string)

**Responses**

- `200` — Sucesso

```json
{
  "$ref": "#/components/schemas/ProdutoLojaBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getProdutoOnfood

- operationId: `getProdutoOnfood`
- description: Retorna um produto específico

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getProdutoOnfood
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `ean` (query, optional, string)
- `productId` (query, optional, string)
- `descricaoErp` (query, optional, string)
- `skuId` (query, optional, string)

**Responses**

- `200` — Produto retornado com sucesso

```json
{
  "$ref": "#/components/schemas/ProdutoOnfoodBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getProdutoPresta

- operationId: `getProdutoPresta`
- description: Retorna um produto presta

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getProdutoPresta
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codProd` (query, optional, integer(int32))
- `ean` (query, optional, string)
- `productId` (query, optional, string)
- `descricaoErp` (query, optional, string)
- `skuId` (query, optional, string)
- `idVariant` (query, optional, integer(int32))

**Responses**

- `200` — Produto presta retornado com sucesso

```json
{
  "$ref": "#/components/schemas/ProdutoPrestaBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getProximoSkuId

- operationId: `getProximoSkuId`
- description: Retorna o prSkuId

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getProximoSkuId
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))

**Responses**

- `200` — Proximo sku id retornado com sucesso

```json
{
  "type": "string"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getProximoSkuIdOnfood

- operationId: `getProximoSkuIdOnfood`
- description: Retorna o prSkuId

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getProximoSkuIdOnfood
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))

**Responses**

- `200` — Proximo sku id retornado com sucesso

```json
{
  "type": "string"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getProximoSkuIdPresta

- operationId: `getProximoSkuIdPresta`
- description: Retorna o proximo SkudId presta

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getProximoSkuIdPresta
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))

**Responses**

- `200` — Proximo sku id presta retornado com sucesso

```json
{
  "$ref": "#/components/schemas/ProdutoPrestaBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getVariante

- operationId: `getVariante`
- description: Retorna uma variante de produto específico

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getVariante
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `productId` (query, optional, string)
- `varianteId` (query, optional, string)

**Responses**

- `200` — Variante de produto retornado com sucesso

```json
{
  "$ref": "#/components/schemas/ProdutoBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

### GET /webservice/integration/getVinculoCatMercadoLivre

- operationId: `getVinculoCatMercadoLivre`
- description: Retorna uma lista de categoria vinculadas ao mercado livre

**Request**

```http
GET https://gp.lopesecia.com.br:9005/Servidor/webservice/integration/getVinculoCatMercadoLivre
Accept: application/json
Authorization: <token>
```

**Parâmetros / filtros**

- `idIntegradora` (query, required, integer(int32))
- `codigo` (query, required, integer(int32))

**Responses**

- `200` — Sucesso

```json
{
  "$ref": "#/components/schemas/VinculoCatMercadoLivreBean"
}
```
- `404` — Não encontrado

```json
{
  "type": "object"
}
```
- `500` — Erro interno

```json
{
  "type": "object"
}
```

## Schemas recortados (OpenAPI)

Arquivos gerados em `schemas/` (extraídos de components.schemas e referenciados por endpoints GET tag Produto).

- `EstoqueVtexBean` → `schemas/EstoqueVtexBean.json`
- `JSONObject` → `schemas/JSONObject.json`
- `PrecoEcommerceBean` → `schemas/PrecoEcommerceBean.json`
- `PrecoEcommerceMagentoBean` → `schemas/PrecoEcommerceMagentoBean.json`
- `PrecoPromoBean` → `schemas/PrecoPromoBean.json`
- `ProdutoBean` → `schemas/ProdutoBean.json`
- `ProdutoLojaBean` → `schemas/ProdutoLojaBean.json`
- `ProdutoOnfoodBean` → `schemas/ProdutoOnfoodBean.json`
- `ProdutoPrestaBean` → `schemas/ProdutoPrestaBean.json`
- `Stock_availables` → `schemas/Stock_availables.json`
- `VarianteBean` → `schemas/VarianteBean.json`
- `VinculoCatMercadoLivreBean` → `schemas/VinculoCatMercadoLivreBean.json`

## Rotas mock-only (fora do OpenAPI)

Estas rotas aparecem em `contract/report.md` como existentes no MOCK, mas não estão no `api-docs.json`. Trate como não-contratual.

- `GET /Servidor/webservice/integration/produtos/categorias mode=mock`
- `GET /Servidor/webservice/integration/produtos/categorias/by-slug/* mode=mock`
- `GET /Servidor/webservice/integration/produtos/categorias/* mode=mock`
- `GET /Servidor/webservice/integration/produtos/by-categoria/* mode=mock`
- `GET /Servidor/webservice/integration/produtos/by-id/* mode=mock`
- `GET /Servidor/webservice/integration/produtos/by-slug/* mode=mock`
- `GET /Servidor/webservice/integration/produtos/brands mode=mock`
- `GET /Servidor/webservice/integration/produtos/brands/* mode=mock`
