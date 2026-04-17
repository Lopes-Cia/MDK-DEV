# Contrato BACK ↔ MOCK — 9004 (MVP)

## Meta
- GeneratedAt: 2026-04-17T04:50:59.028Z
- Tags: Produto, Customer, Pedido
- OpenAPI: c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\DOCS\lopes_9004\api-docs.json
- Mock routes: c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\MOCK-END\PROJETOS\connect\routes.mjs

## Resumo por tag

### Produto
- Total (BACK): 94
- Mocked (rota declarada): 0
- Proxied (gap de mock): 94
- Original: 0
- Unknown: 0

### Customer
- Total (BACK): 27
- Mocked (rota declarada): 0
- Proxied (gap de mock): 27
- Original: 0
- Unknown: 0

### Pedido
- Total (BACK): 15
- Mocked (rota declarada): 0
- Proxied (gap de mock): 15
- Original: 0
- Unknown: 0

## Gaps (proxied) — amostra

### Produto
- DELETE /webservice/integration/deleteAllPrecoEcommerceMagento opId=deleteAllPrecoEcommerceMagento reqQuery=[idIntegradora]
- DELETE /webservice/integration/deleteAllPrecoEcommerceOnfood opId=deleteAllPrecoEcommerceOnfood reqQuery=[idIntegradora]
- DELETE /webservice/integration/deleteCategoria opId=deleteCategoria
- DELETE /webservice/integration/deleteEstoqueVtex opId=deleteEstoqueVtex
- DELETE /webservice/integration/deleteImagenProdutoLoja opId=deleteImagenProdutoLoja
- DELETE /webservice/integration/deleteListaProdutosPresta opId=deleteListaProdutosPresta
- DELETE /webservice/integration/deleteListProdutosPresta opId=deleteListProdutosPresta
- DELETE /webservice/integration/deletePrecoEcommerceAllPresta opId=deletePrecoEcommerceAllPresta reqQuery=[idIntegradora]
- DELETE /webservice/integration/deletePrecoEcommerceMagento opId=deletePrecoEcommerceMagento
- DELETE /webservice/integration/deletePrecoEcommerceOnfood opId=deletePrecoEcommerceOnfood reqQuery=[codProd,idIntegradora]
- DELETE /webservice/integration/deletePrecoEcommercePresta opId=deletePrecoEcommercePresta reqQuery=[codProd,idIntegradora]
- DELETE /webservice/integration/deletePrecoPromocao opId=deletePrecoPromocao reqQuery=[idIntegradora,idTab]
- DELETE /webservice/integration/deleteProdutoPresta opId=deleteProdutoPresta
- DELETE /webservice/integration/deleteProdutos opId=deleteProdutos
- DELETE /webservice/integration/deleteProdutosLoja opId=deleteProdutosLoja
- DELETE /webservice/integration/deleteProdutosOnfood opId=deleteProdutosOnfood
- DELETE /webservice/integration/deleteVinculoCategoriaProdutoLoja opId=deleteVinculoCategoriaProdutoLoja
- DELETE /webservice/integration/deleteVinculoCatMercadoLivre opId=deleteVinculoCatMercadoLivre
- GET /webservice/integration/getCategoria opId=getCategoria reqQuery=[codigo,idIntegradora]
- GET /webservice/integration/getListCategoria opId=getListCategoria reqQuery=[idIntegradora]

### Customer
- DELETE /webservice/integration/deleteClienteIntegrado opId=deleteClienteIntegrado
- DELETE /webservice/integration/deleteClienteIntegradoOnfood opId=deleteClienteIntegradoOnfood
- DELETE /webservice/integration/deleteCustomer opId=deleteCustomer
- GET /webservice/integration/getClienteIntegrado opId=getClienteIntegrado reqQuery=[idIntegradora]
- GET /webservice/integration/getClienteIntegradoOnfood opId=getClienteIntegradoOnfood reqQuery=[idIntegradora]
- GET /webservice/integration/getCustomer opId=getCustomer reqQuery=[idIntegradora]
- GET /webservice/integration/getListClienteIntegrado opId=getListClienteIntegrado reqQuery=[idIntegradora]
- GET /webservice/integration/getListClienteIntegradoOnfood opId=getListClienteIntegradoOnfood reqQuery=[idIntegradora]
- GET /webservice/integration/getListCustomer opId=getListCustomer reqQuery=[idIntegradora]
- GET /webservice/integration/getProximoCustomerId opId=getProximoCustomerId reqQuery=[cgc,idIntegradora]
- GET /webservice/integration/getProximoCustomerIdIntegrado opId=getProximoCustomerIdIntegrado reqQuery=[idIntegradora]
- GET /webservice/integration/getProximoCustomerIdIntegradoOnfood opId=getProximoCustomerIdIntegradoOnfood reqQuery=[idIntegradora]
- GET /webservice/integration/getQuantidadeCustomerIntegrado opId=getQuantidadeCustomerIntegrado reqQuery=[idIntegradora]
- GET /webservice/integration/getQuantidadeCustomerIntegradoOnfood opId=getQuantidadeCustomerIntegradoOnfood reqQuery=[idIntegradora]
- GET /webservice/integration/getQuantidadeCustomerNaoIntegrado opId=getQuantidadeCustomerNaoIntegrado reqQuery=[idIntegradora]
- GET /webservice/integration/validaCustomer opId=validaCustomer reqQuery=[documentNr,idIntegradora]
- GET /webservice/integration/validaPayment opId=validaPayment reqQuery=[idIntegradora,orderId]
- POST /webservice/integration/insertClienteIntegrado opId=insertClienteIntegrado
- POST /webservice/integration/insertClienteIntegradoOnfood opId=insertClienteIntegradoOnfood
- POST /webservice/integration/insertCustomer opId=insertCustomer

