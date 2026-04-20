# Subplano — Operação dos arquivos locais (`categorias.json` e `brands.json`)

## Objetivo
- Definir como operar os snapshots locais para reduzir dependência do back em runtime e manter contrato idêntico ao `/api/produtos/*`.

## Processos Padrão (nomenclatura)
- Passo 1: chamada no back-end
- Passo 2: tradução
- Passo 3: contrato

## Escopo dos Arquivos
- Categorias: `lib/mockups/data/categorias.json` (formato `Categoria[]`)
- Brands: `lib/mockups/data/brands.json` (formato `Brand[]`)
- Controle de atualização: `lib/mockups/data/update-control.json`

## Status Atual (Categorias)
- Passo 1 (chamada no back-end) de categorias já foi feito.
- Passo 2 (tradução) de categorias também já foi feito.
- Definição da rotina de atualização:
  - executar Passo 1 + Passo 2 para obter o retorno final de atualização
  - salvar esse retorno no snapshot local `categorias.json`
- Referência do que foi implementado:
  - chamada real via `getBackListCategoria()` em `lib/integration/lopesBackClient.ts`
  - tradução em `lib/mockups/syncDataFromBackToFront.ts` (`translateLopesCategoriasToCategorias`)
  - rota de integração já funcional em `/api/lopes/categorias`
- Próximo uso no subplano:
  - reaproveitar Passo 1 + Passo 2 para atualizar o snapshot `categorias.json` quando necessário.

## Plano (6 passos)
1) Padronizar leitura em runtime:
   - Endpoints `/api/lopes/produtos/categorias*` leem `categorias.json`.
   - Endpoints `/api/lopes/produtos/brands*` leem `brands.json`.
2) Padronizar atualização fora da navegação (job agendado):
   - Um job/cron executa Passo 1 + Passo 2 em janela definida (ex.: 6h ou 24h).
   - Ao concluir, salva `categorias.json` e atualiza `update-control.json`.
   - Runtime dos endpoints não dispara atualização; apenas consome JSON local.
   - Para brands: usar `brands.json` como fonte local fixa, sem atualização automática nesta fase.
3) Garantir validação mínima de schema antes de publicar snapshot:
   - Categorias: `id,name,slug,parentId,image,order` + presença de `id:0`.
   - Brands: `id,name,slug,image` + presença de `id:0`.
4) Definir regra de publicação:
   - Publicar snapshot somente após validação passar.
   - Versionar alterações do snapshot para rastreabilidade.
5) Definir rollback operacional:
   - Em falha de atualização, manter último snapshot válido.
   - Não alterar contrato dos endpoints durante falha operacional.
6) Fechar com validação de contrato:
   - Confirmar Passo 3 (contrato): `/api/lopes/produtos/*` retorna o mesmo shape de `/api/produtos/*` (sucesso e erro).

## Fluxo de Controle (24h)
- Estrutura sugerida de `update-control.json`:
  - `lastUpdateAt`: string ISO da última atualização bem-sucedida de categorias.
  - `version`: inteiro de controle do schema do arquivo de controle.
- Regra operacional:
  - Job agendado executa Passo 1 + Passo 2.
  - Atualização concluída grava novo `lastUpdateAt`.
  - Runtime não atualiza; somente lê `categorias.json`.

## Pontos de Ajuste (abertos para decisão)
- Frequência de atualização de `categorias.json` (manual, diário, sob demanda).
- `brands.json` sem rotina de atualização por enquanto (somente consumo local).
- Regras de conflito de IDs para brands (manter estabilidade de `idBrand`).
