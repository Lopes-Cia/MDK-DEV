# Proposta: Estrutura de diretórios (organização do projeto)

## Recomendação (1 opção)
- Use `src/` para concentrar código de produto e manter a raiz limpa (configs, docs, automações). Facilita escalar e evita “poluição” no root quando o projeto cresce. Mantém padrão fácil de navegar para humanos e para IA.

## Estrutura Proposta (dir/subdir + readme.md + LEGADO/)
```txt
/
  IA/
    readme.md
    LEGADO/
    AGENTS/
      readme.md
      LEGADO/
    CONTEXTO/
      readme.md
      LEGADO/
    DECISOES/
      readme.md
      LEGADO/
    PLAYBOOKS/
      readme.md
      LEGADO/
    PROMPTS/
      readme.md
      LEGADO/
    SESSOES/
      readme.md
      LEGADO/

  WWW/
    REFERENCIAS/
      readme.md

  docs/
    readme.md
    LEGADO/

  scripts/
    readme.md
    LEGADO/

  src/
    readme.md
    LEGADO/

    app/
      readme.md
      LEGADO/
      (rotas do Next.js App Router)

    components/
      readme.md
      LEGADO/
      ui/
        readme.md
        LEGADO/
      shared/
        readme.md
        LEGADO/

    features/
      readme.md
      LEGADO/
      exemplo-feature/
        readme.md
        LEGADO/
        components/
          readme.md
          LEGADO/
        actions/
          readme.md
          LEGADO/
        api/
          readme.md
          LEGADO/
        schemas/
          readme.md
          LEGADO/
        types/
          readme.md
          LEGADO/

    lib/
      readme.md
      LEGADO/
      (helpers, clients, utils, invariantes)

    services/
      readme.md
      LEGADO/
      (integrações externas: http, sdk, gateways)

    store/
      readme.md
      LEGADO/
      (estado client quando existir)

    styles/
      readme.md
      LEGADO/

    types/
      readme.md
      LEGADO/

    tests/
      readme.md
      LEGADO/
```

## Nomenclatura (curta e consistente)
- Diretórios: `kebab-case` (ex.: `exemplo-feature`, `user-settings`)
- Componentes: `PascalCase.tsx`
- Arquivos utilitários: `camelCase.ts` ou `kebab-case.ts` (escolha 1 e mantenha)
- `LEGADO/`: só “quarentena”, sem import novo; tudo que cair ali precisa ter motivo no readme do diretório pai.

## Template mínimo do `readme.md` (IA-first)
```md
# <nome-do-diretório>

## Objetivo
- O que este diretório contém e por quê existe.

## Responsabilidades / Limites
- Faz:
- Não faz:
- Dono do domínio (se aplicável):

## Como usar
- Entradas principais:
- Saídas/contratos (tipos, funções, rotas):

## Regras locais
- Convenções (naming, padrões, validação, erros):

## Arquivos-chave
- Lista curta do que é “fonte da verdade”.

## LEGADO
- O que vai para LEGADO e critérios para remover/migrar.
```

## Pasta `/IA` (uso exclusivo do agente)
- Guardar somente artefatos de trabalho/coordenação da IA: contexto do projeto, decisões, playbooks, prompts, sessões, checklist de qualidade.
- Não colocar código de runtime/app dentro de `/IA` (evita mistura e risco de dependência acidental).

## Pasta `/WWW/REFERENCIAS`
- Destinada exclusivamente ao clone e análise de projetos e referências de terceiros.
- Não importe arquivos diretamente dela para o código de produção (`src/`). Código útil deve ser copiado e adaptado.

