# Tasks
- [ ] Pesquisa e desenho do pipeline (scraping + IA)
  - [ ] Mapear fontes e restrições (API-first vs scraping) e registrar termos de busca e trade-offs
  - [ ] Definir 2 estratégias mínimas (A: background HTTP; B: Playwright) e 1 opcional (C: OG/JSON-LD)
  - [ ] Definir critérios de validação de imagem (MIME, dimensões mínimas, peso máximo, dedupe por hash)

- [ ] Definir contrato de arquivos e caminhos
  - [ ] Definir onde salvar imagens baixadas por tenant (ex.: `MOCK-END/<tenant>/THEMA/assets/...` ou equivalente)
  - [ ] Definir como escrever o campo `image` no JSON (URL externa vs path local padronizado)
  - [ ] Definir formato de metadados de rastreio (ex.: `imageMeta` ou arquivo auxiliar por tenant)

- [ ] Implementar scripts (scraping)
  - [ ] Script: iterar tenants e ler `CATALOGO/produtos.json` e `CATALOGO/categorias.json`
  - [ ] Script: resolver query por item (produto/categoria) e coletar candidates por estratégia
  - [ ] Script: baixar/normalizar imagem (extensão, nome, dedupe, overwrite controlado)
  - [ ] Script: atualizar JSON (somente campos `image` e metadados definidos)

- [ ] Implementar scripts (IA para banners/criativos)
  - [ ] Definir gerador de prompts baseado em categoria + contexto/branding (sem texto na imagem)
  - [ ] Integrar geração por IA (via API) com chave em env (sem commitar)
  - [ ] Salvar assets gerados e atualizar JSON alvo (definido no contrato)

- [ ] Guardrails e validação manual
  - [ ] Respeitar rate limit (delays/backoff), cache e poison-pill detection (403/429/captcha)
  - [ ] Verificar que o MOCK-END continua consistente (JSON válido; nenhuma chave removida)
  - [ ] Registrar relatório final em `IA/` (fontes, resultados, falhas, próximos passos)

# Task Dependencies
- Contrato de caminhos/metadados depende do desenho do pipeline.
- IA depende de decidir o modelo/API e variáveis de ambiente.
