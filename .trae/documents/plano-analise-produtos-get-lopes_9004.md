# Plano — Análise completa “Produtos GET” (Lopes 9004)

## Sumário
Produzir uma análise completa de como acessar **produtos via GET** na API Lopes (9004), baseada **somente** nos artefatos em `DOCS/lopes_9004` (OpenAPI + relatórios locais). A entrega será:

- 1 relatório Markdown com o mapeamento de endpoints, filtros/parâmetros e formatos de resposta (incluindo variações por status code).
- Recortes de schemas em JSON (extraídos do OpenAPI) para referência rápida.

Observação: você pediu para “separar os arquivos de data em outro diretório”, mas na resposta você selecionou **“Não mexer nos arquivos”** — então **não vou mover/renomear nada** em `LEAR_LOPES\data`.

## Estado atual (confirmado por inspeção)
Artefatos disponíveis em `c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\DOCS\lopes_9004`:

- `api-docs.json`: OpenAPI v3 (info versão 2.4.1) com `security` global via header `Authorization`.  
- `endpoints.txt`: índice textual de endpoints (método + path + tag + operationId).
- `AI_GUIDE.md` / `README.md`: orientações de base URL, auth e utilitários de consulta (`openapi-cli.mjs`).
- `contract/report.md`: relatório “BACK ↔ MOCK — 9004”, incluindo lista de “rotas mock-only” (presentes no mock, ausentes no OpenAPI).

Constatações relevantes:

- O OpenAPI aponta `servers[0].url = https://gp.lopesecia.com.br:9005/Servidor`, mas a pasta é rotulada como “9004”. O relatório deve deixar claro que **o path do OpenAPI começa em `/webservice/...`** e o host/porta pode variar por ambiente.
- Há um conjunto de rotas **mock-only** no relatório de contrato com prefixo `/Servidor/webservice/integration/produtos/...` (ex.: `/produtos/by-categoria/*`, `/produtos/by-id/*`, `/produtos/by-slug/*`, `/produtos/categorias`, `/produtos/brands`), que **não aparecem no OpenAPI**.

## Objetivo (o que será considerado “pronto”)
Entregar um documento que responda, para “produtos GET”:

1) Quais endpoints existem (OpenAPI + mock-only, em seções separadas).  
2) Como montar a URL (base + path) e autenticação (`Authorization`).  
3) Quais filtros/parâmetros existem (path params e query params), quais são obrigatórios e tipos (string/number/date).  
4) Formato de response por endpoint (schema e exemplos), incluindo variações por status code quando definido no OpenAPI (ex.: 200/400/401/403/500).  
5) Se existem “várias formas” de request/response (ex.: `getProduto` vs `getListProduto`, variações por loja/preço, etc.).

## Decisões e suposições
- **Escopo OpenAPI vs mock-only:** como a resposta do “Escopo” veio em branco, vou assumir **OpenAPI + mock-only**, mas sempre marcando claramente o que é “contrato oficial (OpenAPI)” vs “rotas existentes no mock (mock-only)”.
- **Sem uso de `LEAR_LOPES\data` na análise:** por sua restrição (“apenas analisar as informações encontradas nessa página”), vou basear a análise no OpenAPI + docs do diretório `DOCS/lopes_9004`. O relatório pode citar o `contract/report.md` por estar dentro do mesmo diretório.
- **Sem mudanças nos arquivos de data:** não mover/copiar/renomear `LEAR_LOPES\data`.

## Mudanças propostas (arquivos)
1) Criar um relatório:
   - `c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\DOCS\lopes_9004\PRODUTOS_GET.md`
   - Conteúdo:
     - Base URL & Auth (com nota 9004 vs 9005).
     - Tabela de endpoints GET do OpenAPI relacionados a Produto (tag “Produto” + correlatos necessários como Categoria/Variante quando aplicável).
     - Para cada endpoint: método/path, operação, parâmetros (filtros), exemplos de request (HTTP), responses (schemas + status codes).
     - Seção separada “Rotas mock-only (fora do OpenAPI)” listando as rotas de produtos do `contract/report.md` com observações de risco (não contratual).

2) Gerar recortes de schemas do OpenAPI em JSON (somente os que forem necessários para “produtos GET”):
   - Pasta sugerida: `c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\DOCS\lopes_9004\schemas\`
   - Arquivos (nomes podem ajustar conforme o OpenAPI nomear os schemas):
     - `schemas/Product.json`
     - `schemas/Category.json`
     - `schemas/Brand.json`
     - `schemas/PaginatedList.json` (se existir wrapper de paginação)
     - `schemas/Error.json` (se houver schema de erro padrão)

3) (Opcional, se fizer sentido durante a extração) gerar um índice filtrado:
   - `c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\DOCS\lopes_9004\endpoints.produtos.get.txt`
   - Somente endpoints GET relacionados a “Produto” (OpenAPI).

## Como vou extrair as informações (procedimento)
1) Mapear no `api-docs.json` todos os paths cujo `tags` incluam `Produto` e que tenham método `GET`.
2) Para cada endpoint encontrado:
   - Listar parâmetros:
     - `in: query` (filtros) e `in: path` (identificadores),
     - `required`, `schema.type`, `format`, `enum` (se existir),
     - defaults e descrições.
   - Mapear responses (`responses`):
     - status codes definidos,
     - `content.application/json.schema` (refs e objetos),
     - exemplos (se existirem).
3) Identificar “formas diferentes” de obter produto:
   - detalhamento por ID vs lista (ex.: `getProduto` vs `getListProduto`),
   - variações por contexto (loja, preço, categoria, marca, variantes) conforme existirem no OpenAPI.
4) Ler `contract/report.md` e extrair **somente** as rotas “mock-only” relacionadas a produtos (GET), listando-as numa seção separada.
5) Gerar os recortes de schema (resolver `$ref` e salvar JSON reduzido por entidade).

## Validação (sem rodar testes automáticos)
- Conferir consistência: todo endpoint citado no relatório deve estar presente em `api-docs.json` (ou claramente marcado como mock-only via `contract/report.md`).
- Conferir que todo parâmetro/filtro listado aparece no OpenAPI com tipo/required correto.
- Conferir que os schemas recortados batem com o que o endpoint referencia (mesmo `$ref`/estrutura).

## Riscos / limitações
- O OpenAPI pode não ter exemplos de payload; nesse caso o relatório fica baseado no schema e na descrição do endpoint.
- O host/porta “9004 vs 9005” pode ser divergência de ambiente; o relatório vai orientar como montar URL e destacar a origem do dado (campo `servers` do OpenAPI).

