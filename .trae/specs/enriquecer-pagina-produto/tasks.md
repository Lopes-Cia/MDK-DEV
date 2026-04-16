# Tasks

- [ ] Analisar página antiga de produto (`/products/[id]/[slug]`)
  - [x] Mapear todos os blocos de UI usados: ImageViewer, ProductSummary, ProductActivity, ProductInfo.
  - [x] Levantar quais campos de dados cada bloco espera (ex.: specs, ingredientes, aviso legal, brand, shop).
  - [x] Comparar com o payload atual de `loadProdutoBySlug` usado em `produto-client.tsx`.

- [x] Analisar página antiga de produto (`/products/[id]/[slug]`)

- [x] Definir view model de produto para `/produtos`
  - [x] Desenhar estrutura de view model unificado (id, name, slug, images, price, oldPrice, category, brand, textos e specs).
  - [x] Descrever claramente, no código de `produto-client.tsx`, a função responsável por montar esse view model a partir de `rawProduct`.
  - [x] Planejar como lidar com campos ausentes (fallbacks textuais/imagem).

- [x] Listar campos faltantes em `/IA/DESENHOS/falta-produto.md`
  - [x] Criar o arquivo `IA/DESENHOS/falta-produto.md` se não existir.
  - [x] Adicionar seção listando campos esperados pelo view model que hoje não existem no payload ou vêm “degradados”.
  - [x] Para cada campo, registrar breve descrição, tipo esperado e exemplo de valor.

- [x] Duplicar componentes de produto para o contexto de `/produtos`
  - [x] Criar pasta de componentes de produto para `/produtos` (ex.: `app/(shop)/produtos/_components` ou equivalente).
  - [x] Copiar `ImageViewer`, `ProductSummary`, `ProductActivity`, `ProductInfo` de `products/[id]/_components` para a nova pasta.
  - [x] Remover dependências do view model antigo nesses novos componentes, adaptando as props para receber o novo view model.

- [x] Refatorar `produto-client.tsx` para usar os novos componentes e view model
  - [x] Usar o view model unificado para alimentar ImageViewer, Summary, Activity e Info.
  - [x] Garantir que os estados `loading/empty/error` continuem funcionando corretamente.
  - [x] Garantir que o breadcrumb e a navegação permanecem alinhados com o uso de slug.

- [x] Implementar bloco de marca (logo + link)
  - [x] A partir de `rawProduct.brand` (ou estrutura equivalente), extrair `name`, `slug`, `image`.
  - [x] Adicionar um bloco visual na página de produto com miniatura da marca e link para `/marca/<slug>`.
  - [x] Implementar fallback visual quando imagem ou slug estiverem ausentes (texto e/ou placeholder).

- [x] Implementar fallbacks para campos textuais e specs
  - [x] Atualizar ProductSummary/ProductInfo para tratarem strings vazias ou nulas com mensagens padrão.
  - [x] Ao não haver especificações técnicas, exibir mensagem amigável em vez de tabela vazia.
  - [x] Garantir que a ausência de dados não gera erros de runtime nem quebra layout.

- [x] Alinhar rotas e links com a experiência final
  - [x] Garantir que cards, listagens de categoria/marca e demais pontos da loja apontem para `/produtos/<slug>`.
  - [x] Verificar que `/products` permanece apenas como referência/rota de legado (sem dependência da nova implementação).

- [x] Validação manual e ajustes finos
  - [x] Testar fluxo completo: navegação catálogo → categoria → produto → marca → produto.
  - [x] Conferir visualmente a página de produto comparando com a versão antiga para garantir que não houve regressões relevantes.
  - [x] Anotar gaps adicionais de dados encontrados e acrescentar em `falta-produto.md` se necessário.

# Task Dependencies

- A tarefa “Definir view model de produto para `/produtos`” depende de “Analisar página antiga de produto”.
- A tarefa “Duplicar componentes de produto para o contexto de `/produtos`” depende de “Definir view model de produto para `/produtos`”.
- A tarefa “Refatorar `produto-client.tsx` para usar os novos componentes e view model” depende de:
  - “Definir view model de produto para `/produtos`”
  - “Duplicar componentes de produto para o contexto de `/produtos`”.
- A tarefa “Implementar bloco de marca (logo + link)” depende de “Definir view model de produto para `/produtos`”.
- A tarefa “Implementar fallbacks para campos textuais e specs” depende de “Definir view model de produto para `/produtos`” e de já haver componentes duplicados.
