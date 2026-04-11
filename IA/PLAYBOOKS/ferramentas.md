# Ferramentas do projeto (Skills + Context7)

## Objetivo
Padronizar como usamos skills (Skills CLI) e Context7 (documentação) para manter consistência, foco e rastreabilidade nas decisões e implementações.

## Skills (nível projeto)

### Regras
- Instalar sempre no nível do projeto (sem `-g`).
- Preferir instalar apenas skills necessárias para o trabalho atual.
- Validar instalação via `npx skills list` e `skills-lock.json`.

### Comandos úteis
- Listar skills instaladas no projeto:
  - `npx skills list`
- Listar skills disponíveis em um repositório (antes de instalar):
  - `npx skills add <owner/repo> --list`
- Instalar uma skill específica no projeto:
  - `npx skills add <owner/repo> --skill <nome-da-skill> -y`
- Remover skills do projeto:
  - `npx skills remove <nome-da-skill>`
- Verificar updates:
  - `npx skills check`
- Atualizar skills:
  - `npx skills update`

### Skills instaladas atualmente (projeto)
Ver: `skills-lock.json` e `.agents/skills/`.

- nextjs-vitest (tenkoh/skills)
- testing-next-stack (hopeoverture/worldbuilding-app-skills)
- nextjs-frontend-testing (henryxv/study-platform)
- nextjs (ovachiever/droid-tings)
- optimized-nextjs-typescript (mindrally/skills)
- senior-frontend (sickn33/antigravity-awesome-skills)

## Context7 (documentação)

### O que é
Context7 é uma fonte de documentação consultável por biblioteca/framework (ex.: Next.js, Vitest, Playwright) para apoiar decisões e implementação com exemplos atualizados.

### Regras
- Não colocar segredos na consulta (keys, tokens, dados sensíveis).
- Sempre preferir queries específicas (ex.: “Playwright config com webServer para Next.js dev server”, não “playwright”).
- Registrar no desenho/relatório as referências usadas (IDs e, quando aplicável, versão).

### Fluxo padrão
1) Resolver o libraryId:
   - Ex.: “Next.js” → `/vercel/next.js`
2) Consultar documentação com query objetiva:
   - Ex.: “Next.js App Router: rotas, route handlers e server actions para dashboard interno”

### Library IDs comuns (referência)
- Next.js: `/vercel/next.js`
- Vitest: `/vitest-dev/vitest`
- Playwright: `/microsoft/playwright`

## Quando usar o quê

### Preferir Skills quando
- O trabalho é recorrente e tem workflow pronto (ex.: setup de testes, padrões de Next.js).
- Queremos consistência de estilo e checklist (menos improviso).

### Preferir Context7 quando
- Precisamos confirmar API atual de uma biblioteca (ex.: mudança de comportamento do Next.js).
- Precisamos de exemplos e detalhes de implementação por versão/feature.

### Preferir WebSearch quando
- A informação não é específica de biblioteca (ex.: comparativo, decisões de alto nível, pesquisa de ferramentas).
- Precisamos descobrir skills novas no catálogo público.

## Rastreabilidade (mínimo)
Para qualquer decisão técnica relevante:
- Citar a fonte (URL do skills.sh ou libraryId do Context7).
- Anotar o motivo curto (por que serve pro objetivo/recurso do desenho).

