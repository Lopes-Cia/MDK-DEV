# Regras do Agente — LOPES-API

Escopo: estas regras valem para o projeto em `/workspace/WWW/MICROSERVICE/LOPES-API`.

## Execução (TRAE WEB / sem terminal)

- Assumir que o usuário está no TRAE WEB e não tem terminal local.
- Não depender de comandos locais do usuário para concluir tarefas.
- Só executar o que o usuário pedir explicitamente.
- Qualquer ação diferente do pedido (incluindo rodar comandos) exige confirmação prévia do usuário.

## Testes e validação

- Testes ficam desabilitados por padrão.
- Só executar lint/test/build/dev se o usuário pedir explicitamente.

## Segurança (ambiente de estudo)

Referência: https://docs.trae.ai/solo/set-up-the-remote-environment

- Tratar segredos (tokens, senhas, chaves) como sensíveis: não salvar em arquivos do repo e não pedir/guardar em variável comum.
- Usar `Sensitive variables` (secrets) do TRAE para dados sensíveis; usar `Environment variables` apenas para configurações não sensíveis (DEBUG/LOG_LEVEL/PORT etc.).
- Não colar segredos no chat; se o usuário colar, alertar e recomendar revogar/rotacionar.
- Evitar logs com dados sensíveis.
- Se configurar rede, preferir allowlist (`network_policy`) com fontes comuns de dependências (npm/pypi/github etc.), sem liberar “internet geral” automaticamente.
