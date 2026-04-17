## Resumo

Criar um sistema de “Meus Pedidos” no ecommerce (área do cliente) com:
- 1 página de lista com tabela moderna e filtros.
- 1 página de detalhe do pedido com visualização rica (itens, entrega, pagamento, resumo).

Base de dados: BFF do Next já expõe `GET /api/pedidos` (lista por clienteId) e `GET /api/pedidos/:pedidoId` (detalhe), que por sua vez integra com o MOCK-END.

## Análise do Estado Atual (repo)

### UI atual (cliente/meus-pedidos)
- Página atual: `WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-pedidos/page.tsx`
- Hoje renderiza apenas `lastDraft` do `pedidos-store` e ainda mostra JSON bruto (debug), sem lista, sem navegação de detalhe.

### Integração existente (BFF + integration)
- BFF:
  - `app/api/pedidos/route.ts` (lista via query: clienteId/page/pageSize)
  - `app/api/pedidos/[pedidoId]/route.ts` (detalhe por pedidoId)
- Integration service: `lib/integration/checkoutService.ts` possui `listPedidos()` e `getPedido()`.
- Store de checkout: `stores/pedidos-store.ts` já busca `GET /api/pedidos/:pedidoId` ao finalizar checkout (para montar `lastDraft`).

### Shadcn/ui no projeto
- `components.json` existe e está configurado (style new-york, rsc true).
- `components/ui` ainda tem poucos componentes (não há `table`, `badge`, `card`, `input`, `tabs`, `skeleton`, etc.).

## Proposta (UX/UI + Arquitetura)

### 1) Dados/Store (fonte única de verdade)
Objetivo: não fazer fetch direto no componente; a página consome estado reativo do store.

Alterar `WWW/REFERENCIAS/connect-ecommerce/stores/pedidos-store.ts` para adicionar:
- Estado de listagem:
  - `pedidosStatus: "idle" | "loading" | "success" | "error"`
  - `pedidosError: string | null`
  - `pedidos: PedidoResumoUI[]`
  - `page`, `pageSize`, `total`, `totalPages`
  - `selectedPedido: PedidoDetalheUI | null` + `selectedStatus/error`
- Ações:
  - `loadPedidosByCliente({ clienteId, page, pageSize })` -> chama `apiClient("pedidos?clienteId=...")`
  - `loadPedidoById(pedidoId)` -> chama `apiClient(\`pedidos/${pedidoId}\`)`
  - `resetPedidosList()` / `resetSelectedPedido()` (opcional)

Mapeamento de dados:
- Converter payload `unknown` em um shape UI-safe (fallbacks), baseado no contrato do MOCK-END:
  - `pedidoId`, `status`, `createdAt`, `resumo.total`, `resumo.moeda`
  - `itens.length`, soma quantidades
  - `entrega.endereco.cidade/uf`, `freteSelecionado.nome/prazoDias/preco`
  - `pagamento.metodo`, `pagamento.status`, `pix.copiaECola/expiresAt` (quando existir)

### 2) Página Lista (tabela moderna + filtros)
Arquivo alvo:
- `WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-pedidos/page.tsx` (substituir implementação atual)

Comportamento:
- Se não estiver logado: mesma estratégia do checkout (modal confirm + redirect /login).
- Ao montar: resolve `clienteId` a partir de `useClientesStore().loginData` e chama `loadPedidosByCliente`.
- Filtros client-side (rápidos e UX-friendly):
  - Busca por pedidoId + nome de item (quando disponível no payload).
  - Filtro de status (dropdown).
  - Ordenação padrão: mais recentes primeiro (createdAt desc).
- Paginação:
  - Usar `page/pageSize/totalPages` vindos do endpoint.
  - Controles “Anterior/Próxima” + seletor de pageSize (20/50).

Colunas recomendadas (UX) — ordem:
1) **Pedido**: `#<pedidoId>` + botão de copiar.
2) **Data**: `createdAt` formatado pt-BR (ex.: 17/04/2026 00:12).
3) **Status**: `Badge` colorida (pago/pendente/cancelado/etc.).
4) **Total**: `formatCurrency(total)` (com destaque visual).
5) **Itens**: contador + “pill” (Badge/Chip).
6) **Pagamento**: método (Pix) + status (Badge menor).
7) **Entrega**: cidade/UF + frete (nome + prazo) em linha secundária.
8) **Ações**: `DropdownMenu` com “Ver detalhes”.

