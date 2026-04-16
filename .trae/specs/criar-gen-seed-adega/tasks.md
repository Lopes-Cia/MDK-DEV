# Tasks
- [x] Task 1: Definir estrutura do projeto GEN-SEED
  - [x] Criar pasta `WWW/MICROSERVICE/GEN-SEED`
  - [x] Adicionar `config.json` com defaults e limites mínimos do desenho
  - [x] Definir ponto de execução do script (Node ESM) e convenções de paths (output relativo ao projeto)

- [x] Task 2: Implementar gerador de categorias (árvore) para adega
  - [x] Implementar `slugify` compatível com o script base
  - [x] Implementar builder de categorias respeitando: >=5 raízes; filhos 3–5; netos 2–4
  - [x] Garantir `id`, `name`, `slug`, `parentId` válidos e `slug` único

- [x] Task 3: Implementar gerador de produtos (>= 120) para adega
  - [x] Implementar catálogo de produtos realista (cervejas/vinhos/destilados/não alcoólicas/conveniência)
  - [x] Distribuir produtos entre categorias netas; garantir >= 120 itens
  - [x] Garantir `id` e `slug` únicos, `categoryId` válido, e regra `(stock > 0) === inStock`
  - [x] Gerar campos no padrão recomendado (sku, brand, unitLabel, sizeLabel, price, compareAtPrice, badges, image, stock, inStock)

- [x] Task 4: Implementar validações e escrita de arquivos
  - [x] Implementar asserts/validações (categorias e produtos) e falhar (throw) em violação
  - [x] Criar diretório de saída (default `./data`) e gravar:
    - [x] `categorias.json`
    - [x] `produtos.json`
  - [x] Imprimir resumo no console (counts) ao final em caso de sucesso

- [x] Task 5: Validação manual orientada
  - [x] Documentar como rodar o gerador (comandos) e o que verificar (counts e integridade dos arquivos)
  - [x] Conferir que a execução gera os dois JSONs e respeita os mínimos (>=5 raízes, árvore correta, >=120 produtos)

# Task Dependencies
- Task 2 depende de Task 1
- Task 3 depende de Task 2
- Task 4 depende de Task 2 e Task 3
- Task 5 depende de Task 4
