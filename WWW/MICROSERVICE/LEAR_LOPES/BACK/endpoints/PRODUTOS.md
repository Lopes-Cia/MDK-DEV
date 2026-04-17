# Endpoints de Produtos (foco Loja, Preço e Estoque)
Fonte: `LEGADO/DOCS/lopes_9004/api-docs.json` (Swagger/OpenAPI)
Obs: geralmente requer header `Authorization: <token>`.

## Produtos (Loja)

### GET /webservice/integration/getProdutoLoja
Retorna um produto específico (contexto loja).

- Query
  - `idIntegradora` (required, integer)
  - `codProd` (optional, integer)
  - `ean` (optional, string)
  - `productId` (optional, string)
  - `descricaoErp` (optional, string)
  - `skuId` (optional, string)
  - `cnpjCliente` (optional, string)
- Response 200: `ProdutoLojaBean`

### GET /webservice/integration/getListProdutoLoja
Retorna a lista de produtos (contexto loja).

- Query
  - `idIntegradora` (required, integer)
  - `codProd` (optional, integer)
  - `ean` (optional, string)
  - `productId` (optional, string)
  - `descricaoErp` (optional, string)
  - `skuId` (optional, string)
  - `cnpjCliente` (optional, string)
  - `idCategoria` (optional, integer)
- Response 200: `ProdutoLojaBean`

### POST /webservice/integration/insertProdutoLoja
Cria um produto (loja).

- Body: `ProdutoLojaBean`
- Response 200: `ProdutoLojaBean`

### PUT /webservice/integration/updateProdutoLoja
Atualiza um produto (loja).

- Body: `ProdutoLojaBean`
- Response 200: `ProdutoLojaBean`

### POST /webservice/integration/insertListProdutoLoja
Cria uma lista de produtos (loja).

- Body: `array<ProdutoLojaBean>`
- Response 200: `PedidoItemBean`

### PUT /webservice/integration/updateListProdutoLoja
Atualiza uma lista de produtos (loja).

- Body: `array<ProdutoLojaBean>`
- Response 200: `array<ProdutoLojaBean>`

### DELETE /webservice/integration/deleteProdutosLoja
Deleta produtos (loja).

- Body: `array<ProdutoLojaBean>`
- Response 200: `ProdutoLojaBean`

### PUT /webservice/integration/validaVinculoProdutosLoja
Valida se o produto está vinculado.

- Body: `string`
- Response 200: `PedidoBean`

### POST /webservice/integration/insertImagenProdutoLoja
Adiciona link de imagem para produto (loja).

- Body: `array<ImagemProdutoBean>`
- Response 200: `ImagemProdutoBean`

### DELETE /webservice/integration/deleteImagenProdutoLoja
Deleta link de imagem para produto (loja).

- Body: `array<ImagemProdutoBean>`
- Response 200: `ImagemProdutoBean`

## Produtos (básico)

### GET /webservice/integration/getProduto
Retorna um produto específico.

- Query
  - `idIntegradora` (required, integer)
  - `codProd` (optional, integer)
  - `ean` (optional, string)
  - `codFilial` (optional, string)
  - `productId` (optional, string)
  - `descricaoErp` (optional, string)
  - `skuId` (optional, string)
- Response 200: `ProdutoBean`

### GET /webservice/integration/getListProduto
Retorna a lista de produtos.

- Query
  - `idIntegradora` (required, integer)
  - `codProd` (optional, integer)
  - `categoriaPrincipal` (optional, integer)
  - `ean` (optional, string)
  - `codFilial` (optional, string)
  - `productId` (optional, string)
  - `descricaoErp` (optional, string)
  - `skuId` (optional, string)
- Response 200: `ProdutoBean`

## Preço (consulta)

### GET /webservice/integration/getPreco
Retorna um preço.

- Query
  - `idIntegradora` (required, integer)
  - `idTab` (optional, integer)
  - `codProd` (optional, integer)
  - `qtUnit` (optional, integer)
  - `skuId` (optional, string)
- Response 200: `PrecoEcommerceBean`

### GET /webservice/integration/getListPreco
Retorna uma lista de preço.

- Query
  - `idIntegradora` (required, integer)
  - `idTab` (optional, integer)
  - `codProd` (optional, integer)
  - `qtUnit` (optional, integer)
  - `skuId` (optional, string)
