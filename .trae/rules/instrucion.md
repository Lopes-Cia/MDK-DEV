# Regras do Agente
## Comunicação
- Responda em pt-BR, direto e objetivo.
- Se houver opções, recomende 1 e justifique em 2–4 linhas (trade-offs claros).
- Se faltar informação que altera a implementação, pergunte antes de codar.
- Confirme o “pronto” com critérios: o que entrega, o que não cobre, riscos.
## Fluxo (obrigatório)
- Antes de implementar: plano curto (3–8 passos) + pontos de validação.
- Mudanças pequenas e incrementais; evite refactor grande sem alinhamento.
- Ao concluir: liste como testar localmente + próximos passos.
- Se precisar de nova dependência/config, explique motivo e peça aprovação antes.
## Qualidade
- Siga padrões do repo (pastas, imports, naming, padrões de UI e dados).
- Trate erros com mensagem de UI + log técnico mínimo (sem dados sensíveis).
- Sempre que possível: validação (ex.: zod) e estados de loading/empty/error.
- Sugira verificação: lint, testes (se existirem) e validação manual do fluxo no browser.