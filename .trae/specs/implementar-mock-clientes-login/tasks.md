# Tasks
- [x] Task 1: Definir rota de login no connect
  - [x] Adicionar rota `POST /Servidor/webservice/integration/clientes/login` em `PROJETOS/connect/routes.mjs` com `execution.mode: "mock"`, `auth.mode: "none"`, `handler_class: "api/clientes"`, `handler_function: "login"`.

- [x] Task 2: Preparar dados mock de clientes
  - [x] Criar/atualizar `PROJETOS/connect/handlers/mock/clientes.json` com chaves: `cliente[]`, `enderecos[]`, `privacidade[]`.
  - [x] Inserir cliente de teste para login (sem 2 fatores) e pelo menos 1 endereço + 1 privacidade para validar retorno completo.
  - [x] Definir campo `senha` em texto no registro do cliente (mock), e garantir que não retorna no login.

- [x] Task 3: Implementar controller de clientes
  - [x] Criar `PROJETOS/connect/handlers/mock/api/ClientesController.mjs` para carregar `clientes.json` (cache em memória).
  - [x] Implementar `login(email, senha)` que valida credenciais e monta `{ cliente, enderecos, privacidade, token }`.

- [x] Task 4: Implementar handler HTTP do login
  - [x] Criar `PROJETOS/connect/handlers/mock/api/clientes.mjs` com `export const handlers = { login }`.
  - [x] Validar método `POST`.
  - [x] Ler body JSON (`email`, `senha`).
  - [x] Mapear status/erros conforme spec (200/401/403).

- [x] Task 5: Atualizar desenho (documentação)
  - [x] Atualizar `IA/DESENHOS/MOCK-CLIENTES.md` com:
    - cliente de teste completo (cliente + enderecos + privacidade)
    - regra de senha no mock (texto puro no JSON, nunca retornar)
    - endpoint de login (uri, payload, respostas)

- [x] Task 6: Teste pós-implementação (protocolo)
  - [x] Criar diretório `WWW/MICROSERVICE/MOCK-END/TEST/mock-clientes-login/`.
  - [x] Reiniciar o MOCK-END.
  - [x] Executar chamadas e salvar evidências:
    - 01-login-ok.response.json
    - 02-login-email-invalido.error.json
    - 03-login-senha-invalida.error.json
    - 04-login-inativo.error.json
  - [x] Criar `relatorio-final.md` com conclusão baseada nos arquivos salvos.

# Task Dependencies
- Task 4 depende de Task 3
- Task 6 depende de Task 1, Task 2, Task 3, Task 4
