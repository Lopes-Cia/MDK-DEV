# Relatório final — mock-clientes-login

- Base URL: http://localhost:4000
- Endpoint: http://localhost:4000/connect/Servidor/webservice/integration/clientes/login

## Resultados
- 01-login-ok.response.json: 200 (esperado 200)
- 02-login-email-invalido.error.json: 401 (esperado 401)
- 03-login-senha-invalida.error.json: 401 (esperado 401)
- 04-login-inativo.error.json: 403 (esperado 403)

## Conclusão
OK: todos os cenários bateram com os status esperados.
