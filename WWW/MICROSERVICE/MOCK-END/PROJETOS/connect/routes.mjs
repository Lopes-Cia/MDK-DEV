export const routes = [
  // Storage JSON multi-tenant (COMMERCE allowlist)
  {
    method: "GET",
    uri: "/api/:tenant/json",
    execution: { mode: "mock" },
    handler_class: "api/json",
    handler_function: "getJson",
  },
  {
    method: "PUT",
    uri: "/api/:tenant/json",
    execution: { mode: "mock" },
    handler_class: "api/json",
    handler_function: "putJson",
  },
  // CRUD mínimo em arrays por id (read-modify-write)
  {
    method: "POST",
    uri: "/api/:tenant/json/array",
    execution: { mode: "mock" },
    handler_class: "api/json",
    handler_function: "upsertArrayItem",
  },
  {
    method: "DELETE",
    uri: "/api/:tenant/json/array",
    execution: { mode: "mock" },
    handler_class: "api/json",
    handler_function: "removeArrayItem",
  },

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
  // Integração: listagem de produtos (legado)
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
  // Integração: produto loja (legado)
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
