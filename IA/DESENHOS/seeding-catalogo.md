# Desenho: Seeding de Catálogo (POC) — ADEGA LOPES e MERCEARIA LOPES

## Objetivo
Ter um conjunto de dados “realista o suficiente” (categorias + produtos) para:
- validar layout/UX dos bricks (Puck)
- validar busca, filtros e listagens
- simular carrinho/checkout (sem regras reais de taxa/prazo)

Sem complicação: dados locais (JSON) por tenant.

---

## Onde ficam os seeds
Vamos isolar os dados em uma estrutura de microsserviço de mock (`MOCK-END`):
- `WWW/MICROSERVICE/MOCK-END/adega-lopes/CATALOGO/`
  - `categorias.json`
  - `produtos.json`
- `WWW/MICROSERVICE/MOCK-END/mercearia-lopes/CATALOGO/`
  - `categorias.json`
  - `produtos.json`

## Contrato mínimo (shape) — categorias
```json
[
  {
    "id": 1,
    "name": "Cervejas",
    "slug": "cervejas",
    "parentId": 0,
    "image": "/assets/categories/cervejas.webp",
    "order": 10
  }
]
```

## Requisito: categorias com 3 níveis (pai > filho > neto)
Para a POC, o seed deve suportar hierarquia mínima de 3 níveis. Para isso:
- `parentId` define a árvore.
- A UI pode navegar por breadcrumbs e filtros baseados na árvore.

Regra do projeto (hierarquia)
- Categoria **pai** sempre tem `parentId: 0`.
- Categoria **filho** tem `parentId` igual ao `id` do pai.
- Categoria **neto** tem `parentId` igual ao `id` do filho.
- `id` é **numérico** (auto-incremento no banco). No seed JSON, apenas manter números estáveis para referenciar relações.

Regra do projeto (categoria do produto)
- O produto guarda apenas **um** vínculo: `categoryId` apontando para a categoria **final** (preferencialmente o **neto**; em alguns casos pode ser o **filho**).
- A hierarquia completa (pai/filho/neto) é deduzida pelo JSON de categorias via `parentId` (se eu sei o `categoryId`, encontro o pai subindo a árvore).

Exemplo (3 níveis):
```json
[
  { "id": 10, "name": "Bebidas", "slug": "bebidas", "parentId": 0, "order": 10 },
  { "id": 20, "name": "Cervejas", "slug": "cervejas", "parentId": 10, "order": 20 },
  { "id": 30, "name": "Lager", "slug": "lager", "parentId": 20, "order": 30 }
]
```

## Contrato mínimo (shape) — produtos
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
    "badges": ["gelada"],
    "image": "/assets/products/heineken-lata.jpg",
    "inStock": true,
    "stock": 150
  }
]
```

Notas:
- `id` de produto é **numérico** (auto-incremento no banco). No seed JSON, apenas manter números estáveis para facilitar referência.
- `sku` é o identificador “humano/sistema” (não precisa ser único global na POC, mas ajuda em debug/importação).
- `price/compareAtPrice` são apenas para simular promo.
- `image` deve apontar para `public/` na POC.
- `badges` habilita UI: promo, gelada, essencial, etc.
- `stock` indica a quantidade numérica de itens disponíveis.

Notas (categoria):
- `image` é opcional e pode ser usado em UI de “categoria destacada”.

---

## Seeds — ADEGA LOPES (bebidas)

### Categorias mínimas
Estrutura sugerida (3 níveis):
- Bebidas
  - Cervejas
    - Lager
    - IPA
  - Destilados
    - Vodka
    - Gin
    - Whisky
  - Vinhos
    - Tintos
  - Não alcoólicas
    - Energéticos
    - Refrigerantes
- Conveniência
  - Gelo
    - Saco 2kg
  - Snacks
    - Salgadinhos

### Produtos mínimos (50–80 itens)
Foco: volume/pack e “gelada”.
- Cervejas: Heineken 350ml, Brahma 350ml, Budweiser 350ml
- Packs: Heineken 6x, Brahma 12x
- Destilados: Vodka Absolut 1L, Gin Tanqueray 750ml, Whisky Johnnie Walker Red 1L
- Vinhos: Tinto seco 750ml, Branco 750ml (2 rótulos)
- Energéticos: Red Bull 250ml, Monster 473ml
- Refrigerantes: Coca-Cola lata, Guaraná lata
- Gelo: Saco 2kg
- Snacks: Amendoim, Batata chips

### Campos que mais importam na ADEGA
- `sizeLabel` (ml/L)
- `unitLabel` (lata/unidade/garrafa)
- `badges`: `gelada`, `combo`, `promo`
- opcional: `packSize` (ex.: 6, 12) para UI de pack

---

## Seeds — MERCEARIA LOPES (alimentos)

### Categorias mínimas
Estrutura sugerida (3 níveis):
- Alimentos
  - Essenciais
    - Arroz
    - Feijão
  - Café da manhã
    - Pães
  - Laticínios
    - Leites
  - Congelados
    - Prontos
  - Bebidas (não alcoólicas)
    - Águas
- Casa & Cuidados
  - Limpeza
    - Cozinha
  - Higiene
    - Papel higiênico

### Produtos mínimos (80–120 itens)
- Essenciais: arroz 5kg, feijão 1kg, açúcar 1kg, óleo 900ml
- Café da manhã: pão de forma, café 500g, leite 1L, manteiga, achocolatado
- Laticínios: iogurte, queijo, requeijão
- Congelados: frango, pizza, nuggets
- Limpeza: detergente, desinfetante, papel toalha
- Higiene: papel higiênico, sabonete, shampoo
- Bebidas: água, suco, refrigerante 2L

### Campos que mais importam na MERCEARIA
- `unitLabel`: unidade/pacote/caixa
- `sizeLabel`: g/kg/ml/L
- `badges`: `essencial`, `promo`, `mais-vendido`
- opcional: `allowSubstitution` (bool) para UI de “substituir se faltar”

---

## Regras rápidas para “ficar bom” na POC
- Manter 2–3 produtos com `compareAtPrice` para testar promo/badge.
- Manter 2–3 produtos com `inStock=false` para testar estado indisponível.
- Garantir imagens coerentes (mesmo estilo) para não “poluir” o layout.
- Garantir slugs únicos e curtos.
