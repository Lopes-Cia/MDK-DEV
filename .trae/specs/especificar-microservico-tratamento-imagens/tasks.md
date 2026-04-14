# Tasks

- [x] Task 1: Consolidar e congelar contratos de configuração no desenho base.
  - [x] SubTask 1.1: Revisar `config_master` com precedência de `modo_execucao` (`input_lote` sobre `tipo_default`).
  - [x] SubTask 1.2: Validar consistência entre `ficha_tamanho`, `trim_config`, `badge_config`, `output_naming`.
  - [x] SubTask 1.3: Confirmar que fallback está sem badge e com todos os tamanhos.

- [x] Task 2: Especificar comportamento de execução para `teste` e `full`.
  - [x] SubTask 2.1: Definir regra de seleção aleatória de 3 produtos no modo `teste`.
  - [x] SubTask 2.2: Definir processamento integral no modo `full`.
  - [x] SubTask 2.3: Definir comportamento determinístico com `seed` opcional.

- [x] Task 3: Especificar persistência e diretórios finais.
  - [x] SubTask 3.1: Validar árvore de diretórios `original/trim/full/derived/fallback/manifestos/rejected`.
  - [x] SubTask 3.2: Confirmar naming final por tamanho e produto.
  - [x] SubTask 3.3: Confirmar política de manifesto dual-write com retenção.

- [x] Task 4: Fechar catálogo oficial de erros v1 e mapeamento de etapas.
  - [x] SubTask 4.1: Revisar códigos por domínio (`download/input/trim/quality/render/fallback/storage/system`).
  - [x] SubTask 4.2: Garantir que exemplos de manifesto usam somente códigos oficiais.
  - [x] SubTask 4.3: Definir quais códigos disparam fallback.

- [x] Task 5: Implementar microserviço conforme SPEC aprovado.
  - [x] SubTask 5.1: Implementar leitura do JSON fonte e roteamento por `modo_execucao`.
  - [x] SubTask 5.2: Implementar pipeline de imagem (`original -> trim -> full -> derived`) com regras v1.
  - [x] SubTask 5.3: Implementar fluxo de fallback local com processamento completo sem badge.
  - [x] SubTask 5.4: Implementar persistência de manifesto dual-write e diretórios padronizados.

- [ ] Task 6: Validação final (sem suíte de testes automática).
  - [ ] SubTask 6.1: Validar manualmente execução `teste` e confirmar exatamente 3 produtos processados.
  - [ ] SubTask 6.2: Validar manualmente execução `full` e consolidação de manifestos.
  - [ ] SubTask 6.3: Validar cenário de falha forçada para confirmar fallback e códigos de erro.

# Task Dependencies

- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 2], [Task 3], [Task 4]
- [Task 6] depends on [Task 5]
