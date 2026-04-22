# Tasks
- [x] Task 1: Definir estrutura do MVP Node dentro de `WWW/MICROSERVICE/REDIS/`
  - [x] Criar diretório do MVP e um `package.json` mínimo
  - [x] Definir scripts CLI (ex.: `import`, `index`, `query`)

- [x] Task 2: Implementar conexão no Redis Cloud via TLS e validação de módulos
  - [x] Ler credenciais por variáveis de ambiente (sem logar segredos)
  - [x] Executar `PING` e checar disponibilidade de RedisJSON e RediSearch

- [x] Task 3: Implementar importação dos JSON (brands, categorias, produtos)
  - [x] Ler arquivos em `WWW/MICROSERVICE/REDIS/JSON/*.json`
  - [x] Gravar documentos por chave determinística `catalog:{tipo}:{id}`
  - [x] Usar pipeline/batch para performance

- [x] Task 4: Implementar criação/garantia do índice `idx:catalog:product`
  - [x] Criar índice ON JSON com PREFIX `catalog:product:`
  - [x] Garantir `DIALECT 2` nas consultas

- [x] Task 5: Implementar consulta de produtos (CLI) com paginação/busca/filtros
  - [x] Montar query RediSearch com `q`, filtros e `SORTBY`
  - [x] Implementar paginação via `LIMIT offset pageSize`
  - [x] Retornar shape consistente `{ total, page, pageSize, items }`

- [x] Task 6: Preparar roteiro de validação manual (sem execução automática)
  - [x] Comandos a rodar para: conectar, importar, indexar e consultar
  - [x] Exemplos de queries para validar filtros e paginação

# Task Dependencies
- Task 3 depende de Task 2
- Task 4 depende de Task 3
- Task 5 depende de Task 4
- Task 6 depende de Task 2, Task 3, Task 4 e Task 5
