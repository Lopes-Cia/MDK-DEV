# Plano — Instalar skills (nível projeto) para DEVDASH

## Resumo
Instalar no **nível do projeto** (sem `-g`) um conjunto de skills alinhadas ao DEVDASH, validando via `skills-lock.json` e `.agents/skills/`. Context7 já está disponível via MCP; não há “instalação” adicional a fazer.

## Estado atual (confirmado no repo)
- Skills no projeto: existe [skills-lock.json](file:///c:/LOPES/www/MDK-DEV/skills-lock.json) com 1 skill instalada (`using-superpowers`).
- Pasta de skills do projeto: existe `.agents/skills/` (ex.: `.agents/skills/using-superpowers/`).
- Relatório-base: [relatorio-skills-devdash.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/relatorio-skills-devdash.md).
- Context7: já está habilitado como MCP (não depende de `npx skills add`).

## Decisões que precisam ser fechadas antes de executar
1) Quais skills instalar agora (conjunto exato). (Fechado: Recomendado (6))
2) Método de instalação: `symlink` (padrão) vs `--copy` (mais compatível no Windows). (Fechado: Symlink)
3) Context7: manter como MCP e criar documentação de uso no projeto. (Fechado: criar documentação)

## Proposta (recomendada) — conjunto inicial de instalação
Instalar somente as skills diretamente úteis para **Next.js + testes + padrões** (sem Supabase e sem NestJS/Sentry).

- **Testes (núcleo)**
  - `tenkoh/skills` → `nextjs-vitest`
  - `hopeoverture/worldbuilding-app-skills` → `testing-next-stack`
  - `henryxv/study-platform` → `nextjs-frontend-testing`
- **Padrões/qualidade (referência)**
  - `ovachiever/droid-tings` → `nextjs`
  - `mindrally/skills` → `optimized-nextjs-typescript`
  - `sickn33/antigravity-awesome-skills` → `senior-frontend`

Observação: os 3 primeiros são os mais “acionáveis” (test infra). Os demais são mais “guia/checklist” para revisão e consistência.

## Mudanças propostas (o que vai mudar no repo)
- Atualização de [skills-lock.json](file:///c:/LOPES/www/MDK-DEV/skills-lock.json) com as novas entradas instaladas.
- Inclusão/atualização de pastas em `.agents/skills/<skill>/` conforme instalação.
- Sem alterações em código de aplicação (Next.js) nesta etapa.

## Passos de execução (após sua aprovação do plano)
1) Listar as skills disponíveis em cada repositório (para confirmar o nome exato do “skill slug”):
   - `npx skills add tenkoh/skills --list`
   - `npx skills add hopeoverture/worldbuilding-app-skills --list`
   - `npx skills add henryxv/study-platform --list`
   - `npx skills add ovachiever/droid-tings --list`
   - `npx skills add mindrally/skills --list`
   - `npx skills add sickn33/antigravity-awesome-skills --list`
2) Instalar no **nível projeto** (sem `-g`), sem prompts (`-y`), via **symlink** (padrão):
   - `npx skills add tenkoh/skills --skill nextjs-vitest -y`
   - `npx skills add hopeoverture/worldbuilding-app-skills --skill testing-next-stack -y`
   - `npx skills add henryxv/study-platform --skill nextjs-frontend-testing -y`
   - `npx skills add ovachiever/droid-tings --skill nextjs -y`
   - `npx skills add mindrally/skills --skill optimized-nextjs-typescript -y`
   - `npx skills add sickn33/antigravity-awesome-skills --skill senior-frontend -y`
3) Validar instalação:
   - `npx skills list` (sem `-g`) deve listar as skills do projeto.
   - `skills-lock.json` deve conter todas as skills instaladas.
   - `.agents/skills/` deve conter as pastas das skills novas.
4) Criar documentação no projeto sobre “ferramentas de pesquisa” (Skills + Context7):
   - Criar `IA/PLAYBOOKS/ferramentas.md` com:
     - Como instalar skills no nível do projeto (sem global) + exemplos prontos.
     - Como listar/remover/atualizar skills.
     - Como usar Context7 (resolver libraryId + query-docs) e quando preferir Context7 vs WebSearch.
     - Checklist rápido para pesquisa (evitar redundância, citar fonte).

## Critérios de validação (“pronto”)
- `npx skills list` mostra as skills do projeto instaladas.
- `skills-lock.json` atualizado e consistente.
- `.agents/skills/` contém as skills instaladas.
- Nenhuma instalação global foi feita.
 - Existe `IA/PLAYBOOKS/ferramentas.md` descrevendo Skills + Context7.

## Riscos e mitigação
- **Windows + symlink**: pode falhar sem permissões. Mitigação: usar `--copy`.
- **Nome do skill**: o slug real pode diferir. Mitigação: rodar `--list` antes e ajustar.
