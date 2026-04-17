export const routes = [
  // Storage JSON multi-tenant (COMMERCE allowlist)


  // Catálogo de categorias (árvore completa)
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/produtos/categorias",
    auth: {
      mode: "required",
      label: "Token da integradora (quando em modo original).",
    },
    execution: { mode: "mock" },
    handler_class: "api/produtos",
    handler_function: "categorias",
  },
  // Categoria por slug (path completo /categoria/pai/filho/...)
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/produtos/categorias/by-slug/*",
    auth: {
      mode: "required",
      label: "Token da integradora (quando em modo original).",
    },
    execution: { mode: "mock" },
    handler_class: "api/produtos",
    handler_function: "categoriaBySlug",
  },
  // Categoria por id (inclui filhos imediatos)
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/produtos/categorias/*",
    auth: {
      mode: "required",
      label: "Token da integradora (quando em modo original).",
    },
    execution: { mode: "mock" },
    handler_class: "api/produtos",
    handler_function: "categoriaById",
  },
  // Produtos por categoria (com opção includeDescendants + paginação)
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/produtos/by-categoria/*",
    auth: {
      mode: "required",
      label: "Token da integradora (quando em modo original).",
    },
    execution: { mode: "mock" },
    handler_class: "api/produtos",
    handler_function: "produtosByCategoria",
  },
  // Produto por id
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/produtos/by-id/*",
    auth: {
      mode: "required",
      label: "Token da integradora (quando em modo original).",
    },
    execution: { mode: "mock" },
    handler_class: "api/produtos",
    handler_function: "produtoById",
  },
  // Produto por slug
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/produtos/by-slug/*",
    auth: {
      mode: "required",
      label: "Token da integradora (quando em modo original).",
    },
    execution: { mode: "mock" },
    handler_class: "api/produtos",
    handler_function: "produtoBySlug",
  },
  // Brands (lista de marcas)
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/produtos/brands",
    auth: {
      mode: "required",
      label: "Token da integradora (quando em modo original).",
    },
    execution: { mode: "mock" },
    handler_class: "api/produtos",
    handler_function: "brands",
  },
  // Brand por id (inclui produtos dessa marca com paginação)
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/produtos/brands/*",
    auth: {
      mode: "required",
      label: "Token da integradora (quando em modo original).",
    },
    execution: { mode: "mock" },
    handler_class: "api/produtos",
    handler_function: "brandById",
  },
  // Home (colections.json) — banners e carrosséis
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/home",
    auth: {
      mode: "required",
      label: "Token da integradora (quando em modo original).",
    },
    execution: { mode: "mock" },
    handler_class: "api/home",
    handler_function: "home",
  },
  // Clientes - login (mock)
  {
    method: "POST",
    uri: "/Servidor/webservice/integration/clientes/login",
    auth: {
      mode: "none",
      label: "Sem auth para login de cliente no mock-end.",
    },
    execution: { mode: "mock" },
    handler_class: "api/clientes",
    handler_function: "login",
  },
  {
    method: "POST",
    uri: "/Servidor/webservice/integration/clientes/cadastro",
    auth: {
      mode: "none",
      label: "Sem auth para cadastro de cliente no mock-end.",
    },
    execution: { mode: "mock" },
    handler_class: "api/clientes",
    handler_function: "cadastro",
  },
  {
    method: "PUT",
    uri: "/Servidor/webservice/integration/clientes/meus-dados",
    auth: {
      mode: "none",
      label: "Identificação via clienteId no body.",
    },
    execution: { mode: "mock" },
    handler_class: "api/clientes",
    handler_function: "updateMeusDados",
  },
  {
    method: "PUT",
    uri: "/Servidor/webservice/integration/clientes/privacidade",
    auth: {
      mode: "none",
      label: "Identificação via clienteId no body.",
    },
    execution: { mode: "mock" },
    handler_class: "api/clientes",
    handler_function: "updatePrivacidade",
  },
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/clientes/enderecos/:clienteId",
    auth: {
      mode: "none",
      label: "Identificação via param clienteId.",
    },
    execution: { mode: "mock" },
    handler_class: "api/clientes",
    handler_function: "listEnderecos",
  },
  {
    method: "POST",
    uri: "/Servidor/webservice/integration/clientes/enderecos",
    auth: {
      mode: "none",
      label: "Identificação via clienteId no body.",
    },
    execution: { mode: "mock" },
    handler_class: "api/clientes",
    handler_function: "createEndereco",
  },
  {
    method: "PUT",
    uri: "/Servidor/webservice/integration/clientes/enderecos/:enderecoId",
    auth: {
      mode: "none",
      label: "Identificação via param enderecoId (clienteId opcional no body).",
    },
    execution: { mode: "mock" },
    handler_class: "api/clientes",
    handler_function: "updateEndereco",
  },
  {
    method: "DELETE",
    uri: "/Servidor/webservice/integration/clientes/enderecos/:enderecoId",
    auth: {
      mode: "none",
      label: "Identificação via param enderecoId (clienteId opcional no body).",
    },
    execution: { mode: "mock" },
    handler_class: "api/clientes",
    handler_function: "deleteEndereco",
  },
  // Carrinho (checkout v1)
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/carrinho/:clienteId",
    auth: {
      mode: "none",
      label: "Identificacao via param clienteId.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "getCarrinho",
  },
  {
    method: "POST",
    uri: "/Servidor/webservice/integration/carrinho/itens",
    auth: {
      mode: "none",
      label: "Identificacao via clienteId no body.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "addCarrinhoItem",
  },
  {
    method: "PUT",
    uri: "/Servidor/webservice/integration/carrinho/itens/:itemId",
    auth: {
      mode: "none",
      label: "Identificacao via itemId na rota e clienteId no body.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "updateCarrinhoItem",
  },
  {
    method: "DELETE",
    uri: "/Servidor/webservice/integration/carrinho/itens/:itemId",
    auth: {
      mode: "none",
      label: "Identificacao via itemId na rota e clienteId no body.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "deleteCarrinhoItem",
  },
  {
    method: "POST",
    uri: "/Servidor/webservice/integration/carrinho/cupom",
    auth: {
      mode: "none",
      label: "Identificacao via clienteId no body.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "applyCupom",
  },
  {
    method: "DELETE",
    uri: "/Servidor/webservice/integration/carrinho/cupom",
    auth: {
      mode: "none",
      label: "Identificacao via clienteId no body.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "removeCupom",
  },
  // Checkout sessoes
  {
    method: "POST",
    uri: "/Servidor/webservice/integration/checkout/sessoes",
    auth: {
      mode: "none",
      label: "Cria sessao via clienteId no body.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "createCheckoutSessao",
  },
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/checkout/sessoes/:checkoutId",
    auth: {
      mode: "none",
      label: "Leitura por checkoutId.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "getCheckoutSessao",
  },
  {
    method: "PUT",
    uri: "/Servidor/webservice/integration/checkout/sessoes/:checkoutId/contato",
    auth: {
      mode: "none",
      label: "Atualiza contato do checkout.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "updateCheckoutContato",
  },
  {
    method: "PUT",
    uri: "/Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/endereco",
    auth: {
      mode: "none",
      label: "Atualiza endereco de entrega do checkout.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "updateCheckoutEndereco",
  },
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/frete/opcoes",
    auth: {
      mode: "none",
      label: "Lista opcoes de frete do checkout.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "listFreteOpcoes",
  },
  {
    method: "PUT",
    uri: "/Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/frete",
    auth: {
      mode: "none",
      label: "Seleciona frete do checkout.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "setFrete",
  },
  {
    method: "POST",
    uri: "/Servidor/webservice/integration/checkout/sessoes/:checkoutId/pagamento/pix",
    auth: {
      mode: "none",
      label: "Gera payload Pix do checkout.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "createPix",
  },
  {
    method: "POST",
    uri: "/Servidor/webservice/integration/checkout/sessoes/:checkoutId/pagamento/pix/confirmar",
    auth: {
      mode: "none",
      label: "Confirma pagamento Pix mock.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "confirmPix",
  },
  {
    method: "POST",
    uri: "/Servidor/webservice/integration/checkout/sessoes/:checkoutId/finalizar",
    auth: {
      mode: "none",
      label: "Finaliza checkout e cria pedido.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "finalizarCheckout",
  },
  // Pedidos
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/pedidos/:pedidoId",
    auth: {
      mode: "none",
      label: "Consulta pedido por id.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "getPedido",
  },
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/pedidos",
    auth: {
      mode: "none",
      label: "Lista pedidos por clienteId via query.",
    },
    execution: { mode: "mock" },
    handler_class: "api/checkout",
    handler_function: "listPedidos",
  },
];
