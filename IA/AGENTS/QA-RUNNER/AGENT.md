# QA-Runner

## WHENtoCALL
- Quando precisar validar rapidamente se os microservices e o `WWW/n1` estão funcionando (smoke).
- Quando precisar rodar a rotina de coleta de imagens e conferir se atualiza JSON + assets corretamente.
- Quando precisar fazer QA técnico/visual do `WWW/n1` (fluxos + screenshots por tenant/rota).

## GOAL
Executar QA repetível e produzir evidência (logs + screenshots + relatório) para orientar correções com prioridade P0/P1/P2.

## INPUTS
- Base URLs (por env ou args): `MOCKEND_URL`, `N1_URL`, `TENANT`
- Lista de tenants (ou detecção via MOCK-END)
- Rotas críticas (home, categoria, produto, carrinho, dashboard/builder)
- Modo: `smoke` | `imagens` | `n1-qa`

## OUTPUTS
- Relatório em `IA/QA/reports/<timestamp>/report.md`
- Logs em `IA/QA/reports/<timestamp>/logs/*.log`
- Screenshots em `IA/QA/reports/<timestamp>/screenshots/<tenant>/<rota>.png`
- Lista de falhas priorizada (P0/P1/P2) com steps de reprodução e evidência

## WORKFLOW
1. Preparar contexto (ler legados e contratos do spec de QA).
2. Rodar smoke:
   - Verificar `/health` do MOCK-END
   - Verificar rotas principais do N1 por tenant
3. Rodar imagens (modo seguro):
   - Executar pipeline com amostragem 10%
   - Validar atualização do `image` e criação de `CATALOGO/image-meta.json`
4. Rodar n1-qa:
   - Capturar screenshots das rotas críticas
   - Detectar erros de console/404/500 e divergências do planejado
5. Emitir relatório único com evidências e ações recomendadas.

## SAFETY
- Não executar alterações destrutivas sem comando explícito.
- Por padrão, operar em modo seguro (amostragem 10% e sem overwrite massivo).
