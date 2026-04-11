# Amostras Visuais (Style Tiles) — ADEGA LOPES vs MERCEARIA LOPES

Objetivo: definir **paleta + tipografia + vibe** para cada tenant usando ferramentas mais “acabadas”, para evitar decisão no escuro e reduzir retrabalho.

Ferramentas (fluxo sugerido)
- Realtime Colors: validar paleta + tipografia em UI real (hierarquia, contraste, botões, cards).
- Huemint / Khroma: gerar paletas UI-friendly por seed e preferências.
- Fontjoy: sugerir pares de fontes (Display + Texto) com Google Fonts.

O que este documento entrega
- Um **subfluxo de decisão** para chegar em 2 temas finais (Adega e Mercearia).
- Um template de **saída final** que vira tokens (CSS variables) + fontes (`next/font`).

Onde salvar o resultado (MOCK-END)
- `WWW/MICROSERVICE/MOCK-END/adega-lopes/THEMA/`
- `WWW/MICROSERVICE/MOCK-END/mercearia-lopes/THEMA/`

---

## 1) Subfluxo de decisão (por tenant)

### Passo A — Definir direção (3 minutos)
Para cada tenant, escolha:
- Modo: `dark-first` ou `light-first`
- Temperatura: `frio` (azul/ciano) ou `quente` (laranja/vermelho/âmbar)
- “Vibe”: `jovem` (alto contraste + acento vibrante) ou `requintado` (tons sóbrios + acento premium)

Direções recomendadas:
- **ADEGA LOPES**: `dark-first` + acento vibrante (jovem/energético).
- **MERCEARIA LOPES**: `light-first` + acento premium (clássico/organizado).

### Passo B — Gerar paletas (Huemint/Khroma)
Objetivo: sair com 2–3 paletas candidatas por tenant.

Regras para paleta UI (para evitar problemas depois)
- Ter 1 cor de `primary` (CTA) com contraste bom sobre `background` e `surface`.
- Ter `accent` para promo, tags e highlights sem “gritar” mais que o CTA.
- Definir `background` e `surface` distintos (cards e seções precisam separar bem).
- Definir uma `neutral scale` minimamente consistente (cinzas/tons de texto).

Checklist rápido (antes de levar pro Realtime Colors)
- Texto em background: legível.
- Botão primário: legível em fundo e em hover/focus.
- Promo badge: não conflita com primário.

### Passo C — Escolher fontes (Fontjoy)
Objetivo: 2 pares candidatos (Display + Texto) por tenant.

Regras
- Texto/UI precisa ser “econômico” em mobile (boa legibilidade em 14–16px).
- Display pode ter mais personalidade, mas não deve “quebrar” números (preço e parcelas).

Sugestões iniciais (para acelerar)
- **ADEGA**: Display `Space Grotesk` ou `Sora`; Texto `Inter`.
- **MERCEARIA**: Display `Fraunces` ou `Playfair Display`; Texto `Inter` ou `Source Sans 3`.

### Passo D — Validar em UI real (Realtime Colors)
Objetivo: escolher 1 combinação final por tenant (paleta + fontes).

O que validar (foco em conversão)
- Preço e desconto “saltam” sem ficar agressivo.
- CTA “Adicionar” tem prioridade visual clara.
- Texto secundário não desaparece (descrição, volume/peso).
- Contraste de estados: hover, focus, disabled, erro.

Critério de escolha final (POC)
- Leitura rápida no mobile + clareza do CTA + hierarquia de preço/promo + sensação de marca.

---

## 1.1) Amostra de categoria + produtos (para validar o tema em UI real)
Objetivo: ter 1 categoria e 2 produtos “representativos” por tenant para colar no Realtime Colors (ou em qualquer mock de card/lista) e validar:
- legibilidade de preço/promo
- hierarquia (título > marca > volume/peso)
- contraste de badge e CTA

