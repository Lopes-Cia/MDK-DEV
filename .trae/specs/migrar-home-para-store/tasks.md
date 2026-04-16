# Tasks

- [x] Task 1: Auditar home atual e mapear contratos visuais/dados
  - [x] Inventariar seções da home (`banner`, `categorias destaque`, `mais vendidos`, `promoções`, demais blocos)
  - [x] Identificar origem atual dos dados por seção (estático vs API/store)
  - [x] Definir mapeamento seção -> chave do payload `home`

- [x] Task 2: Definir estratégia de reuso de componentes
  - [x] Revisar componentes atuais de card de produto
  - [x] Revisar componentes atuais de card de categoria
  - [x] Revisar componentes atuais de carrossel
  - [x] Decidir por seção: `reusar`, `adaptar`, ou `criar novo`

- [x] Task 3: Preparar camada de transformação de dados (view-model)
  - [x] Criar mapeadores para transformar payload de `home` em props dos componentes
  - [x] Cobrir variações de payload (campos ausentes/arrays vazios)
  - [x] Definir defaults de exibição para fallback visual

- [x] Task 4: Integrar home ao `ecommerce-store` sem alterar design
  - [x] Conectar `app/(shop)/page.tsx` ao `ecommerce-store` com `loadHome()`
  - [x] Trocar dados estáticos das seções cobertas por dados do store
  - [x] Manter estrutura e hierarquia visual atuais

- [x] Task 5: Garantir estados de experiência (loading/empty/error)
  - [x] Implementar loading por seção (ou global) sem quebrar layout
  - [x] Implementar fallback de estado vazio por seção
  - [x] Implementar feedback de erro com mensagem amigável e log técnico mínimo

- [ ] Task 6: Validar fluxo manual na rota principal
  - [ ] Verificar banners carregando de `/api/ecommerce/home`
  - [ ] Verificar categorias destaque no mesmo padrão visual atual
  - [ ] Verificar seções de produtos (mais vendidos/promoções) com dados do store
  - [ ] Validar ausência de fetch direto para endpoints de domínio em componentes

# Task Dependencies
- Task 2 depende de Task 1
- Task 3 depende de Task 1
- Task 4 depende de Task 2 e Task 3
- Task 5 depende de Task 4
- Task 6 depende de Task 5
