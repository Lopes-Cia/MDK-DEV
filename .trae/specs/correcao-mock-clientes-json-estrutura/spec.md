# Correção — Estrutura do `clientes.json` (MOCK-END / connect)

## Objetivo

Ajustar o modelo e a implementação do mock de clientes para que o arquivo `clientes.json` tenha a estrutura:

```json
[
  { "cliente": {}, "enderecos": [{}, {}], "privacidade": {} }
]
```

Isso exige atualização da documentação e ajustes no `ClientesController` (login/cadastro) para ler e persistir nesse formato.

## Escopo

- Projeto: `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect`
- Arquivo de dados:
  - `handlers/mock/clientes.json`
- Código:
  - `handlers/mock/api/ClientesController.mjs`
- Documentação:
  - `IA/DESENHOS/MOCK-CLIENTES.md`
- Testes (evidências em `WWW/MICROSERVICE/MOCK-END/TEST/`):
  - login
  - cadastro (inclui validação de endereço + privacidade)

## Regras / Premissas

- O mock deve continuar retornando `cliente` sem `senha`.
- Cadastro deve exigir:
  - `enderecos` com pelo menos 1 item
  - `privacidade` obrigatória
- IDs seguem auto incremento (cliente e endereço).
- Compatibilidade: leitura do formato antigo (3 arrays) pode ser mantida para não quebrar arquivos legados, mas a gravação deve ser no formato novo (array de itens).

## Critérios de Aceite

- `clientes.json` está no formato novo (array de itens).
- Login funciona:
  - 200 para cliente ativo com credenciais corretas
  - 401 para credenciais inválidas
  - 403 para cliente inativo
- Cadastro funciona:
  - 400 sem `enderecos`
  - 400 sem `privacidade`
  - 201 quando payload completo
  - login do cliente recém-cadastrado retorna 200
- Evidências de teste salvas em pasta de `TEST/` com `relatorio-final.md`.

