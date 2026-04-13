# Tasks
- [ ] Task 1: Definir o Agente QA-Runner (contrato e escopo)
  - [ ] Definir estrutura/pasta do agente (`IA/AGENTS/QA-RUNNER/AGENT.md`) e o “WHEN to call”
  - [ ] Definir modos de execução (smoke | imagens | n1-qa) e saídas (relatórios/prints)
  - [ ] Definir política de segurança (não destrutivo por padrão; limites e amostragem)

- [ ] Task 2: QA do pipeline de imagens (scraper + MOCK-END + assets)
  - [ ] Definir checklist de validação do pipeline (JSON, assets, metadados, fail-fast)
  - [ ] Definir como o agente coleta evidência (paths, logs, resumo)
  - [ ] Definir critérios de “pronto” para considerar a execução confiável

- [ ] Task 3: Revisar documentos legados e extrair “planejado”
  - [ ] Revisar `IA/DESENHOS/LEGADO/*.md` e consolidar decisões de UX/layout/branding
  - [ ] Revisar `.trae/documents/LEGADO/*.md` e consolidar objetivos/escopo técnico
  - [ ] Produzir uma lista única de requisitos “planejados” que impactam o N1 (rotas, componentes, UI)

- [ ] Task 4: QA técnico + visual do `WWW/n1`
  - [ ] Definir “rotas críticas” e estados (home, categoria, produto, carrinho, dashboard)
  - [ ] Definir coleta de screenshots por rota/tenant e comparação (baseline vs atual)
  - [ ] Catalogar falhas (P0/P1/P2) com steps de reprodução e prints

- [ ] Task 5: Plano de correção do N1 (priorizado)
  - [ ] Converter P0/P1 em tarefas de correção pequenas e verificáveis
  - [ ] Definir “sinais de diferenciação” (evitar ecommerce “igual”: variação de tema, layout e componentes)
  - [ ] Definir critérios de aceite visual (tipografia, spacing, cards, header/footer, consistência)

# Task Dependencies
- Task 4 depende de Task 3 (precisa do “planejado” consolidado).
- Task 5 depende de Task 4 (precisa do diagnóstico e priorização).
