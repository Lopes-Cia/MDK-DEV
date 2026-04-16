# Checklist — Correção `clientes.json`

## Estrutura

- [ ] `handlers/mock/clientes.json` é um array de itens `{ cliente, enderecos[], privacidade }`.
- [ ] IDs de cliente e endereço continuam auto incremento.
- [ ] `senha` nunca é retornada no login/cadastro.

## Login

- [ ] 200 com `{ success: true, data: { cliente, enderecos, privacidade, token } }` para cliente ativo.
- [ ] 401 para credenciais inválidas.
- [ ] 403 para cliente inativo.

## Cadastro

- [ ] 400 sem `enderecos` ou com `enderecos: []`.
- [ ] 400 sem `privacidade`.
- [ ] 201 com `{ success: true, data: { cliente, enderecos, privacidade } }`.
- [ ] Login do cliente recém-cadastrado retorna 200.

## Evidências

- [ ] Pasta em `WWW/MICROSERVICE/MOCK-END/TEST/` com arquivos de request/response por cenário.
- [ ] `relatorio-final.md` indicando OK ou lista de falhas.

