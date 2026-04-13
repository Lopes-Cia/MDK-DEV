# Agente de QA + Revisão do N1 (Ecommerce) — Spec

## Why
Hoje existe código novo (microservices de imagens + SSE) e o frontend `WWW/n1` com “muitos erros” e UI “feia/igual”, distante do que foi planejado. Precisamos de um **agente de QA** que execute validações repetíveis e produza evidência (logs, prints, checklist), e de um ciclo de revisão guiado pelos documentos legados.

## What Changes
- Criar um **Agente de QA (QA-Runner)** para executar e validar o que já existe no repo, com foco em:
  - microservices novos (scraper/IA/SSE) + MOCK-END
  - frontend `WWW/n1` (fluxos e aparência)
- Padronizar um workflow de QA com **relatórios e evidência**:
  - logs de execução
  - screenshots por rota/tenant (antes/depois)
  - lista de falhas priorizada (P0/P1/P2) e critérios de “pronto”
- Definir 2 “tarefas-macro” para o agente executar em sequência:
  1) **Coletar imagens** (rodar pipeline e validar atualização de JSON + assets)
  2) **Revisar e consertar `WWW/n1`** com base em:
     - `IA/DESENHOS/LEGADO`
     - `.trae/documents/LEGADO`
     - execução real do N1 (QA técnico + QA visual)

## Impact
- Affected specs: scraper/IA/SSE, melhoria de UX do ecommerce, qualidade e estabilidade de execução local.
- Affected code (quando implementar):
  - `IA/AGENTS/**` (definição do agente QA-Runner)
  - `IA/QA/**` (relatórios/evidências gerados)
  - `WWW/n1/**` (correções e redesign)
  - `WWW/MICROSERVICE/MOCK-END/**` (integrações necessárias para QA)
  - `WWW/MICROSERVICE/image-scraper/**`, `WWW/MICROSERVICE/ia-image-generator/**`, `WWW/MICROSERVICE/sse-hub/**`

## ADDED Requirements
### Requirement: Agente QA-Runner
O sistema SHALL fornecer um agente QA-Runner com um modo “seguro” (não destrutivo) para executar QA e coletar evidências.

Regras mínimas:
- Não rodar ações destrutivas sem modo explícito (ex.: overwrite massivo de catálogo)
- Produzir relatório com evidências (logs + screenshots + lista de falhas)
- Ser capaz de executar QA em Windows

#### Scenario: QA de execução (smoke)
- **WHEN** o QA-Runner for acionado no modo smoke
- **THEN** ele valida que serviços sobem, rotas principais respondem e gera um relatório único de execução

### Requirement: Tarefa 1 do QA-Runner — Coletar Imagens
O QA-Runner SHALL executar a coleta de imagens no modo seguro (amostragem 10%) e validar resultados.

Critérios mínimos de validação:
- JSON atualizado sem quebrar schema (somente campo `image` e metadados definidos)
- assets gravados apenas em paths permitidos do tenant
- relatório de itens processados/erros por domínio (fail-fast)

#### Scenario: Execução segura
- **WHEN** o QA-Runner rodar a tarefa de imagens com modo seguro
- **THEN** ele processa ~10% e registra evidência de updates e falhas (sem travar o pipeline)

### Requirement: Tarefa 2 do QA-Runner — Revisar e Consertar N1
O QA-Runner SHALL comparar o que está implementado em `WWW/n1` contra os documentos legados e executar QA técnico + QA visual.

Critérios mínimos:
- Lista de discrepâncias mapeada (planejado vs atual)
- Correções priorizadas (P0: quebrando fluxo; P1: regressão visual/UX; P2: refinamento)
- Evidência por rota (prints) e recomendação de alterações
- Theming por tenant aplicado de forma observável (tokens afetam `background/foreground/border/accent`)
- Home do tenant renderiza o layout do Builder sem componentes ausentes

#### Scenario: Divergência do planejamento
- **WHEN** o QA-Runner analisar `IA/DESENHOS/LEGADO` e `.trae/documents/LEGADO`
- **THEN** ele produz uma matriz “planejado vs atual” e sugere correções concretas no N1

## MODIFIED Requirements
Nenhum.

## REMOVED Requirements
Nenhum.
