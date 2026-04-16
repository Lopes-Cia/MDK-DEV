export const routes = [
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
  }
  
  // ,
  // {
  //   method: "POST",
  //   uri: "/Servidor/webservice/integration/auth/register",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/auth",
  //   handler_function: "register",
  // },
  // {
  //   method: "POST",
  //   uri: "/Servidor/webservice/integration/auth/send-token",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/auth",
  //   handler_function: "send-token",
  // },
  // {
  //   method: "POST",
  //   uri: "/Servidor/webservice/integration/auth/verify-token",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/auth",
  //   handler_function: "verify-token",
  // },
  // {
  //   method: "GET",
  //   uri: "/Servidor/webservice/integration/auth/me",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/auth",
  //   handler_function: "me",
  // },
  // {
  //   method: "POST",
  //   uri: "/Servidor/webservice/integration/auth/logout",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/auth",
  //   handler_function: "logout",
  // },
  // {
  //   method: "PUT",
  //   uri: "/Servidor/webservice/integration/auth/me",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/auth",
  //   handler_function: "update-me",
  // },
  // {
  //   method: "POST",
  //   uri: "/Servidor/webservice/integration/auth/forgot-password",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/auth",
  //   handler_function: "forgot-password",
  // },
  // {
  //   method: "POST",
  //   uri: "/Servidor/webservice/integration/auth/reset-password",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/auth",
  //   handler_function: "reset-password",
  // },
  // {
  //   method: "POST",
  //   uri: "/Servidor/webservice/integration/auth/privacy/delete",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/auth",
  //   handler_function: "privacy-delete",
  // },
  // {
  //   method: "GET",
  //   uri: "/Servidor/webservice/integration/cart",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/cart",
  //   handler_function: "get",
  // },
  // {
  //   method: "PUT",
  //   uri: "/Servidor/webservice/integration/cart",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/cart",
  //   handler_function: "put",
  // },
  // {
  //   method: "POST",
  //   uri: "/Servidor/webservice/integration/orders/checkout",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/orders",
  //   handler_function: "checkout",
  // },
  // {
  //   method: "GET",
  //   uri: "/Servidor/webservice/integration/orders",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/orders",
  //   handler_function: "list",
  // },
  // {
  //   method: "GET",
  //   uri: "/Servidor/webservice/integration/orders/*",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/orders",
  //   handler_function: "detail",
  // },
  // {
  //   method: "GET",
  //   uri: "/Servidor/webservice/integration/ecommerce/config",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/ecommerce",
  //   handler_function: "config",
  // },
  // // Integração: listagem de produtos (legado)
  // {
  //   method: "GET",
  //   uri: "/Servidor/webservice/integration/getListProdutoLoja",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/integration",
  //   handler_function: "listProdutoLoja",
  // },
  // // Integração: produto loja (legado)
  // {
  //   method: "GET",
  //   uri: "/Servidor/webservice/integration/getProdutoLoja",
  //   auth: {
  //     mode: "required",
  //     label: "Token da integradora (quando em modo original).",
  //   },
  //   execution: { mode: "mock" },
  //   handler_class: "api/integration",
  //   handler_function: "produtoLoja",
  // },
];
