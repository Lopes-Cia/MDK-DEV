# Tasks — Correção `clientes.json`

## MOCK-END

- [ ] Atualizar `ClientesController` para ler/gravar `clientes.json` no formato array de itens.
- [ ] Manter compatibilidade de leitura com o formato antigo (3 arrays), se necessário.
- [ ] Garantir que o cadastro continue exigindo `enderecos` (min 1) e `privacidade`.
- [ ] Migrar `handlers/mock/clientes.json` para o novo formato.

## Documentação

- [ ] Atualizar `IA/DESENHOS/MOCK-CLIENTES.md` para descrever o novo formato.

## Testes / Evidências

- [ ] Criar/ajustar runner de teste do cadastro e gerar evidências em `TEST/mock-clientes-cadastro/`.
- [ ] Executar runner de teste do login e gerar evidências em `TEST/mock-clientes-login/`.
- [ ] Gerar `relatorio-final.md` confirmando status esperados.

