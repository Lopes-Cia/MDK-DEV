# Tasks

- [x] Pesquisa (base) — antes de travar contratos
  - [x] Mapear estratégias A/B/C, riscos e trade-offs (rascunho)
  - [x] Pesquisar “fórmulas” mais maduras para cada estratégia (anti-bot, rate-limit, dedupe, validação) e consolidar em `IA/` (1 doc por assunto)

- [ ] Contratos (Fechados/Obrigatórios antes de codar)
  - [x] Definir storage físico por tenant (`THEMA/assets/images/produtos|categorias`)
  - [x] Definir semântica do campo `image` e desafio do arquivo: slug + short-hash (`path estável`, ex: `produto-x-1a2b3c.webp`), e fallback opcional (URL externa)
  - [x] Definir formato e local de metadados (arquivo auxiliar `CATALOGO/image-meta.json` por tenant)

- [x] MOCK-END: CRUD controlado de JSON e upload de Assets (suporte)
  - [x] Expor endpoints CRUD por tenant (ler/escrever/listar/remover) com allowlist e bloqueio de path traversal
  - [x] Padronizar erros (`invalid_json`, `payload_too_large`, `invalid_path`) e métodos permitidos (GET/PUT/DELETE/OPTIONS)
  - [x] **Novo Endpoint Assets**: Permitir upload/salvamento binário na pasta `THEMA/assets/images/` para suportar o scraper

- [x] Microservice 1: `image-scraper` (scraping)
  - [x] Criar estrutura em `WWW/MICROSERVICE/image-scraper` (package.json, scripts, README mínimo)
  - [x] Implementar execução (CLI e/ou endpoint HTTP) + relatório de execução
  - [x] Implementar config via env (URL do MOCK-END, limites, modo seguro 10%)
  - [x] Implementar pipeline A/B (e C opcional): buscar candidates, validar, baixar/normalizar, dedupe
  - [x] Atualizar JSON via CRUD do MOCK-END (somente `image` + metadados definidos)
  - [x] Implementar placeholder por tenant quando falhar (A/B/C)
  - [x] Implementar guardrails: amostragem 10%, fail-fast por item e cooldown por domínio

- [x] Microservice 2: `ia-image-generator` (banners/criativos)
  - [x] Criar estrutura em `WWW/MICROSERVICE/ia-image-generator` (package.json, scripts, README mínimo)
  - [x] Implementar gerador de prompts baseado em categoria + contexto/branding (sem texto na imagem)
  - [x] Gerar manifesto de prompts por tenant (mesmo sem chave)
  - [x] Integrar geração por IA via API (chave em env; sem commitar segredo)
  - [x] Salvar assets gerados e registrar no JSON alvo (conforme contrato)

- [x] Microservice 3: `sse-hub` (SSE)
  - [x] Criar estrutura em `WWW/MICROSERVICE/sse-hub` (package.json, scripts, README mínimo)
  - [x] Definir contrato de eventos (tipos, payload mínimo, heartbeat, reconexão)
  - [x] Implementar endpoint SSE (`GET /events`) com heartbeat e canais
  - [x] Implementar endpoint de publish interno (`POST /publish`) ou integração equivalente
  - [x] Planejar consumo no DevDash via store + fallback para polling

- [x] Validação documental (sem testes automáticos)
  - [x] Registrar pesquisa final em `IA/` (fontes, resultados, falhas, próximos passos)
  - [x] Garantir que o spec e tasks não tenham duplicações/legado conflitante

# Task Dependencies

- Contratos de storage/path/metadados estão **fechados** (ver Tasks).
- `sse-hub` depende do contrato de eventos e do plano de consumo no DevDash (store + fallback).