Referência de onde o seed completo fica:
- ADEGA: [categorias.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/adega-lopes/CATALOGO/categorias.json) e [produtos.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/adega-lopes/CATALOGO/produtos.json)
- MERCEARIA: [categorias.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/mercearia-lopes/CATALOGO/categorias.json) e [produtos.json](file:///c:/LOPES/www/MDK-DEV/WWW/MICROSERVICE/MOCK-END/mercearia-lopes/CATALOGO/produtos.json)

### ADEGA — exemplo
Categoria:
```json
{
  "id": 20,
  "name": "Cervejas",
  "slug": "cervejas",
  "parentId": 10,
  "image": "/assets/categories/cervejas.webp",
  "order": 20
}
```

Produtos:
```json
[
  {
    "id": 1001,
    "sku": "HEINEKEN-LATA-350",
    "name": "Heineken Lata 350ml",
    "slug": "heineken-lata-350ml",
    "categoryId": 30,
    "brand": "Heineken",
    "unitLabel": "lata",
    "sizeLabel": "350ml",
    "price": 5.99,
    "compareAtPrice": 6.99,
    "badges": ["gelada", "promo"],
    "image": "/assets/products/placeholder.webp",
    "inStock": true,
    "stock": 150
  },
  {
    "id": 1015,
    "sku": "BUDWEISER-6X-350",
    "name": "Budweiser 6x 350ml",
    "slug": "budweiser-6x-350ml",
    "categoryId": 30,
    "brand": "Budweiser",
    "unitLabel": "pack",
    "sizeLabel": "6x 350ml",
    "price": 32.9,
    "compareAtPrice": null,
    "badges": ["combo"],
    "image": "/assets/products/placeholder.webp",
    "inStock": true,
    "stock": 28
  }
]
```

### MERCEARIA — exemplo
Categoria:
```json
{
  "id": 20,
  "name": "Essenciais",
  "slug": "essenciais",
  "parentId": 10,
  "image": "/assets/categories/essenciais.webp",
  "order": 20
}
```

Produtos:
```json
[
  {
    "id": 2002,
    "sku": "TIO-JOAO-ARROZ-TIO-JOAO-5KG",
    "name": "Arroz Tio João 5kg",
    "slug": "arroz-tio-joao-5kg",
    "categoryId": 30,
    "brand": "Tio João",
    "unitLabel": "pacote",
    "sizeLabel": "5kg",
    "price": 34.9,
    "compareAtPrice": 40.13,
    "badges": ["essencial", "promo"],
    "image": "/assets/products/placeholder.webp",
    "inStock": true,
    "stock": 81
  },
  {
    "id": 2050,
    "sku": "PAPEL-HIGIENICO-NEVE-12-ROLOS",
    "name": "Papel Higiênico Neve 12 rolos",
    "slug": "papel-higienico-neve-12-rolos",
    "categoryId": 240,
    "brand": "Neve",
    "unitLabel": "pacote",
    "sizeLabel": "12 rolos",
    "price": 24.9,
    "compareAtPrice": null,
    "badges": ["mais-vendido"],
    "image": "/assets/products/placeholder.webp",
    "inStock": false,
    "stock": 0
  }
]
```

## 2) Saída final (template do tema)

Preencha 1 bloco por tenant quando escolher:

### Tema — ADEGA LOPES
**Direção**
- Modo:
- Vibe:

**Fontes (Google Fonts)**
- Display:
- Texto/UI:

**Paleta**
- background:
- surface:
- text:
- primary:
- primary-foreground:
- accent:
- accent-foreground:
- border:
- muted:

**UI Tokens**
- radius:
- shadow (curta descrição):

### Tema — MERCEARIA LOPES
**Direção**
- Modo:
- Vibe:

**Fontes (Google Fonts)**
- Display:
- Texto/UI:

**Paleta**
- background:
- surface:
- text:
- primary:
- primary-foreground:
- accent:
- accent-foreground:
- border:
- muted:

**UI Tokens**
- radius:
- shadow (curta descrição):
