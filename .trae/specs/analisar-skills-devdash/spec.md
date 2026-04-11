# Spec: Análise de Skills para MICROSERVICE-DEVDASH

## Why
Precisamos escolher, entre vários links do skills.sh, quais skills realmente ajudam a construir o DEVDASH (dashboard interno de desenvolvimento/testes) sem redundância e com foco no que foi definido no desenho.

## What Changes
- Criar um relatório de análise dos links de skills (skills.sh) listados no desenho.
- Recomendar um conjunto enxuto de skills para instalar (com justificativas e sobreposições).
- Documentar quais skills ficam fora de escopo para o DEVDASH e por quê.

## Impact
- Affected specs: pesquisa/decisão de ferramentas (skills) para o DEVDASH
- Affected code: nenhum (somente documentação neste change)
- Arquivo de saída: `IA/DESENHOS/relatorio-skills-devdash.md`

## ADDED Requirements
### Requirement: Relatório de skills
O sistema SHALL gerar um relatório em `IA/DESENHOS/relatorio-skills-devdash.md` analisando os links informados no desenho do DEVDASH.

#### Scenario: Análise e recomendação
- **WHEN** o usuário solicitar a análise dos links `MICROSERVICE-DEVDASH.md#L16-L24`
- **THEN** o relatório DEVE conter:
  - Uma seção por link com: objetivo da skill, quando usar, quando não usar, e pontos de atenção.
  - Uma matriz de aderência ao DEVDASH (Objetivo e Recursos: mock-server, builder/bricks (Puck), testes automatizados, scrapper, seeding).
  - Um resumo final com:
    - “Recomendadas para instalar agora”
    - “Úteis, mas opcionais”
    - “Fora de escopo por enquanto”
  - Notas de sobreposição (skills que cobrem a mesma coisa) e risco de redundância.
  - Comandos sugeridos de instalação (apenas como texto; não executar instalação neste change).

### Requirement: Fontes e rastreabilidade
O sistema SHALL citar explicitamente quais fontes foram usadas para cada análise.

#### Scenario: Fontes por item
- **WHEN** uma skill for analisada
- **THEN** a seção correspondente DEVE indicar a URL do skills.sh e, quando aplicável, IDs de bibliotecas do Context7 usados como referência.

## MODIFIED Requirements
Nenhum.

## REMOVED Requirements
Nenhum.