### Pedido
- DELETE /webservice/integration/deleteCadTracking opId=deleteCadTracking
- DELETE /webservice/integration/deleteHistoricoTracking opId=deleteHistoricoTracking
- DELETE /webservice/integration/deletePedidoIntegrado opId=deletePedidoIntegrado
- GET /webservice/integration/getListCadTracking opId=getListCadTracking reqQuery=[idIntegradora]
- GET /webservice/integration/getListHistoricoTracking opId=getListHistoricoTracking reqQuery=[dtFinal,dtInicio,idIntegradora]
- GET /webservice/integration/getListPedidoIntegrado opId=getListPedidoIntegrado reqQuery=[dtFinal,dtInicio,idIntegradora]
- GET /webservice/integration/getListPedidoIntegradoSimples opId=getListPedidoIntegradoSimples reqQuery=[dtFinal,dtInicio,idIntegradora]
- GET /webservice/integration/getListPedidoNaoIntegrado opId=getListPedidoNaoIntegrado reqQuery=[idIntegradora]
- GET /webservice/integration/getPedidoIntegrado opId=getPedidoIntegrado reqQuery=[idIntegradora]
- POST /webservice/integration/insertCadTracking opId=insertCadTracking
- POST /webservice/integration/insertHistoricoTracking opId=insertHistoricoTracking
- POST /webservice/integration/insertPedidoIntegrado opId=insertPedidoIntegrado
- PUT /webservice/integration/updateCadTracking opId=updateCadTracking
- PUT /webservice/integration/updatePedidoIntegrado opId=updatePedidoIntegrado
- PUT /webservice/integration/updatePedidoIntegradoNumPed opId=updatePedidoIntegradoNumPed

## Rotas no MOCK que não existem no OpenAPI 9004 (mock-only) — amostra
- Total: 34

- GET /Servidor/webservice/integration/produtos/categorias mode=mock
- GET /Servidor/webservice/integration/produtos/categorias/by-slug/* mode=mock
- GET /Servidor/webservice/integration/produtos/categorias/* mode=mock
- GET /Servidor/webservice/integration/produtos/by-categoria/* mode=mock
- GET /Servidor/webservice/integration/produtos/by-id/* mode=mock
- GET /Servidor/webservice/integration/produtos/by-slug/* mode=mock
- GET /Servidor/webservice/integration/produtos/brands mode=mock
- GET /Servidor/webservice/integration/produtos/brands/* mode=mock
- GET /Servidor/webservice/integration/home mode=mock
- POST /Servidor/webservice/integration/clientes/login mode=mock
- POST /Servidor/webservice/integration/clientes/cadastro mode=mock
- PUT /Servidor/webservice/integration/clientes/meus-dados mode=mock
- PUT /Servidor/webservice/integration/clientes/privacidade mode=mock
- GET /Servidor/webservice/integration/clientes/enderecos/:clienteId mode=mock
- POST /Servidor/webservice/integration/clientes/enderecos mode=mock
- PUT /Servidor/webservice/integration/clientes/enderecos/:enderecoId mode=mock
- DELETE /Servidor/webservice/integration/clientes/enderecos/:enderecoId mode=mock
- GET /Servidor/webservice/integration/carrinho/:clienteId mode=mock
- POST /Servidor/webservice/integration/carrinho/itens mode=mock
- PUT /Servidor/webservice/integration/carrinho/itens/:itemId mode=mock
- DELETE /Servidor/webservice/integration/carrinho/itens/:itemId mode=mock
- POST /Servidor/webservice/integration/carrinho/cupom mode=mock
- DELETE /Servidor/webservice/integration/carrinho/cupom mode=mock
- POST /Servidor/webservice/integration/checkout/sessoes mode=mock
- GET /Servidor/webservice/integration/checkout/sessoes/:checkoutId mode=mock
- PUT /Servidor/webservice/integration/checkout/sessoes/:checkoutId/contato mode=mock
- PUT /Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/endereco mode=mock
- GET /Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/frete/opcoes mode=mock
- PUT /Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/frete mode=mock
- POST /Servidor/webservice/integration/checkout/sessoes/:checkoutId/pagamento/pix mode=mock
- POST /Servidor/webservice/integration/checkout/sessoes/:checkoutId/pagamento/pix/confirmar mode=mock
- POST /Servidor/webservice/integration/checkout/sessoes/:checkoutId/finalizar mode=mock
- GET /Servidor/webservice/integration/pedidos/:pedidoId mode=mock
- GET /Servidor/webservice/integration/pedidos mode=mock

