# Relatorio de Teste - checkout-connect-v1

- Base URL: http://localhost:4000
- ClienteId: 999
- ProdutoId: 1001

## Evidencias
- 01-get-carrinho.response.json: 200 (esperado 200)
- 02-post-checkout-empty-cart.error.json: 409 (esperado 409)
- 03-post-carrinho-add-item.response.json: 201 (esperado 201)
- 04-post-carrinho-apply-cupom.response.json: 200 (esperado 200)
- 05-post-checkout-sessao.response.json: 201 (esperado 201)
- 06-get-frete-opcoes.response.json: 200 (esperado 200)
- 07-put-frete-selecionado.response.json: 200 (esperado 200)
- 08-post-finalizar-sem-pagamento.error.json: 409 (esperado 409)
- 09-post-pix.response.json: 200 (esperado 200)
- 10-post-pix-confirmar.response.json: 200 (esperado 200)
- 11-post-finalizar.response.json: 201 (esperado 201)
- 12-get-pedido.response.json: 200 (esperado 200)
- 13-get-pedidos-list.response.json: 200 (esperado 200)

## Conclusao
OK: todos os endpoints bateram com os status esperados e evidencias foram geradas.
