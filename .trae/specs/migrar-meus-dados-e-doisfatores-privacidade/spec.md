# Migração `clientes.json`: `cliente` → `meus_dados` e `doisFatores` em `privacidade` — Spec

## Why
Padronizar o payload de cliente no mock e no front para refletir melhor o domínio (“meus dados”) e centralizar configurações sensíveis/consentimentos em `privacidade`. Isso reduz acoplamento do front a nomes antigos e prepara evolução do modelo.

## What Changes
- Alterar o mock `handlers/mock/clientes.json` para usar a chave **`meus_dados`** no lugar de **`cliente`**.
- Mover o objeto **`doisFatores`** de dentro de `cliente` para dentro de **`privacidade`**.
- Atualizar o MOCK-END (controller + normalização) para suportar **somente o modelo novo**.
- Atualizar o front (`connect-ecommerce`) para consumir **somente** `meus_dados` e `privacidade.doisFatores` (sem fallback).
- Atualizar evidências/artefatos em `WWW/MICROSERVICE/MOCK-END/TEST` que referenciem o schema antigo.
- **BREAKING**: consumidores que leem `data.cliente` ou `cliente.doisFatores` devem ser migrados.

## Impact
- Affected specs: mock de clientes (login/cadastro), painel do cliente, checkout (hidratação), privacidade
- Affected code (escopo permitido):
  - `c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\MOCK-END\PROJETOS\connect\handlers\mock\clientes.json`
  - `c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\MOCK-END\PROJETOS\connect\handlers\mock\api\ClientesController.mjs`
  - `c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\MOCK-END\TEST\**`
  - `c:\LOPES\www\MDK-DEV\WWW\REFERENCIAS\connect-ecommerce\**`

## ADDED Requirements
### Requirement: Schema novo apenas
O sistema SHALL aceitar e produzir apenas o schema novo de clientes.

#### Scenario: Leitura do item no arquivo
- **GIVEN** item `{ meus_dados, enderecos, privacidade }` no arquivo
- **WHEN** o controller/carregador normaliza o item
- **THEN** o sistema usa `{ meus_dados, enderecos, privacidade }` sem fallback para chaves legadas

### Requirement: `doisFatores` passa a residir em `privacidade`
O sistema SHALL considerar `privacidade.doisFatores` como fonte principal.

#### Scenario: Dados antigos ainda presentes
- **GIVEN** `cliente.doisFatores` existe e `privacidade.doisFatores` não existe
- **WHEN** o payload é normalizado
- **THEN** o sistema propaga `doisFatores` para o objeto de `privacidade` (em memória) e mantém leitura compatível

### Requirement: Atualização das evidências
O sistema SHALL manter as evidências/artefatos em `WWW/MICROSERVICE/MOCK-END/TEST` coerentes com o schema novo.

## MODIFIED Requirements
### Requirement: Contrato de login/cadastro (payload)
O MOCK-END SHALL retornar dados do cliente em `meus_dados` (novo) e `privacidade.doisFatores`.

#### Scenario: Login com sucesso (cliente ativo)
- **WHEN** login válido
- **THEN** resposta 200 inclui `data.meus_dados`, `data.enderecos`, `data.privacidade`, `data.token`
- **AND** `data.privacidade.doisFatores` deve existir (mesmo que `habilitado=false`)

## REMOVED Requirements
### Requirement: `cliente` como chave principal do item
**Reason**: padronizar semântica para “meus dados”.
**Migration**: atualizar mock/controller/front/testes para lerem/escreverem somente `meus_dados`.
