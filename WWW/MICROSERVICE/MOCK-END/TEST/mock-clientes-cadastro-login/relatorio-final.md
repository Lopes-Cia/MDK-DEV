# Relatório final — mock-clientes-cadastro-login

- Base URL: http://localhost:4000
- Endpoint cadastro: http://localhost:4000/connect/Servidor/webservice/integration/clientes/cadastro
- Endpoint login: http://localhost:4000/connect/Servidor/webservice/integration/clientes/login
- Seed: 1776358953991-5d8c4813b5703

## Resultados
- cadastro: 201 (esperado 201) — 01-cadastro.response.json
- login: 200 (esperado 200) — 02-login.response.json

## Validações
- cadastro-retorna-cliente-id: OK
- login-retorna-mesmo-id: OK
- login-retorna-mesmo-email: OK
- nao-vaza-senha-no-login: OK

## Conclusão
OK: cadastro e login do cliente recém-cadastrado validados.
