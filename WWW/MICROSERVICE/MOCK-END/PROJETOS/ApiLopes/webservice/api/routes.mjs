export const routes = [
  {
    method: "POST",
    uri: "/tokenService",
    auth: {
      mode: "none",
      label: "Auth no upstream; mock-end não impõe auth aqui.",
    },
    execution: { mode: "original" },
    handler_class: "auth",
    handler_function: "tokenService",
  },
  {
    method: "POST",
    uri: "/postAutenteicaAplicativo",
    auth: {
      mode: "required",
      label: "Auth no upstream; mock-end não impõe auth aqui.",
    },
    execution: { mode: "original" },
    handler_class: "auth",
    handler_function: "postAutenteicaAplicativo",
  },
  {
    method: "POST",
    uri: "/enviarToken",
    auth: {
      mode: "required",
      label: "Auth no upstream; mock-end não impõe auth aqui.",
    },
    execution: { mode: "original" },
    handler_class: "auth",
    handler_function: "enviarToken",
  },
  {
    method: "POST",
    uri: "/verificarTokenSistema",
    auth: {
      mode: "required",
      label: "Auth no upstream; mock-end não impõe auth aqui.",
    },
    execution: { mode: "original" },
    handler_class: "auth",
    handler_function: "verificarTokenSistema",
  },
  {
    method: "GET",
    uri: "/getOperadorSistemaForId",
    auth: {
      mode: "required",
      label: "Auth no upstream; mock-end não impõe auth aqui.",
    },
    execution: { mode: "original" },
    handler_class: "auth",
    handler_function: "getOperadorSistemaForId",
  },
];
