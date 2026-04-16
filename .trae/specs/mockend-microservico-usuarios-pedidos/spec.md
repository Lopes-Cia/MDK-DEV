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
    - Usuário inclui dados básicos e endereço(s) de entrega.
  - Recuperação de senha: gerar token e redefinir senha.
  - Pedidos: carrinho persistente e checkout criando pedido.
- Adicionar configuração global de ecommerce (`ecommerce.json`) para regras e parâmetros (ex.: meios de pagamento, pedido mínimo, CEPs atendidos, CPF/CNPJ).
- Garantir persistência JSON local do projeto com leitura/escrita e criação lazy de arquivos.
- Padronizar respostas de API e erros mínimos para consumo pelo front.
- Manter o padrão de rotas existente em `routes.mjs`:
  - Prefixo constante: `/Servidor/webservice/integration/`
  - Apenas o sufixo varia (novos segmentos adicionados após o prefixo)
  - Todas as rotas usam `auth` + `execution: { mode: "mock" }`
- Implementar a lógica em controllers (classes) no mesmo estilo de [ProdutosController.mjs](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/ProdutosController.mjs).
- Garantir que novos JSONs do domínio sejam semelhantes ao padrão de dados já usado em [produtos.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/produtos.json): arquivos JSON com raiz em array e objetos consistentes (sem “wrapper” com `schemaVersion` para este microserviço).

## Impact
- Affected code:
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs`
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/api/*`
  - `WWW/MICROSERVICE/MOCK-END/lib/*` (helpers de JSON, locks, escrita atômica)
- Affected behavior:
  - Fluxo de autenticação e sessão mock
  - Fluxo de esqueci senha mock
  - Fluxo de carrinho e criação de pedidos

## Rotas (URIs novas)
Prefixo constante (obrigatório): `/Servidor/webservice/integration/`

Todas as rotas abaixo:
- possuem `auth: { mode: "required", label: "Token da integradora (quando em modo original)." }`
- possuem `execution: { mode: "mock" }`

### Usuários / Auth
- `POST /Servidor/webservice/integration/auth/register`
- `POST /Servidor/webservice/integration/auth/send-token`
- `POST /Servidor/webservice/integration/auth/verify-token`
- `GET  /Servidor/webservice/integration/auth/me`
- `POST /Servidor/webservice/integration/auth/logout`
- `PUT  /Servidor/webservice/integration/auth/me`
- `POST /Servidor/webservice/integration/auth/forgot-password`
- `POST /Servidor/webservice/integration/auth/reset-password`
- `POST /Servidor/webservice/integration/auth/privacy/delete`

### Carrinho
- `GET  /Servidor/webservice/integration/cart`
- `PUT  /Servidor/webservice/integration/cart`
- `(Opcional) POST /Servidor/webservice/integration/cart/items`
- `(Opcional) PUT  /Servidor/webservice/integration/cart/items/*`
- `(Opcional) DELETE /Servidor/webservice/integration/cart/items/*`

### Pedidos / Checkout
- `POST /Servidor/webservice/integration/orders/checkout`
- `GET  /Servidor/webservice/integration/orders`
- `GET  /Servidor/webservice/integration/orders/*`

### Configuração Ecommerce
- `GET  /Servidor/webservice/integration/ecommerce/config`

## ADDED Requirements
### Requirement: Endpoints de usuários no MOCK-END
O microserviço SHALL expor endpoints de usuários com validação mínima e persistência em JSON local do projeto.

#### Scenario: Success case
- **WHEN** o cliente chama endpoints de cadastro/login/me/logout/update
- **THEN** o mock-end responde com payload consistente
- **AND** dados são persistidos nos JSONs de domínio

### Requirement: Padrão de rotas compatível com integração atual
O microserviço SHALL seguir o mesmo padrão das rotas existentes (`/Servidor/webservice/integration/...`) e metadados (`auth`, `execution`) no `routes.mjs`.

#### Scenario: Success case
- **WHEN** novas rotas de usuários/pedidos forem adicionadas
- **THEN** elas seguem o padrão do arquivo de rotas atual
- **AND** não introduzem prefixo alternativo fora do padrão acordado

### Requirement: Esqueci senha no MOCK-END
O microserviço SHALL permitir gerar token de reset com expiração e consumir o token para troca de senha.

#### Scenario: Success case
- **WHEN** é solicitado reset para email válido
- **THEN** token é persistido com expiração
- **WHEN** token válido é enviado com nova senha
- **THEN** senha é atualizada e token é marcado como usado

### Requirement: Carrinho e checkout no MOCK-END
O microserviço SHALL manter carrinho por usuário e criar pedido a partir dele.

### Requirement: Privacidade (LGPD)
O microserviço SHALL permitir que o usuário solicite exclusão dos seus dados (remoção de usuário e dados relacionados) para conformidade.

#### Scenario: Success case
- **WHEN** o usuário autenticado solicita exclusão de dados
- **THEN** o usuário é removido do `users.json`
- **AND** carrinho, sessões, pedidos e tokens relacionados são removidos

#### Scenario: Success case
- **WHEN** usuário atualiza carrinho
- **THEN** carrinho persiste por usuário
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

### Requirement: Padrão de rotas compatível com integração atual
O microserviço SHALL seguir o padrão do `routes.mjs` atual (prefixo constante `/Servidor/webservice/integration/`, `auth` presente e `execution: { mode: "mock" }`).

### Requirement: Modelo de implementação por classes (controllers)
O microserviço SHALL implementar as regras de negócio em classes controller (ex.: `UsersController`, `OrdersController`), mantendo os arquivos `*.mjs` de handler como “thin handlers” que só validam/parseiam e delegam para a classe.

### Requirement: Formato dos JSONs do domínio
Os arquivos JSON de usuários/pedidos/carrinho/reset SHALL ser estruturados como arrays (raiz `[]`) e com objetos simples, semelhantes ao padrão de `produtos.json`.

## REMOVED Requirements
N/A
