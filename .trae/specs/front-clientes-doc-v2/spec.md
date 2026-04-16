# FRONT-CLIENTES (Doc) v2 Spec

## Why
Padronizar a documentacao do recurso CLIENTES no FRONT, garantindo alinhamento estrito com a arquitetura Mock -> Front e com o modelo `FRONT-END-MODELO-FLUXO.md`, sem repetir o erro de declarar endpoints que nao existem no mock.

## What Changes
- Criar/atualizar `IA/DESENHOS/FRONT-CLIENTES.md` como implementacao do recurso CLIENTES no front.
- Garantir que `FRONT-CLIENTES.md` liste somente endpoints explicitamente existentes no `MOCK-CLIENTES.md` (metodo + URI definidos como implementados).
- Referenciar `FRONT-END-MODELO-FLUXO.md` como modelo/contrato e `ARQUITETURA-MOCK-FRONT-COMUNICACAO.md` como arquitetura obrigatoria.
- Incluir shape do fluxo, mapa minimo de arquivos e DEV routes somente para endpoints existentes.

## Impact
- Affected docs:
  - `IA/DESENHOS/FRONT-CLIENTES.md`
  - `IA/DESENHOS/FRONT-END-MODELO-FLUXO.md` (referencia)
  - `IA/DESENHOS/ARQUITETURA-MOCK-FRONT-COMUNICACAO.md` (referencia)
  - `IA/DESENHOS/MOCK-CLIENTES.md` (fonte de verdade)

## ADDED Requirements
### Requirement: Endpoints do FRONT-CLIENTES derivam do MOCK-CLIENTES
`IA/DESENHOS/FRONT-CLIENTES.md` SHALL listar como endpoints do recurso apenas aqueles com metodo + URI explicitamente presentes como implementados em `IA/DESENHOS/MOCK-CLIENTES.md`.

#### Scenario: Mock define login e cadastro
- **GIVEN** o mock define:
  - `POST /Servidor/webservice/integration/clientes/login`
  - `POST /Servidor/webservice/integration/clientes/cadastro`
- **THEN** o front lista:
  - `POST /api/clientes/login` -> integra com `/Servidor/webservice/integration/clientes/login`
  - `POST /api/clientes/cadastro` -> integra com `/Servidor/webservice/integration/clientes/cadastro`
- **AND** nao lista CRUD/subrecursos como endpoints existentes.

### Requirement: Regra de Ouro explicita
`IA/DESENHOS/FRONT-CLIENTES.md` SHALL conter uma secao explicita com a regra:
- se nao existe no mock, nao existe no front.

### Requirement: DEV routes somente do que existe
`IA/DESENHOS/FRONT-CLIENTES.md` SHALL listar DEV routes somente para os endpoints existentes do recurso.

## MODIFIED Requirements
Nenhuma.

## REMOVED Requirements
Nenhuma.

