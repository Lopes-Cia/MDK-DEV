# Endpoints do MOCK-END (deep dive)

Gerado em: 2026-04-17T05:11:12.448Z

| Grupo | Metodo | URI | Mode | Auth | Handler | Request (hints) | Response (hints) |
|---|---|---|---|---|---|---|---|
| core | GET | /health |  |  |  |  |  |
| core | GET|HEAD | /assets/images/* |  |  |  |  |  |
| core | GET|HEAD|PUT|POST | /api/storage/:tenant/images/<rest...> |  |  |  |  |  |
| connect | GET | /Servidor/webservice/integration/produtos/categorias | mock | required | ../MOCK-END/PROJETOS/connect/handlers/mock/api/produtos.mjs |  | json:* |
| connect | GET | /Servidor/webservice/integration/produtos/categorias/by-slug/* | mock | required | ../MOCK-END/PROJETOS/connect/handlers/mock/api/produtos.mjs |  | json:* |
| connect | GET | /Servidor/webservice/integration/produtos/categorias/* | mock | required | ../MOCK-END/PROJETOS/connect/handlers/mock/api/produtos.mjs |  | json:* |
| connect | GET | /Servidor/webservice/integration/produtos/by-categoria/* | mock | required | ../MOCK-END/PROJETOS/connect/handlers/mock/api/produtos.mjs |  | json:* |
| connect | GET | /Servidor/webservice/integration/produtos/by-id/* | mock | required | ../MOCK-END/PROJETOS/connect/handlers/mock/api/produtos.mjs |  | json:* |
| connect | GET | /Servidor/webservice/integration/produtos/by-slug/* | mock | required | ../MOCK-END/PROJETOS/connect/handlers/mock/api/produtos.mjs |  | json:* |
| connect | GET | /Servidor/webservice/integration/produtos/brands | mock | required | ../MOCK-END/PROJETOS/connect/handlers/mock/api/produtos.mjs |  | json:* |
| connect | GET | /Servidor/webservice/integration/produtos/brands/* | mock | required | ../MOCK-END/PROJETOS/connect/handlers/mock/api/produtos.mjs |  | json:* |
| connect | GET | /Servidor/webservice/integration/home | mock | required | ../MOCK-END/PROJETOS/connect/handlers/mock/api/home.mjs |  | json:* |
| connect | POST | /Servidor/webservice/integration/clientes/login | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/clientes.mjs | body:* | json:* |
| connect | POST | /Servidor/webservice/integration/clientes/cadastro | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/clientes.mjs | body:* | json:* |
| connect | PUT | /Servidor/webservice/integration/clientes/meus-dados | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/clientes.mjs | body:* | json:message |
| connect | PUT | /Servidor/webservice/integration/clientes/privacidade | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/clientes.mjs | body:* | json:message |
| connect | GET | /Servidor/webservice/integration/clientes/enderecos/:clienteId | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/clientes.mjs | body:* | json:message |
| connect | POST | /Servidor/webservice/integration/clientes/enderecos | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/clientes.mjs | body:* | json:message |
| connect | PUT | /Servidor/webservice/integration/clientes/enderecos/:enderecoId | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/clientes.mjs | body:* | json:message |
| connect | DELETE | /Servidor/webservice/integration/clientes/enderecos/:enderecoId | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/clientes.mjs | body:* | json:message |
| connect | GET | /Servidor/webservice/integration/carrinho/:clienteId | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs | body:* | json:* |
| connect | POST | /Servidor/webservice/integration/carrinho/itens | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs | body:* | json:* |
| connect | PUT | /Servidor/webservice/integration/carrinho/itens/:itemId | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs | body:* | json:* |
| connect | DELETE | /Servidor/webservice/integration/carrinho/itens/:itemId | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs | body:* | json:* |
| connect | POST | /Servidor/webservice/integration/carrinho/cupom | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs | body:* | json:* |
| connect | DELETE | /Servidor/webservice/integration/carrinho/cupom | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs | body:* | json:* |
| connect | POST | /Servidor/webservice/integration/checkout/sessoes | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs | body:* | json:* |
| connect | GET | /Servidor/webservice/integration/checkout/sessoes/:checkoutId | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs | body:* | json:* |
| connect | PUT | /Servidor/webservice/integration/checkout/sessoes/:checkoutId/contato | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs | body:* | json:* |
| connect | PUT | /Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/endereco | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs | body:* | json:* |
| connect | GET | /Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/frete/opcoes | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs | body:* | json:* |
| connect | PUT | /Servidor/webservice/integration/checkout/sessoes/:checkoutId/entrega/frete | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs | body:* | json:* |
| connect | POST | /Servidor/webservice/integration/checkout/sessoes/:checkoutId/pagamento/pix | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs | body:* |  |
| connect | POST | /Servidor/webservice/integration/checkout/sessoes/:checkoutId/pagamento/pix/confirmar | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs |  |  |
| connect | POST | /Servidor/webservice/integration/checkout/sessoes/:checkoutId/finalizar | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs |  |  |
| connect | GET | /Servidor/webservice/integration/pedidos/:pedidoId | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs |  |  |
| connect | GET | /Servidor/webservice/integration/pedidos | mock | none | ../MOCK-END/PROJETOS/connect/handlers/mock/api/checkout.mjs |  |  |
| auth | POST | /tokenService | original | none | ../MOCK-END/PROJETOS/ApiLopes/webservice/api/handlers/auth.mjs |  |  |
| auth | POST | /postAutenteicaAplicativo | original | required | ../MOCK-END/PROJETOS/ApiLopes/webservice/api/handlers/auth.mjs |  |  |
| auth | POST | /enviarToken | original | required | ../MOCK-END/PROJETOS/ApiLopes/webservice/api/handlers/auth.mjs |  |  |
| auth | POST | /verificarTokenSistema | original | required | ../MOCK-END/PROJETOS/ApiLopes/webservice/api/handlers/auth.mjs |  |  |
| auth | GET | /getOperadorSistemaForId | original | required | ../MOCK-END/PROJETOS/ApiLopes/webservice/api/handlers/auth.mjs |  |  |
