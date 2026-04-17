# Tasks

- [x] Task 1: Migrar mock `clientes.json` para o novo schema
  - [x] Alterar chave `cliente` → `meus_dados` em todos os itens
  - [x] Remover `doisFatores` de `meus_dados` e mover para `privacidade.doisFatores`
  - [x] Garantir que o arquivo continua sendo um array de itens `{ meus_dados, enderecos[], privacidade }`

- [x] Task 2: Atualizar MOCK-END para compatibilidade e persistência no schema novo
  - [x] Atualizar normalização para aceitar apenas `{ meus_dados }`
  - [x] Atualizar login para responder com `meus_dados` e `privacidade.doisFatores` (sem alias `cliente`)
  - [x] Atualizar cadastro para persistir `doisFatores` dentro de `privacidade` (sem suporte legado)

- [x] Task 3: Atualizar front (`connect-ecommerce`) para consumir o schema novo com fallback
  - [x] Ajustar `clientes-store`/tipos para usar apenas `meus_dados`
  - [x] Ajustar telas do painel do cliente e checkout que leem `cliente`/`privacidade` para usar `meus_dados`/`privacidade.doisFatores`
  - [x] Remover fallback/compatibilidade para o schema antigo

- [x] Task 4: Atualizar evidências em `MOCK-END/TEST` para o schema novo
  - [x] Procurar referências a `cliente` e `cliente.doisFatores` e migrar para `meus_dados` e `privacidade.doisFatores`
  - [x] Garantir que nenhuma alteração fuja dos diretórios permitidos:
    - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect`
    - `WWW/MICROSERVICE/MOCK-END/TEST`
    - `WWW/REFERENCIAS/connect-ecommerce`

# Task Dependencies
- Task 2 depende de Task 1
- Task 3 depende de Task 2
- Task 4 depende de Task 2
