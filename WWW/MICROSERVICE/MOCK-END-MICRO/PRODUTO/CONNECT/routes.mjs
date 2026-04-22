export const routes = [
  // ===== PRODUTOS (início) =====
  {
    method: "GET",
    uri: "/produtos/categorias",
    handler_class: "mock/api/produtos",
    handler_function: "categorias",
  },
  {
    method: "GET",
    uri: "/produtos/categorias/by-slug/*",
    handler_class: "mock/api/produtos",
    handler_function: "categoriaBySlug",
  },
  {
    method: "GET",
    uri: "/produtos/categorias/:idCategoria",
    handler_class: "mock/api/produtos",
    handler_function: "categoriaById",
  },
  {
    method: "GET",
    uri: "/produtos/by-categoria/:idCategoria",
    handler_class: "mock/api/produtos",
    handler_function: "produtosByCategoria",
  },
  {
    method: "GET",
    uri: "/produtos/by-id/:idProduto",
    handler_class: "mock/api/produtos",
    handler_function: "produtoById",
  },
  {
    method: "GET",
    uri: "/produtos/by-slug/:slug",
    handler_class: "mock/api/produtos",
    handler_function: "produtoBySlug",
  },
  {
    method: "GET",
    uri: "/produtos/brands",
    handler_class: "mock/api/produtos",
    handler_function: "brands",
  },
  {
    method: "GET",
    uri: "/produtos/brands/:idBrand",
    handler_class: "mock/api/produtos",
    handler_function: "brandById",
  },
  // ===== PRODUTOS (fim) =====

  // ===== ECOMMERCE (início) =====
  {
    method: "GET",
    uri: "/ecommerce",
    handler_class: "mock/api/home",
    handler_function: "home",
  },
  // ===== ECOMMERCE (fim) =====

  // ===== USUARIOS (início) =====
  {
    method: "POST",
    uri: "/usuarios/login",
    handler_class: "mock/api/clientes",
    handler_function: "login",
  },
  {
    method: "POST",
    uri: "/usuarios/cadastro",
    handler_class: "mock/api/clientes",
    handler_function: "cadastro",
  },
  {
    method: "PUT",
    uri: "/usuarios/meus-dados",
    handler_class: "mock/api/clientes",
    handler_function: "updateMeusDados",
  },
  {
    method: "PUT",
    uri: "/usuarios/privacidade",
    handler_class: "mock/api/clientes",
    handler_function: "updatePrivacidade",
  },
  {
    method: "GET",
    uri: "/usuarios/enderecos/:clienteId",
    handler_class: "mock/api/clientes",
    handler_function: "listEnderecos",
  },
  {
    method: "POST",
    uri: "/usuarios/enderecos",
    handler_class: "mock/api/clientes",
    handler_function: "createEndereco",
  },
  {
    method: "PUT",
    uri: "/usuarios/enderecos/:enderecoId",
    handler_class: "mock/api/clientes",
    handler_function: "updateEndereco",
  },
  {
    method: "DELETE",
    uri: "/usuarios/enderecos/:enderecoId",
    handler_class: "mock/api/clientes",
    handler_function: "deleteEndereco",
  },
  // ===== USUARIOS (fim) =====

  // ===== CHECKOUT (início) =====
  {
    method: "GET",
    uri: "/carrinho/:clienteId",
    handler_class: "mock/api/checkout",
    handler_function: "getCarrinho",
  },
  {
    method: "POST",
    uri: "/carrinho/itens",
    handler_class: "mock/api/checkout",
    handler_function: "addCarrinhoItem",
  },
  {
    method: "PUT",
    uri: "/carrinho/itens/:itemId",
    handler_class: "mock/api/checkout",
    handler_function: "updateCarrinhoItem",
  },
  {
    method: "DELETE",
    uri: "/carrinho/itens/:itemId",
    handler_class: "mock/api/checkout",
    handler_function: "deleteCarrinhoItem",
  },
  {
    method: "POST",
    uri: "/carrinho/cupom",
    handler_class: "mock/api/checkout",
    handler_function: "applyCupom",
  },
  {
    method: "DELETE",
    uri: "/carrinho/cupom",
    handler_class: "mock/api/checkout",
    handler_function: "removeCupom",
  },
  {
    method: "POST",
    uri: "/checkout/sessoes",
    handler_class: "mock/api/checkout",
    handler_function: "createCheckoutSessao",
  },
  {
    method: "GET",
    uri: "/checkout/sessoes/:checkoutId",
    handler_class: "mock/api/checkout",
    handler_function: "getCheckoutSessao",
  },
  {
    method: "PUT",
    uri: "/checkout/sessoes/:checkoutId/contato",
    handler_class: "mock/api/checkout",
    handler_function: "updateCheckoutContato",
  },
  {
    method: "PUT",
    uri: "/checkout/sessoes/:checkoutId/entrega/endereco",
    handler_class: "mock/api/checkout",
    handler_function: "updateCheckoutEndereco",
  },
  {
    method: "GET",
    uri: "/checkout/sessoes/:checkoutId/entrega/frete/opcoes",
    handler_class: "mock/api/checkout",
    handler_function: "listFreteOpcoes",
  },
  {
    method: "PUT",
    uri: "/checkout/sessoes/:checkoutId/entrega/frete",
    handler_class: "mock/api/checkout",
    handler_function: "setFrete",
  },
  {
    method: "POST",
    uri: "/checkout/sessoes/:checkoutId/pagamento/pix",
    handler_class: "mock/api/checkout",
    handler_function: "createPix",
  },
  {
    method: "POST",
    uri: "/checkout/sessoes/:checkoutId/pagamento/pix/confirmar",
    handler_class: "mock/api/checkout",
    handler_function: "confirmPix",
  },
  {
    method: "POST",
    uri: "/checkout/sessoes/:checkoutId/finalizar",
    handler_class: "mock/api/checkout",
    handler_function: "finalizarCheckout",
  },
  {
    method: "GET",
    uri: "/pedidos/:pedidoId",
    handler_class: "mock/api/checkout",
    handler_function: "getPedido",
  },
  {
    method: "GET",
    uri: "/pedidos",
    handler_class: "mock/api/checkout",
    handler_function: "listPedidos",
  },
  // ===== CHECKOUT (fim) =====
];
