# Tasks

- [x] Task 1: Definir contrato de `path` por entidade
  - [x] Confirmar padrões: produto `/produtos/<slug>`, categoria `/categoria/<slug>`, marca `/marca/<slug>`
  - [x] Definir regra de fallback quando `slug` estiver vazio (não gerar `path`)

- [x] Task 2: GEN-SEED — gerar `path` em produtos/categorias/marcas
  - [x] Incluir `path` em cada categoria gerada
  - [x] Incluir `path` em cada produto gerado
  - [x] Incluir `path` em `brand` (objeto) e no `brands.json`
  - [x] Garantir que `colections.json` reflita `path` nos itens (produtos/categorias/banners se aplicável)

- [x] Task 3: Atualizar JSONs já versionados no repositório (modo rápido)
  - [x] Atualizar `WWW/MICROSERVICE/GEN-SEED/data/*.json` (incluindo `colections.json`)
  - [x] Copiar/atualizar os JSONs correspondentes em `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/handlers/mock/*.json`

- [x] Task 4: Mock-end — garantir normalização no runtime (se necessário)
  - [x] Diretriz aplicada: sem normalização/compatibilidade legado em runtime
  - [x] Garantir que `path` exista em resposta de `by-id`, `by-slug`, `by-categoria`, `categorias`, `categoriaById`, `brands`, `brandById`, `home`

- [x] Task 5: Front (referência) — usar `path` ao gerar links
  - [x] Atualizar cards/links de categoria da home para usar `category.path` quando existir
  - [x] Atualizar cards/links de produto para usar `product.path` quando existir (sem alterar layout)

- [x] Task 6: Validação manual
  - [x] Verificar no painel `/dev` os payloads contendo `path`
  - [x] Verificar que links de categoria/produto navegam para rota amigável (quando existir)

## Nota de Refatoração
- Escopo aplicado em modo rápido: sem regenerar JSON e sem compatibilidade com rota legada no front.
- Ajustes manuais em JSON permanecem como fonte da verdade até consolidar fluxo definitivo no gerador.

# Task Dependencies
- Task 2 depende de Task 1
- Task 3 depende de Task 2
- Task 4 pode rodar em paralelo com Task 3 (se necessário)
- Task 5 depende de Task 3
- Task 6 depende de Task 5
