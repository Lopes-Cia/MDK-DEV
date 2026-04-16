# GEN-SEED (gerador de seed)

## Objetivo
Criar um gerador de seed de catálogo (categorias + produtos) para **uma adega**, salvando os arquivos em `./data`:
- `./data/categorias.json`
- `./data/produtos.json`

## Referência (base)
Use como base o script:
- [generate-catalogs.mjs](../../WWW/MICROSERVICE/MOCK-END/LEGADO/scripts/generate-catalogs.mjs)

Manter as regras e padrões principais já existentes no script base (ex.: `slugify`, validações, consistência de estoque).

## Artefatos a criar
Dentro de [WWW/MICROSERVICE](../../WWW/MICROSERVICE), criar o módulo/projeto `GEN-SEED` contendo:
- Um arquivo `config.json`
- Um script (Node) que gera `categorias.json` e `produtos.json` em `./data`

## config.json (requisitos mínimos)
Criar `config.json` para parametrizar a geração. Campos mínimos sugeridos:
- `outputDir`: string (default: `./data`)
- `categories`:
  - `rootsMin`: number (>= 5)
  - `childrenMin`: number (>= 3)
  - `childrenMax`: number (<= 5)
  - `grandchildrenMin`: number (>= 2)
  - `grandchildrenMax`: number (<= 4)
- `products`:
  - `minTotal`: number (>= 120)

## Regras de categorias
Gerar uma árvore com estas restrições:
- No mínimo **5 categorias raiz** (`parentId: 0`)
- Cada raiz deve ter **3 a 5 filhos**
- Cada filho deve ter **2 a 4 netos**

Regras de consistência:
- `id` deve ser `number`
- `parentId` deve ser `number`
- `slug` deve ser único (por categoria)
- `parentId` deve ser `0` (raiz) ou apontar para um `id` existente

## Regras de produtos
Gerar no mínimo **120 produtos**, distribuídos entre as categorias **netas**.

Regras de consistência (seguir o padrão do script base):
- `id` deve ser único (`number`)
- `slug` deve ser único (por produto)
- `categoryId` deve existir e apontar para uma categoria (preferencialmente neta)
- `stock` deve ser `number`
- `inStock` deve ser `boolean` e consistente: `(stock > 0) === inStock`

## Domínio (ecommerce de adega)
O seed deve refletir um catálogo realista de **adega** (bebidas e conveniência), com categorias e produtos típicos.

### Categorias sugeridas (exemplo)
Use nomes coerentes com o varejo e imagens placeholders no padrão do script base (`/assets/categories/...`).

- Raízes (>= 5, `parentId: 0`)
  - Bebidas
  - Vinhos
  - Destilados
  - Não alcoólicas
  - Conveniência

- Filhos e netos (respeitar 3–5 filhos por raiz; 2–4 netos por filho)
  - Bebidas
    - Cervejas → (Lager, IPA, Pilsen, Artesanais)
    - Chopp → (Pilsen, IPA)
    - Drinks prontos → (Gin tônica, Vodka ice)
  - Vinhos
    - Tintos → (Seco, Suave)
    - Brancos → (Seco, Suave)
    - Espumantes → (Brut, Moscatel)
  - Destilados
    - Whisky → (Blended, Bourbon)
    - Vodka → (Tradicional, Premium)
    - Gin → (London Dry, Aromatizado)
  - Não alcoólicas
    - Energéticos → (Tradicional, Zero)
    - Refrigerantes → (Cola, Guaraná)
    - Águas & Isotônicos → (Água, Isotônico)
  - Conveniência
    - Gelo → (Saco 2kg, Saco 5kg)
    - Snacks → (Salgadinhos, Amendoim, Batata chips)
    - Acessórios → (Copos, Abridor)

### Produtos sugeridos (exemplo)
Distribuir produtos preferencialmente nas categorias **netas** (terceiro nível), com variações por marca e tamanho para alcançar o mínimo de 120 itens.

Tipos/linhas recomendadas:
- Cervejas: latas 269/350/473ml, long neck, packs 6/12 (marcas populares)
- Vinhos: tinto/branco/espumante 750ml (marcas diversas; seco/suave/brut/moscatel)
- Destilados: whisky/vodka/gin 750ml/1L (marcas diversas)
- Não alcoólicas: energéticos 250/269/355ml, refrigerantes 350ml/2L, água 500ml/1,5L
- Conveniência: gelo 2kg/5kg, snacks 90g/150g/500g, abridor/copos

Campos recomendados (mantendo padrão do script base):
- Produto: `id, sku, name, slug, categoryId, brand, unitLabel, sizeLabel, price, compareAtPrice, badges, image, stock, inStock`

## Saída esperada
Ao executar o gerador, devem existir:
- `./data/categorias.json` com a árvore completa (raízes, filhos, netos)
- `./data/produtos.json` com no mínimo 120 itens válidos

## Critérios de validação (obrigatório)
O script deve falhar (throw) se qualquer regra for violada:
- Menos de 5 raízes
- Alguma raiz com filhos fora do intervalo 3–5
- Algum filho com netos fora do intervalo 2–4
- Menos de 120 produtos
- `categoryId` inválido em produto
- `slug` duplicado (categorias ou produtos)
- `inStock` inconsistente com `stock`
