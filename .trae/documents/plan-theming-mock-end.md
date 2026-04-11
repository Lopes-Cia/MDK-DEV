# Plano: Theming (Amostras → Artefatos no MOCK-END)

## Resumo
Explodir o fluxo do documento [theming-amostras.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/theming-amostras.md) em microtarefas e, após aprovação, executar criando artefatos de tema por tenant no `MOCK-END`:
- `WWW/MICROSERVICE/MOCK-END/adega-lopes/THEMA/theme.json`
- `WWW/MICROSERVICE/MOCK-END/adega-lopes/THEMA/tokens.css`
- `WWW/MICROSERVICE/MOCK-END/mercearia-lopes/THEMA/theme.json`
- `WWW/MICROSERVICE/MOCK-END/mercearia-lopes/THEMA/tokens.css`

Cada tenant terá **2 opções candidatas** (paleta + fontes + tokens) dentro do `theme.json`, e o `tokens.css` será gerado para a opção marcada como `selected`.

## Estado atual (checado no repo)
- Existe o diretório do mock: `WWW/MICROSERVICE/MOCK-END/` com `CATALOGO/` já gerado para os tenants `adega-lopes` e `mercearia-lopes`.
- Ainda não existe `THEMA/` nesses tenants.
- O documento [theming-amostras.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/theming-amostras.md) já contém:
  - fluxo obrigatório: Huemint/Khroma → Fontjoy → Realtime Colors
  - template de saída final do tema
  - amostras de categoria + produtos para validar no Realtime Colors
  - indicação para salvar o resultado no `MOCK-END/<tenant>/THEMA/`

## Restrições (obrigatórias)
- Usar o fluxo e as ferramentas:
  - Huemint/Khroma para paletas UI-friendly
  - Fontjoy para pares de fontes (Display + Texto/UI) do Google Fonts
  - Realtime Colors para validar paleta + tipografia em UI real
- Sem dependências novas no repo (geração/validação com Node puro, se necessário).

## Decisões (travadas)
- Tenants: `adega-lopes` e `mercearia-lopes`.
- Artefatos por tenant: `theme.json` + `tokens.css`.
- Conteúdo inicial: **2 opções por tenant** (candidatos) para facilitar decisão/ajuste.

## Proposta de formato (artefatos)
### `theme.json`
- Estrutura:
  - `tenant`
  - `selected` (id da opção escolhida)
  - `options[]` (2 itens)
    - `id`, `label` (ex.: `A`, `B`)
    - `direction`: `mode`, `temperature`, `vibe`
    - `fonts`: `display`, `text` (Google Fonts)
    - `palette`: `background`, `surface`, `text`, `primary`, `primaryForeground`, `accent`, `accentForeground`, `border`, `muted`
    - `ui`: `radius`, `shadow`
    - `notes`: campo curto para registrar “por que essa opção”

### `tokens.css`
- Um arquivo com:
  - `:root[data-tenant="<tenant>"] { --background: ...; ... }`
  - Variáveis alinhadas à nomenclatura do `theme.json` (sem shadcn específico ainda; apenas tokens do projeto).

## Mudanças propostas (após aprovação)
### 1) Criar estrutura de pastas do tema no MOCK-END
- Criar:
  - `WWW/MICROSERVICE/MOCK-END/adega-lopes/THEMA/`
  - `WWW/MICROSERVICE/MOCK-END/mercearia-lopes/THEMA/`

### 2) Gerar 2 opções candidatas por tenant (obrigatório: Huemint/Khroma + Fontjoy)
- **ADEGA** (direção padrão do doc):
  - `dark-first`, vibe jovem/moderna, acento vibrante
  - Font pairs candidatos (ex.: Space Grotesk/Sora + Inter, via Fontjoy)
  - Paletas candidatas (via Huemint/Khroma)
- **MERCEARIA** (direção padrão do doc):
  - `light-first`, vibe clássico/requintado, acento premium
  - Font pairs candidatos (ex.: Fraunces/Playfair Display + Inter/Source Sans 3, via Fontjoy)
  - Paletas candidatas (via Huemint/Khroma)

Saída:
- Preencher `theme.json` com as 2 opções por tenant (incluindo fontes/paleta/tokens).

### 3) Validar as 2 opções no Realtime Colors (obrigatório) e marcar `selected`
Para cada tenant:
- Colar fontes + paleta no Realtime Colors
- Validar usando os itens do checklist do doc (CTA, preço/promo, texto secundário, estados)
- Marcar `selected` no `theme.json` para a opção vencedora

### 4) Gerar `tokens.css` a partir do `selected`
- Criar `tokens.css` refletindo a opção selecionada em `theme.json`.

### 5) (Opcional, recomendado) Verificação rápida automatizada
Criar um script Node simples (sem deps) para garantir:
- `theme.json` parseável
- `selected` referencia uma opção existente
- todas as cores estão em formato hex (`#RRGGBB`) ou `hsl(...)` (padrão único definido no arquivo)
- `tokens.css` contém o conjunto mínimo de variáveis

## Microtarefas (para virar Todo e executar depois da aprovação)
1. Criar diretórios `THEMA/` para `adega-lopes` e `mercearia-lopes`.
2. Definir schema do `theme.json` (estrutura + chaves).
3. (ADEGA) Gerar 2 paletas no Huemint/Khroma e registrar no `theme.json`.
4. (ADEGA) Gerar 2 pares de fontes no Fontjoy e registrar no `theme.json`.
5. (ADEGA) Validar as 2 combinações no Realtime Colors e definir `selected`.
6. (ADEGA) Gerar `tokens.css` conforme `selected`.
7. (MERCEARIA) Repetir passos 3–6.
8. (Opcional) Criar script de verificação e rodar localmente.

## Critérios de aceite (Pronto quando…)
- Existem os 4 arquivos finais no `MOCK-END/<tenant>/THEMA/`.
- `theme.json` tem 2 opções por tenant e um `selected` válido.
- `tokens.css` contém tokens coerentes com o `selected` (background/surface/text/primary/accent/border/muted + radius/shadow).
- O `selected` foi escolhido após validação no Realtime Colors conforme checklist do doc.

## Como testar localmente (após execução)
- Abrir `theme.json` e `tokens.css` de cada tenant e validar consistência.
- (Se existir script opcional) rodar o script e checar “ok”.
