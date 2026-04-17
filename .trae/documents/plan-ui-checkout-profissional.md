# Plano — Aplicar melhoria visual no Checkout (connect-ecommerce)

## Resumo
Aplicar no `checkout/page.tsx` o mesmo padrão visual “profissional” usado na Área do Cliente e no `app/dashboard`:
- fundo em gradiente + espaçamento consistente
- header em “card” com título/subtítulo
- cards com `rounded-2xl border ... shadow-sm`
- botões padronizados usando `components/ui/button` quando fizer sentido

Arquivo alvo:
- [checkout/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/checkout/page.tsx)

## Estado atual (grounded)
- `checkout/page.tsx` hoje:
  - Wrapper: `container mx-auto px-4 py-8`
  - Header simples: `<h1 className="text-3xl font-bold mb-6">Checkout</h1>`
  - Conteúdo:
    - Se carrinho vazio: card simples com links para `/cart` e `/categorias`
    - Se carrinho com itens: card simples envolvendo `<CheckoutForm />`
- O visual “alvo” existe em:
  - [cliente/layout.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/cliente/layout.tsx) (gradiente + header card)
  - [dashboard/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/dashboard/page.tsx) (cards `rounded-2xl`, `border`, `shadow-sm`)
- Existe componente Button shadcn-style no projeto:
  - [components/ui/button.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/components/ui/button.tsx)

## Decisões
- Não mexer em lógica de autenticação (`isLoggedIn` + redirect) nem no fluxo do carrinho.
- Não adicionar dependências.
- Mudança concentrada no `checkout/page.tsx` (sem refatorar `CheckoutForm.tsx` neste pedido).

## Mudanças propostas (o que/como)

### 1) Atualizar shell do Checkout (wrapper + container)
Arquivo: [checkout/page.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/REFERENCIAS/connect-ecommerce/app/(shop)/checkout/page.tsx)
- Trocar `container mx-auto px-4 py-8` por um shell no mesmo padrão do cliente:
  - `min-h-screen bg-[linear-gradient(...)] p-3 sm:p-5 lg:p-8`
  - container interno `mx-auto max-w-7xl`

### 2) Header em card (título + subtítulo + ações)
- Criar um header card com:
  - label pequeno (“Checkout”)
  - título (“Finalizar compra”)
  - subtítulo curto (“Revise seus dados e confirme o pedido.”)
  - ação rápida “Voltar ao carrinho” (Link) usando `Button variant="outline"` quando adequado

### 3) Estado vazio (carrinho vazio) mais consistente
- Trocar card atual por:
  - `rounded-2xl border border-custom-light-300 bg-white p-6 shadow-sm`
  - botões com `Button`:
    - “Ver carrinho” (outline)
    - “Ir para categorias” (default)

### 4) Conteúdo normal (com itens) consistente
- Trocar wrapper do `<CheckoutForm />` para card `rounded-2xl ... shadow-sm`.
- Manter `<CheckoutForm />` intacto (ele já tem cards internos; esse wrapper só alinha com o shell).

## Passos (3–8) + validação
1) Editar `checkout/page.tsx` para aplicar wrapper/gradiente e header card.
2) Ajustar estado “carrinho vazio” para card + buttons padronizados.
3) Ajustar estado “com itens” para wrapper card com o mesmo padrão.
4) Verificar no browser:
   - Sem login: redireciona para `/login` (comportamento atual)
   - Carrinho vazio: layout “profissional” e links funcionando
   - Carrinho com itens: checkout renderiza e mantém comportamento

## Fora de escopo
- Refatorar `CheckoutForm.tsx` (inputs, botões internos, etc.).
- Trocar componentes por blocks shadcnblocks premium.

