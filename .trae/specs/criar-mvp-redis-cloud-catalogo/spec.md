# MVP Redis Cloud (Catálogo) Spec

## Why
Hoje seu backend tem gaps de consulta (paginação, busca e filtros) no catálogo. Um MVP com Redis Cloud serve para validar Redis como camada de leitura/indexação do catálogo, reduzindo complexidade no backend e aumentando performance de consultas.

## What Changes
- Criar um MVP em Node.js que conecta no Redis Cloud via TLS e carrega os arquivos JSON de catálogo (brands, categorias, produtos) como documentos no Redis.
- Criar um índice de busca/filtros/paginação para produtos usando Redis Stack (RedisJSON + RediSearch/RQE).
- Disponibilizar scripts CLI para: importar dados, criar/atualizar índice e executar consultas de exemplo (paginação/busca/filtros).
- Padronizar chaves Redis por prefixo para permitir limpeza segura por namespace (sem FLUSHALL).

## Impact
- Affected specs: catálogo (produtos), consulta (paginação, busca, filtros), importação de seed.
- Affected code: novo diretório de MVP dentro de `WWW/MICROSERVICE/REDIS/` (nenhuma mudança no backend existente nesta etapa).

## ADDED Requirements

### Requirement: Conexão Redis Cloud segura
O sistema SHALL conectar no Redis Cloud usando TLS (rediss://) e credenciais via variáveis de ambiente, sem logar segredos.

#### Scenario: Sucesso (conectar)
- **WHEN** o operador executa o script de verificação/conexão
- **THEN** o script realiza `PING` com sucesso e imprime somente status (sem URL completa com senha)

#### Scenario: Falha (credenciais/host)
- **WHEN** credenciais ou host estão incorretos
- **THEN** o script encerra com erro claro (sem imprimir senha/token)

### Requirement: Pré-requisito de módulos (Redis Stack)
O sistema SHALL exigir RedisJSON e RediSearch (RQE). Se não estiverem disponíveis, SHALL abortar a execução das rotinas de indexação/consulta com uma mensagem objetiva de requisito não atendido.

#### Scenario: Redis Stack disponível
- **WHEN** o script detecta RedisJSON e RediSearch disponíveis
- **THEN** o MVP habilita import + criação de índice + consultas

#### Scenario: Redis Stack indisponível
- **WHEN** o script não detecta RedisJSON e/ou RediSearch
- **THEN** o MVP não tenta “emular” busca/filtros; ele aborta e orienta habilitar Redis Stack no Redis Cloud

### Requirement: Importar JSON para Redis por namespace
O sistema SHALL importar os três arquivos JSON e gravar no Redis com chaves determinísticas baseadas em `id` e prefixo.

**Keyspace (namespace)**
- `catalog:brand:{id}`
- `catalog:category:{id}`
- `catalog:product:{id}`

#### Scenario: Sucesso (import)
- **WHEN** o operador executa o script de import
- **THEN** as chaves são criadas/atualizadas e o script imprime contagem por tipo (brands/categorias/produtos)

#### Scenario: Segurança (limpeza)
- **WHEN** o operador solicita limpeza do namespace do MVP
- **THEN** o MVP remove somente chaves com prefixo `catalog:` (nunca executa FLUSHALL/FLUSHDB)

### Requirement: Índice de produtos para paginação/busca/filtros
O sistema SHALL criar (ou garantir existente) um índice RediSearch para produtos em JSON com `DIALECT 2`, cobrindo paginação, busca textual e filtros principais.

**Index name**
- `idx:catalog:product`

**Index scope**
- ON JSON
- PREFIX `catalog:product:`

**Campos mínimos (primeira versão do MVP)**
- `$.id` AS `id` NUMERIC SORTABLE
- `$.name` AS `name` TEXT SORTABLE
- `$.sku` AS `sku` TAG
- `$.slug` AS `slug` TAG
- `$.price` AS `price` NUMERIC SORTABLE
- `$.stock` AS `stock` NUMERIC SORTABLE
- `$.category.id` AS `categoryId` NUMERIC SORTABLE
- `$.brand.id` AS `brandId` NUMERIC SORTABLE

#### Scenario: Sucesso (criar índice)
- **WHEN** o operador executa o script de indexação
- **THEN** o índice fica disponível e consultas retornam resultados pagináveis

### Requirement: Consulta de produtos com paginação/busca/filtros
O sistema SHALL oferecer uma consulta de produtos via CLI (MVP) com os parâmetros:
- `q` (texto livre em `name`)
- `categoryId` (filtro)
- `brandId` (filtro)
- `priceMin/priceMax` (range)
- `inStock` (derivado de `stock > 0`)
- `sort` (ex.: `price_asc`, `price_desc`, `name_asc`, `id_desc`)
- `page` e `pageSize`

#### Scenario: Sucesso (paginação)
- **WHEN** o operador consulta com `page` e `pageSize`
- **THEN** o retorno inclui `total`, `page`, `pageSize` e `items[]` consistentes com o índice

#### Scenario: Sucesso (busca + filtros)
- **WHEN** o operador consulta com `q` e filtros combinados (ex.: `categoryId` + `priceMax`)
- **THEN** o resultado contém apenas itens que casam com o conjunto de critérios

## MODIFIED Requirements
- N/A (MVP isolado; não altera requisitos do backend existente)

## REMOVED Requirements
- N/A

