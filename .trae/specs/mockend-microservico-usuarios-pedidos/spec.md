# MOCK-END Microserviço - Usuários e Pedidos Spec

## Why
Precisamos avançar primeiro no backend mock para destravar os fluxos críticos de usuários e pedidos, reduzindo dependências do front neste momento.

## Escopo Oficial
- Alvo desta spec: `WWW/MICROSERVICE/MOCK-END`.
- Front `connect-ecommerce` fica fora desta etapa e será tratado depois.
- Código legado pode ser usado apenas como referência de comportamento.

## What Changes
- Implementar/ajustar endpoints no microserviço MOCK-END para cobrir:
  - Usuários: cadastro, login por token, sessão atual, logout, atualização de perfil.
  - Recuperação de senha: gerar token e redefinir senha.
  - Pedidos: carrinho persistente e checkout criando pedido.
- Garantir persistência JSON por tenant com leitura/escrita e criação lazy de arquivos.
- Padronizar respostas de API e erros mínimos para consumo pelo front.

## Impact
- Affected code:
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs`
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/*`
  - `WWW/MICROSERVICE/MOCK-END/lib/*` (helpers de JSON, locks, escrita atômica)
- Affected behavior:
  - Fluxo de autenticação e sessão mock
  - Fluxo de esqueci senha mock
  - Fluxo de carrinho e criação de pedidos

## ADDED Requirements
### Requirement: Endpoints de usuários no MOCK-END
O microserviço SHALL expor endpoints de usuários com validação mínima e persistência por tenant.

#### Scenario: Success case
- **WHEN** o cliente chama endpoints de cadastro/login/me/logout/update
- **THEN** o mock-end responde com payload consistente
- **AND** dados são persistidos nos JSONs de domínio

### Requirement: Esqueci senha no MOCK-END
O microserviço SHALL permitir gerar token de reset com expiração e consumir o token para troca de senha.

#### Scenario: Success case
- **WHEN** é solicitado reset para email válido
- **THEN** token é persistido com expiração
- **WHEN** token válido é enviado com nova senha
- **THEN** senha é atualizada e token é marcado como usado

### Requirement: Carrinho e checkout no MOCK-END
O microserviço SHALL manter carrinho por usuário e criar pedido a partir dele.

#### Scenario: Success case
- **WHEN** usuário atualiza carrinho
- **THEN** carrinho persiste por tenant/usuário
- **WHEN** checkout é confirmado
- **THEN** pedido é criado e carrinho é limpo

### Requirement: Persistência JSON segura
O microserviço SHALL usar escrita segura e permitir criação lazy de arquivos do domínio.

#### Scenario: Success case
- **WHEN** arquivo de domínio não existir
- **THEN** o microserviço cria seed mínimo ao gravar
- **AND** respostas de erro seguem padrão esperado

## MODIFIED Requirements
### Requirement: Ordem de execução
Esta etapa SHALL priorizar apenas o MOCK-END; o front será implementado em etapa posterior.

## REMOVED Requirements
N/A