- Response 200: `PrecoEcommerceBean`

### GET /webservice/integration/getListPrecoPromo
Retorna uma lista de preço em promoção.

- Query
  - `idIntegradora` (required, integer)
  - `codProd` (optional, integer)
  - `qtUnit` (optional, integer)
  - `skuId` (optional, string)
  - `dtInicio` (required, string)
  - `dtFinal` (required, string)
- Response 200: `PrecoPromoBean`

## Preço (canais)

### GET /webservice/integration/getPrecoOnfood
Preço Onfood.

- Query: `idIntegradora` (required), `idTab`, `codProd`, `qtUnit`, `skuId`
- Response 200: `PrecoEcommerceBean`

### GET /webservice/integration/getListPrecoOnfood
Lista de preço Onfood.

- Query: `idIntegradora` (required), `idTab`, `codProd`, `qtUnit`, `skuId`
- Response 200: `PrecoEcommerceBean`

### GET /webservice/integration/getPrecoMagento
Preço Magento.

- Query: `idIntegradora` (required), `codProd`, `qtUnit`, `skuId`
- Response 200: `PrecoEcommerceMagentoBean`

### GET /webservice/integration/getListPrecoMagento
Lista de preço Magento.

- Query: `idIntegradora` (required), `codProd`, `qtUnit`, `skuId`
- Response 200: `PrecoEcommerceMagentoBean`

### GET /webservice/integration/getPrecoPresta
Preço Presta (retorno descrito como `ProdutoPrestaBean`).

- Query: `idIntegradora` (required), `codProd`, `idTab`, `qtUnit`, `skuId`
- Response 200: `ProdutoPrestaBean`

### GET /webservice/integration/getListPrecoPresta
Lista de preço Presta (retorno descrito como `ProdutoPrestaBean`).

- Query: `idIntegradora` (required), `codProd`, `idTab`, `qtUnit`, `skuId`
- Response 200: `ProdutoPrestaBean`

### GET /webservice/integration/getPrecoProdutoPresta
Preço do produto Presta (retorno descrito como `ProdutoPrestaBean`).

- Query: `idIntegradora` (required), `codProd`, `qtUnit`, `skuId`
- Response 200: `ProdutoPrestaBean`

## Estoque (consulta)

### GET /webservice/integration/getListEstoqueVtex
Lista de estoque e-commerce Vtex (warehouse).

- Query
  - `idIntegradora` (required, integer)
  - `ean` (optional, string)
  - `wharehouseid` (optional, string)
  - `skuId` (optional, string)
- Response 200: `EstoqueVtexBean`

### GET /webservice/integration/getListFilialEstoque
Lista de filiais (estoque).

- Query
  - `idIntegradora` (required, integer)
  - `idFilial` (optional, integer)
- Response 200: `FilialSankhyaBean`

## Loja (atualizações específicas)

### PUT /webservice/integration/updatePrecoProdutoLoja
Atualiza preço do produto (loja).

- Body: `ProdutoLojaBean`
- Response 200: `ProdutoLojaBean`

### PUT /webservice/integration/updateEstoqueProdutoLoja
Atualiza estoque do produto (loja).

- Body: `ProdutoLojaBean`
- Response 200: `ProdutoLojaBean`

## Schemas (referência rápida)

### ProdutoLojaBean (principais campos)
Inclui campos de produto + preço/estoque e categorias:
`codProd`, `idIntegradora`, `codFilial`, `skuId`, `ean`, `descricaoErp`, `productId`, `preco`, `promotion`, `qtEstoque`, `imagens`, `categorias[]`.

### ProdutoBean (principais campos)
`codProd`, `idIntegradora`, `codFilial`, `skuId`, `ean`, `descricaoErp`, `productId`, `preco`, `qtEstoque`, `variants[]`, `stocks[]`.

### PrecoEcommerceBean (principais campos)
`idIntegradora`, `idTabela`, `codProd`, `qtUnit`, `skuId`, `tipoPreco`, `precoAtual`, `precoAnterior`, `dtEnvioAtual`, `dtEnvioAnterior`.

### EstoqueVtexBean (principais campos)
`idIntegradora`, `skuId`, `ean`, `codFilial`, `warehouseId`, `warehouseName`, `quantity`, `reservado`, `estoque`.
