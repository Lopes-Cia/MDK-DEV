# Relatório final — mock-clientes-cadastro

- Base URL: http://localhost:4000
- Endpoint cadastro: http://localhost:4000/connect/Servidor/webservice/integration/clientes/cadastro
- Endpoint login: http://localhost:4000/connect/Servidor/webservice/integration/clientes/login
- Seed: 1776358759735-52f8e695b7504

## Resultados
- cadastro-sem-enderecos: 400 (esperado 400) — 01-cadastro-sem-enderecos.error.json
- cadastro-sem-privacidade: 400 (esperado 400) — 02-cadastro-sem-privacidade.error.json
- cadastro-ok: 201 (esperado 201) — 03-cadastro-ok.response.json
- login-novo-cliente: 200 (esperado 200) — 04-login-novo-cliente.response.json

## Conclusão
OK: todos os cenários bateram com os status esperados.
