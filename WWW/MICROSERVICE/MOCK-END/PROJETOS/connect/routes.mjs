export const routes = [
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
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/getListProdutoLoja",
    auth: {
      mode: "required",
      label: "Token da integradora (quando em modo original).",
    },
    execution: { mode: "mock" },
    handler_class: "api/integration",
    handler_function: "listProdutoLoja",
  },
  {
    method: "GET",
    uri: "/Servidor/webservice/integration/getProdutoLoja",
    auth: {
      mode: "required",
      label: "Token da integradora (quando em modo original).",
    },
    execution: { mode: "mock" },
    handler_class: "api/integration",
    handler_function: "produtoLoja",
  },
];
