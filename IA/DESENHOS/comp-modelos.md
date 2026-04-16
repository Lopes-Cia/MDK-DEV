# Mapa (modelo) — Radix UI → DOM

Este arquivo documenta como componentes do Radix UI aparecem no DOM neste repositório (e como expandir o mapa quando novos primitives forem adicionados).

## Escopo (repo atual)

Varredura por imports `@radix-ui/react-*` encontrou uso direto apenas de `@radix-ui/react-slot` no app `WWW/n1`.

## Mapa — componentes encontrados

| Pacote | Componente | Elemento DOM “default” | Quando você vê `<div>` | Observações |
|---|---|---|---|---|
| `@radix-ui/react-slot` | `Slot` | Não renderiza um elemento próprio; “adota” o elemento do filho | O `<div>` vem do seu próprio filho (ou do componente que você passou como filho) | Útil para `asChild`: injeta props/refs no filho sem wrapper |

### Onde isso está no repo

- Dependência: [package.json](file:///c:/LOPES/www/MDK-DEV/WWW/n1/package.json)
- Implementação do `Button` com `asChild`: [button.tsx](file:///c:/LOPES/www/MDK-DEV/WWW/n1/src/components/ui/button.tsx#L33-L41)

## Exemplo mental: por que aparece `<div>` no DevTools

- `asChild = false`: o `Button` renderiza um `<button>` (literal string `"button"`).
- `asChild = true`: o `Button` renderiza `Slot`, então o DOM final vira o elemento do filho (pode ser `<a>`, `<div>`, etc.).

## Modelo para expandir este mapa

Quando você encontrar novos componentes Radix no repo, preencha uma linha por componente:

| Pacote | Componente | Elemento DOM “default” | Pode virar outro elemento? | Observações |
|---|---|---|---|---|
| `@radix-ui/react-____` | `____` | `div \| button \| span \| …` | Sim, via `asChild` (quando existir) | Link do arquivo que usa + link da doc do Radix |

## Como manter atualizado (sem adivinhação)

- Fonte 1 (repo): procure por imports `@radix-ui/react-` e registre o pacote + componente usado.
- Fonte 2 (Radix docs): confirme o elemento default e se existe `asChild` naquele componente.
- Fonte 3 (tipos): quando necessário, confira o tipo de props (ex.: `React.ElementRef<"div">`) para inferir o elemento default.
