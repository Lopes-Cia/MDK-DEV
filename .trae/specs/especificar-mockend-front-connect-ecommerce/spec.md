# Implementação Usuários e Pedidos (MOCK-END + FRONT) Spec

## Why
Precisamos reaproveitar a análise já feita sem perder contexto, mas com escopo objetivo: separar claramente o que é tarefa de `MOCK-END` e o que é tarefa de `FRONT` para execução incremental.

## Escopo Oficial
- Repositório alvo de implementação: `WWW/REFERENCIAS/connect-ecommerce`.
- Referências legadas e outros projetos: apenas pesquisa/análise de comportamento.
- Esta spec NÃO autoriza alteração fora do escopo acima, exceto documentação em `.trae/specs`.
- Páginas existentes (ex.: `dashboard`, `login` e outras) podem ser usadas como referência visual/funcional, mas os fluxos-alvo desta entrega devem ser construídos do zero.

## What Changes
- Definir contrato de integração entre `FRONT` e `MOCK-END` para:
  - usuários: cadastro, login, meus dados, logout, esqueci senha;
  - pedidos: carrinho, checkout, meus pedidos, detalhe do pedido.
- Consolidar tarefas em duas trilhas independentes:
  - Trilha A: `MOCK-END` (endpoints e persistência JSON);
  - Trilha B: `FRONT` (stores, páginas e UX).
- Priorizar implementação simples e funcional para MVP, com refactor posterior.

## Impact
- Affected code:
  - `WWW/REFERENCIAS/connect-ecommerce/app/api/*` (BFF/rotas internas)
  - `WWW/REFERENCIAS/connect-ecommerce/stores/*`
  - `WWW/REFERENCIAS/connect-ecommerce/app/*` (páginas auth/carrinho/checkout/pedidos/conta)
  - `WWW/REFERENCIAS/connect-ecommerce/components/*` (integração de navegação e ações de sessão)
- Affected behavior:
  - Sessão de usuário e atualização de perfil
  - Persistência de carrinho e conversão em pedido
  - Fluxo de reset de senha em modo mock

## ADDED Requirements
### Requirement: Escopo de implementação restrito
O sistema de entrega SHALL limitar implementação de código ao projeto `connect-ecommerce`, mantendo outros projetos apenas como referência.

#### Scenario: Success case
- **WHEN** uma tarefa for executada
- **THEN** os arquivos alterados pertencem ao `WWW/REFERENCIAS/connect-ecommerce`
- **AND** specs em `.trae/specs` podem ser atualizadas para rastreabilidade

### Requirement: Trilha MOCK-END claramente separada
O plano SHALL listar endpoints e persistência JSON do mock-end em seção própria e independente do front.

#### Scenario: Success case
- **WHEN** o time revisar `tasks.md`
- **THEN** existe um bloco exclusivo de tarefas `MOCK-END`
- **AND** cada tarefa possui critério verificável de endpoint/JSON

### Requirement: Trilha FRONT claramente separada
O plano SHALL listar stores, páginas e navegação em seção própria e independente do mock-end.

#### Scenario: Success case
- **WHEN** o time revisar `tasks.md`
- **THEN** existe um bloco exclusivo de tarefas `FRONT`
- **AND** cada tarefa possui critério verificável de UI/estado/fluxo

### Requirement: Páginas-alvo recriadas do zero
O sistema SHALL tratar páginas já existentes como referência e implementar novas páginas-alvo do fluxo de usuário/pedidos do zero, em especial a página estilo `meus-dados`.

#### Scenario: Success case
- **WHEN** o time implementar `meus-dados`, `meus-pedidos`, carrinho e páginas de recuperação de senha
- **THEN** as páginas são construídas do zero no padrão atual do projeto
- **AND** o `dashboard` e telas antigas são usados somente como referência

### Requirement: Fluxo esqueci senha funcional (mock)
O sistema SHALL suportar request de token e redefinição de senha em fluxo simples de desenvolvimento.

#### Scenario: Success case
- **WHEN** o usuário solicita recuperação de senha
- **THEN** o sistema registra token com expiração
- **WHEN** o usuário envia token válido e nova senha
- **THEN** a senha é atualizada e o token é inutilizado

## MODIFIED Requirements
### Requirement: Organização do plano de execução
As tarefas SHALL ser organizadas por blocos `MOCK-END` e `FRONT`, com dependências explícitas e validação manual ao final.

## REMOVED Requirements
N/A
