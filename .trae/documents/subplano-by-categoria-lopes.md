# Subplano — `/api/produtos/by-categoria/[idCategoria]`

## Objetivo
- Definir implementação do endpoint `GET /api/produtos/by-categoria/[idCategoria]?includeDescendants=0|1&page=&pageSize=` usando back Lopes, mantendo contrato atual do front.

## Contexto Técnico
- Fonte de dados: `getBackListProdutoLoja` em `lib/integration/lopesBackClient.ts`.
- Filtro suportado no back: `idCategoria`.
- Limitação confirmada: endpoint do back **não suporta paginação** nativa.

## Processos Padrão
- Passo 1: chamada no back-end
- Passo 2: tradução
- Passo 3: contrato

## Plano (7 passos)
1) Validar entrada do endpoint:
   - `idCategoria` numérico obrigatório.
   - `includeDescendants` permitido: `0` ou `1`.
   - `page >= 1`, `pageSize` entre `1` e `100`.
2) Executar Passo 1 (chamada no back-end):
   - chamar `getBackListProdutoLoja({ idCategoria })`.
3) Resolver `includeDescendants`:
   - se `includeDescendants=0`: usar somente `idCategoria` solicitado.
   - se `includeDescendants=1`: obter descendentes via árvore de `categorias.json` e chamar back por categoria (merge de resultados).
4) Executar Passo 2 (tradução):
   - traduzir retorno(s) para `Produto[]`.
   - resolver categoria por `categorias.json` e marca por `brands.json`.
   - aplicar fallback `id:0` quando não houver correspondência.
5) Normalizar e deduplicar:
   - deduplicar por `produto.id` após merge de categorias.
6) Aplicar paginação no servidor (porque back não pagina):
   - calcular `total`, `totalPages`.
   - fatiar `data` por `page` e `pageSize`.
7) Executar Passo 3 (contrato):
   - retornar `{ success:true, data, page, pageSize, total, totalPages }` no mesmo shape do endpoint atual.

## Regras Importantes
- Runtime não muda contrato do front.
- Páginação é responsabilidade da API local (não do back Lopes).
- Em erro: retornar `{ success:false, message }` com status coerente.

## Riscos
- `includeDescendants=1` pode aumentar latência por múltiplas chamadas ao back.
- Merge sem deduplicação pode repetir produto em categorias relacionadas.

## Critérios de Pronto
- Endpoint responde com mesmo shape do `/api/produtos/by-categoria/[idCategoria]`.
- `includeDescendants` funciona para `0` e `1`.
- Paginação local funciona e retorna metadados corretos.
- Sem chamadas diretas de API no componente (somente via endpoint/store).
