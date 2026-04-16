# FRONT-END - Contrato de Payload (MOCK-END) — Produto por Slug

Para o FRONT, o que importa do MOCK-END é o contrato de payload:
- o que entra na request
- o que sai na response

Projeto de referência (tipos/payload esperado no front):
- [connect-ecommerce](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce)

## Endpoint externo (MOCK-END)

- Método: `GET`
- URI: `/Servidor/webservice/integration/produtos/by-slug/*`
- Exemplo de URL: `/Servidor/webservice/integration/produtos/by-slug/heineken-lata-269ml`

Referência do registro da rota:
- [routes.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs#L65-L76)

## Request (payload de entrada)

- Não tem body (GET).
- O payload é o path param `slug` (string) no final da URL.
- O `slug` pode ser enviado de 2 formas:
  - `heineken-lata-269ml`
  - `/produtos/heineken-lata-269ml`
- Se você for enviar o slug como parte da URL (um único segmento), encode o valor:
  - `encodeURIComponent("/produtos/heineken-lata-269ml")` → `%2Fprodutos%2Fheineken-lata-269ml`

Regra usada no mock para normalização:
- Remove o prefixo `/produtos/` antes de comparar.
- [ProdutosController.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/ProdutosController.mjs#L191-L203)

## Response (payload de saída)

Handler de referência:
- [produtos.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/produtos.mjs#L147-L168)

### 200 OK (encontrou)

Payload:

```json
{
  "success": true,
  "data": { /* Produto */ }
}
```

O tipo de `data` usado no front é:
- [Produto](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/lib/types/produtos.ts#L14-L29)

### 400 Bad Request (slug vazio)

Payload:

```json
{ "error": "slug is required" }
```

### 404 Not Found (não encontrou)

Payload:

```json
{ "error": "not_found" }
```

### 405 Method Not Allowed (método diferente de GET)

Payload:

```json
{ "error": "method_not_allowed" }
```
