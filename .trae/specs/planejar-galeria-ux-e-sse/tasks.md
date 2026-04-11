# Tasks
- [ ] Marcar “próximos avanços” no microservice (documental)
  - [ ] Registrar no spec que os próximos avanços são: Galeria de UX e SSE
  - [ ] Definir escopo mínimo (MVP) e fora de escopo para cada um

- [ ] Galeria de UX — desenho do recurso
  - [ ] Definir taxonomia do catálogo (padrões por categoria: navegação, forms, feedback, dados)
  - [ ] Definir “contrato” de cada item (nome, objetivo, estados, acessibilidade, origem)
  - [ ] Definir quais componentes/padrões do DevDash entram primeiro (monitores, TopNav, cards-link)

- [ ] Pesquisa de registries (2ª referência via shadcn directory)
  - [ ] Selecionar 1 registry alternativo do diretório com base no critério do spec
  - [ ] Registrar 1–3 componentes alvo desse registry para validar valor (ex.: menu, table, drawer)
  - [ ] Documentar comando padrão do CLI para adicionar (`npx shadcn add @<registry>/<component>`)

- [ ] SSE — desenho do recurso
  - [ ] Definir eventos SSE mínimos (tipo, payload, frequência, reconexão)
  - [ ] Definir endpoints SSE pro DevDash (por domínio: mockend, n1/tenant, jobs)
  - [ ] Definir integração: store conecta no SSE e atualiza estado; UI só renderiza
  - [ ] Definir fallback para polling e critérios de troca (SSE indisponível/erro)

# Task Dependencies
- Pesquisa de registry alternativo alimenta a Galeria de UX.
- SSE depende do desenho do contrato de eventos (antes de qualquer implementação).