Responsivo:
- Mobile: mostrar **Pedido / Status / Total / Ações** (e mover “Data/Itens” para uma linha secundária dentro da célula Pedido).
- Desktop: mostrar todas as colunas acima.

Componentização:
- Criar `app/(shop)/cliente/meus-pedidos/_components/OrdersTable.tsx` (client) para isolar UI.
- Criar `app/(shop)/cliente/meus-pedidos/_components/OrdersFilters.tsx` (client) para filtros + busca.

Estados:
- Loading: `Skeleton` e placeholders.
- Empty: card/empty-state com CTA “Voltar às categorias”.
- Error: `Alert` (ou card com estilo de erro) + botão “Tentar novamente”.

### 3) Página Detalhe (visualização rica do pedido)
Arquivo novo:
- `WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-pedidos/[pedidoId]/page.tsx`

Comportamento:
- Garante login (mesma estratégia).
- Carrega o pedido pelo `pedidoId` via store (`loadPedidoById`).

Layout (shadcn + UX):
- Cabeçalho com `Breadcrumb` + título “Pedido #X” + `Badge` de status.
- Blocos em cards:
  - **Resumo**: Total / Itens / Data.
  - **Entrega**: endereço + frete selecionado.
  - **Pagamento**: método + status + (se Pix) “copia e cola” com botão de copiar.
- Itens do pedido em tabela:
  - miniatura (img), nome, quantidade, preço unitário, subtotal.
- Seções organizadas por `Tabs` (ex.: Itens / Entrega / Pagamento) ou layout em colunas no desktop.

### 4) Componentes shadcn/ui a adicionar (sem TanStack Table)
Para atender a exigência de “usar shadcn/ui” com UI profissional, instalar/gerar componentes base via CLI do shadcn:
- `table`
- `badge`
- `card`
- `input`
- `separator`
- `tabs` (se adotarmos tabs no detalhe)
- `skeleton`
- `alert` (para erro) (opcional)

Decisão: não usar “Data Table” do TanStack para evitar dependência nova (`@tanstack/react-table`). A tabela será `Table` (shadcn) + filtros/ordenação simples em React.

### 5) Reaproveitamento do dashboard (opcional)
Reutilizar padrões visuais do `app/dashboard/orders/page.tsx` (tipografia, header, cards de KPI), sem depender do mockOrders.

## Arquivos que serão alterados/criados

Alterar:
- `WWW/REFERENCIAS/connect-ecommerce/stores/pedidos-store.ts` (adicionar listagem + detalhe via BFF)
- `WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-pedidos/page.tsx` (renderizar tabela + filtros)

Criar:
- `WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-pedidos/_components/OrdersTable.tsx`
- `WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-pedidos/_components/OrdersFilters.tsx`
- `WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/meus-pedidos/[pedidoId]/page.tsx`
- (gerados pelo shadcn) novos arquivos em `WWW/REFERENCIAS/connect-ecommerce/components/ui/*` conforme lista acima

## Assunções e Decisões
- O clienteId vem de `useClientesStore().loginData.meus_dados.id`.
- O endpoint `GET /api/pedidos` retorna paginação (page/pageSize/total/totalPages) e `data` como array.
- A lista de pedidos é “por cliente”; o detalhe é por `pedidoId` (já existe BFF).
- UI será client-side (Zustand + fetch via BFF), consistente com outras telas do shop.

## Validação (sem testes automatizados)
- Manual:
  - Logar como cliente (ex.: id 999 no mock) e abrir `/cliente/meus-pedidos`.
  - Ver loading -> tabela com pedidos -> filtros funcionando.
  - Clicar “Ver detalhes” e validar `/cliente/meus-pedidos/<pedidoId>`.
  - Validar Pix: botão copiar (quando existir) + exibir expiresAt.
  - Validar estados: cliente sem pedidos (empty) e erro de rede (alert).
- Diagnóstico TypeScript (sem rodar suíte de testes):
  - Garantir zero erros no diagnóstico do editor.
