# Endpoints de Categoria
Fonte: `LEGADO/DOCS/lopes_9004/api-docs.json` (Swagger/OpenAPI)

## Consulta

### GET /webservice/integration/getListCategoria
Retorna lista de categorias.

- Query
  - `idIntegradora` (required, integer)
  - `codigo` (optional, integer)
  - `codPai` (optional, integer)
  - `categoria` (optional, string)
  - `idCatMarketplace` (optional, string)
  - `nomeCatMarketplace` (optional, string)
- Response 200: `array<VinculoCatMercadoLivreBean>`

### GET /webservice/integration/getCategoria
Retorna uma categoria.

- Query
  - `idIntegradora` (required, integer)
  - `codigo` (required, integer)
- Response 200: `VinculoCatMercadoLivreBean`

## CRUD Categoria

### POST /webservice/integration/insertCategoria
Adiciona uma categoria de produto.

- Body: `VinculoCatMercadoLivreBean`
- Response 200: `VinculoCatMercadoLivreBean`

### PUT /webservice/integration/updateCategoria
Altera uma categoria de produto.

- Body: `VinculoCatMercadoLivreBean`
- Response 200: `VinculoCatMercadoLivreBean`

### DELETE /webservice/integration/deleteCategoria
Exclui uma categoria de produto.

- Body: `VinculoCatMercadoLivreBean`
- Response 200: `VinculoCatMercadoLivreBean`

## Vínculo Categoria Mercado Livre

### GET /webservice/integration/getListVinculoCatMercadoLivre
Retorna uma lista de categoria vinculadas ao Mercado Livre.

- Query
  - `idIntegradora` (required, integer)
  - `codigo` (optional, integer)
  - `codPai` (optional, integer)
  - `categoria` (optional, string)
  - `idCatMercadoLivre` (optional, string)
  - `nomeCatMercadoLivre` (optional, string)
- Response 200: `VinculoCatMercadoLivreBean`

### GET /webservice/integration/getVinculoCatMercadoLivre
Retorna uma categoria vinculada ao Mercado Livre.

- Query
  - `idIntegradora` (required, integer)
  - `codigo` (required, integer)
- Response 200: `VinculoCatMercadoLivreBean`

### POST /webservice/integration/insertVinculoCatMercadoLivre
Cria um vínculo para categorias do Mercado Livre.

- Body: `VinculoCatMercadoLivreBean`
- Response 200: `VinculoCatMercadoLivreBean`

### PUT /webservice/integration/updateVinculoCatMercadoLivre
Altera um vínculo para categorias do Mercado Livre.

- Body: `VinculoCatMercadoLivreBean`
- Response 200: `VinculoCatMercadoLivreBean`

### DELETE /webservice/integration/deleteVinculoCatMercadoLivre
Deleta um vínculo para categorias do Mercado Livre.

- Body: `VinculoCatMercadoLivreBean`
- Response 200: `VinculoCatMercadoLivreBean`

## Vínculo Categoria ↔ Produto (Loja)

### GET /webservice/integration/getListVinculoCategoriaProdutoLoja
Retorna lista de vínculos de categoria com produto.

- Query
  - `idIntegradora` (required, integer)
  - `idCategoria` (optional, integer)
  - `codProd` (optional, integer)
- Response 200: `array<VinculoCatMercadoLivreBean>`

### POST /webservice/integration/insertVinculoCategoriaProdutoLoja
Adiciona um vínculo de categoria a um produto.

- Body: `VinculoCatMercadoLivreBean`
- Response 200: `VinculoCatMercadoLivreBean`

### DELETE /webservice/integration/deleteVinculoCategoriaProdutoLoja
Deleta um vínculo de categoria a um produto.

- Body: `VinculoCatMercadoLivreBean`
- Response 200: `VinculoCatMercadoLivreBean`

## Schema (referência)

### VinculoCatMercadoLivreBean
- `idIntegradora` (integer)
- `codigo` (integer)
- `codPai` (integer)
- `categoria` (string)
- `idMercadoLivre` (string)
- `nomeMercadoLivre` (string)
- `detalhamento` (string)
- `imagem` (string)
- `codProd` (integer)
- `sequencia` (integer)
