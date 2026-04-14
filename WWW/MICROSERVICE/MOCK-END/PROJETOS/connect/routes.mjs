export const routes = [
  {
    method: "POST",
    uri: "/api/auth/register",
    auth: {
      mode: "none",
      label: "Sem auth no mock-end; manter rótulo para futura auth seguindo o modelo original.",
    },
    execution: { mode: "original" },
    handler_class: "api/auth",
    handler_function: "register",
  },
  {
    method: "POST",
    uri: "/api/auth/send-token",
    auth: {
      mode: "none",
      label: "Sem auth no mock-end; manter rótulo para futura auth seguindo o modelo original.",
    },
    execution: { mode: "original" },
    handler_class: "api/auth",
    handler_function: "send-token",
  },
  {
    method: "POST",
    uri: "/api/auth/verify-token",
    auth: {
      mode: "none",
      label: "Sem auth no mock-end; manter rótulo para futura auth seguindo o modelo original.",
    },
    execution: { mode: "original" },
    handler_class: "api/auth",
    handler_function: "verify-token",
  },
  {
    method: "POST",
    uri: "/api/auth/logout",
    auth: {
      mode: "none",
      label: "Sem auth no mock-end; manter rótulo para futura auth seguindo o modelo original.",
    },
    execution: { mode: "original" },
    handler_class: "api/auth",
    handler_function: "logout",
  },
  {
    method: "GET",
    uri: "/api/auth/me",
    auth: {
      mode: "none",
      label: "Sem auth no mock-end; manter rótulo para futura auth seguindo o modelo original.",
    },
    execution: { mode: "original" },
    handler_class: "api/auth",
    handler_function: "me",
  },
  {
    method: "GET",
    uri: "/api/products",
    auth: {
      mode: "none",
      label: "Sem auth no mock-end; manter rótulo para futura auth seguindo o modelo original.",
    },
    execution: { mode: "original" },
    handler_class: "api/products",
    handler_function: "list",
  },
  {
    method: "GET",
    uri: "/api/products/:codProd",
    auth: {
      mode: "none",
      label: "Sem auth no mock-end; manter rótulo para futura auth seguindo o modelo original.",
    },
    execution: { mode: "original" },
    handler_class: "api/products",
    handler_function: "detail",
  },
];
