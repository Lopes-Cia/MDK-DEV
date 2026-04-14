# Microserviço Tratamento de Imagens Spec

## Why
O catálogo possui imagens heterogêneas (tamanho, fundo, proporção e qualidade), causando grid desalinhado e aparência inconsistente. Precisamos de um pipeline determinístico, IA-friendly e auditável para padronizar assets com fallback confiável.

## What Changes
- Definir contrato único de processamento para imagens de produto com `trim -> full -> derivados`.
- Definir `config_master` com modo de execução `teste` (3 aleatórios) e `full` (todo JSON).
- Definir fallback obrigatório com `semImagem.png` processada na mesma lógica (sem badge).
- Definir templates versionados: `ficha_tamanho`, `trim_config`, `badge_config`, `output_naming`.
- Definir manifesto por produto com política dual-write (`latest` + `runs`) e catálogo de erros v1.
- Definir estrutura de diretórios final para `original`, `trim`, `full`, `derived`, `fallback`, `manifestos`, `rejected`.

## Impact
- Affected specs: catálogo de imagens, padronização visual, observabilidade de pipeline, fallback de mídia.
- Affected code: microserviço `TRATAMENTO-IMAGENS`, integração com JSON fonte `all_products.json`, persistência de assets e manifestos.

## ADDED Requirements
### Requirement: Modo de Execução do Pipeline
O sistema SHALL suportar os modos `teste` e `full`.

#### Scenario: Modo teste
- **WHEN** `modo_execucao=teste`
- **THEN** o sistema processa exatamente 3 produtos aleatórios do JSON fonte configurado.

#### Scenario: Modo full
- **WHEN** `modo_execucao=full`
- **THEN** o sistema processa todos os produtos do JSON fonte configurado.

### Requirement: Pipeline Determinístico de Imagem
O sistema SHALL executar o fluxo `download original -> trim -> full -> derivados` com regras fixas de qualidade.

#### Scenario: Processamento bem-sucedido
- **WHEN** a imagem atende critérios de trim e qualidade
- **THEN** o sistema gera `full` e todos os tamanhos definidos em `ficha_tamanho`.

#### Scenario: Qualidade insuficiente
- **WHEN** o trim não atende o gate mínimo de qualidade
- **THEN** o sistema registra erro `quality_below_medium` e aplica regra de fallback.

### Requirement: Fallback de Imagem
O sistema SHALL aplicar fallback local `IA/ASSETS/semImagem.png` para falhas elegíveis.

#### Scenario: Falha elegível para fallback
- **WHEN** ocorrer erro listado em `fallback_imagem.aplicar_quando`
- **THEN** a imagem de fallback é processada na mesma lógica de tamanhos, sempre sem badge.

#### Scenario: Fallback indisponível
- **WHEN** o arquivo de fallback local não existir ou falhar no processamento
- **THEN** o sistema registra `fallback_source_not_found` ou `fallback_render_failed` no manifesto.

### Requirement: Badge Parametrizado
O sistema SHALL suportar badge vertical e horizontal orientado pela proporção do TRIM.

#### Scenario: Badge permitido
- **WHEN** imagem índice 0, tamanho permitido e não fallback
- **THEN** aplicar badge conforme `badge_config` e parâmetros (`txt1`, `txt2`, `txt3`, `cor1`, `cor2`).

#### Scenario: Badge bloqueado
- **WHEN** imagem secundária, tamanho não permitido ou fallback
- **THEN** não aplicar badge.

### Requirement: Manifesto e Rastreabilidade
O sistema SHALL gerar manifesto por produto com histórico e latest.

#### Scenario: Persistência do manifesto
- **WHEN** finalizar o processamento de um produto
- **THEN** salvar `manifestos/{id}/latest.json` e `manifestos/{id}/runs/{timestamp}-{correlation_id}.json`.

#### Scenario: Consulta operacional
- **WHEN** clientes internos precisarem do status atual
- **THEN** devem usar `latest.json` como fonte principal.

### Requirement: Estrutura de Diretórios Padronizada
O sistema SHALL persistir saídas em estrutura de diretórios fixa e previsível.

#### Scenario: Saída por produto
- **WHEN** um produto for processado
- **THEN** salvar arquivos em `original/`, `trim/`, `full/`, `derived/` e manifestos correspondentes.

#### Scenario: Saída de fallback
- **WHEN** fallback for usado
- **THEN** salvar artefatos em `fallback/` com naming próprio e sem badge.

## MODIFIED Requirements
### Requirement: Política de Manifesto
A política passa a ser obrigatoriamente dual-write com histórico versionado.

#### Scenario: Escrita do manifesto
- **WHEN** manifesto for persistido
- **THEN** deve atualizar `latest` e gravar um novo snapshot em `runs`.

### Requirement: Critério de Qualidade do TRIM
Critérios mínimos deixam de ser subjetivos e passam a usar thresholds numéricos.

#### Scenario: Validação de gate
- **WHEN** validar resultado de trim
- **THEN** aplicar `min_lado_trim_px=75`, `min_area_trim_px2=20000`, `min_area_ratio=0.20`, `max_area_ratio=0.98`.

### Requirement: Nota de Qualidade de Fonte
O sistema SHALL registrar no manifesto quando a qualidade percebida depender da qualidade da imagem de origem.

#### Scenario: Origem de baixa resolução
- **WHEN** a imagem de entrada tiver baixa resolução (ex.: menor que `medium`)
- **THEN** o manifesto deve indicar que o resultado pode parecer “baixa qualidade” por limitação da fonte.

## REMOVED Requirements
### Requirement: Escolha Ambígua de Manifesto (sobrescrever OU histórico)
**Reason**: gera implementação inconsistente e reduz auditabilidade.
**Migration**: adotar somente dual-write (`latest` + `runs`) em todas as execuções.
