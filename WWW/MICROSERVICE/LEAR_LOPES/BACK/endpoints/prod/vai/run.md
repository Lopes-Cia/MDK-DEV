esse arquivo é o meu retorno do backend [text](j1.json)
presciso de um script em node tradutorBACKvcMOCK.mjs, que traduz as chaves desse arquivo para o esse modelo [produtos.json](produtos.json)

saida [text](.)/OUT/produtos.json


fallback das chaves:
"category": {
      "id": 0,
      "name": "sem categoria",
      "slug": "/categoria/sem-categoria",
      "familia": [
        {
          "id": 0,
          "name": "sem categoria",
          "slug": "/categoria/sem-categoria"
        }
      ]
    },
    "brand": {
      "id": 0,
      "name": "No Brand",
      "slug": "/marca/no-brand",
      "image": "http://localhost:4000/assets/images/semImagem.png"
    },

Primiero analise os 2 arquivos e me faça perguntas sobre as diferenças entre eles, que esplico como traduzir as chaves. Insira a tradução no topico ## Tradução das Chaves.

## Tradução das Chaves

### Regras confirmadas (j1.json → produtos.json)

- `id`
  - `produtos.id` = `j1.codProd`
- `sku`
  - `produtos.sku` = `${j1.ean}-${j1.codProd}`
  - fallback se `ean` vazio/"null": `${slugify(descricaoEcomerce)}-${codProd}`
- `name`
  - `produtos.name` = `j1.descricaoEcomerce` (fallback: `j1.descricaoErp`)
- `slug`
  - `produtos.slug` = `/produtos/${slugify(produtos.name)}-${produtos.id}`
- `unitLabel`
  - `produtos.unitLabel` = detectado por texto em `name` (fallback: `j1.codVol` normalizado, e por fim `"un"`)
    - contém `long neck` → `"long neck"`
    - contém `growler` → `"growler"`
    - contém `lata` → `"lata"`
    - contém `frasco` → `"frasco"`
    - contém `envelope` → `"envelope"`
    - contém `caixa` → `"caixa"`
- `sizeLabel`
  - `produtos.sizeLabel` = extraído do `name` via regex `(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg)`
    - exemplos: `269 ml` → `269ml`, `2 L` → `2L`, `2,5 L` → `2.5L`, `8 g` → `8g`, `2,2 kg` → `2.2kg`
- `price`
  - `produtos.price` = `j1.preco`
- `compareAtPrice`
  - `produtos.compareAtPrice` = `null`
- `badges`
  - `produtos.badges` = `["gelada"]` quando `name` indicar bebida (`cerveja|chopp|refrigerante|isotônico`), senão `[]`
- `image`
  - `produtos.image` = `j1.imagem` (mantém URL do retorno)
  - fallback: `http://localhost:4000/assets/images/semImagem.png`
- `stock`
  - `produtos.stock` = `j1.qtEstoque`
- `inStock`
  - `produtos.inStock` = `produtos.stock > 0`

### Category (fallback + id do j1)

- `produtos.category`
  - manter a chave sempre (mesmo sem classificar)
  - `produtos.category.id` = `j1.categoriaPrinciapal`
  - `produtos.category.name` = `"sem categoria"`
  - `produtos.category.slug` = `"/categoria/sem-categoria"`
  - `produtos.category.familia` = `[ { id: j1.categoriaPrinciapal, name: "sem categoria", slug: "/categoria/sem-categoria" } ]`

### Brand (sempre fallback)

- `produtos.brand`
  - sempre usar fallback:
    - `id`: `0`
    - `name`: `"No Brand"`
    - `slug`: `"/marca/no-brand"`
    - `image`: `"http://localhost:4000/assets/images/semImagem.png"`


## Categorias 
saida [text](.)/OUT/categorias.json
as categorias no backend tem esse formato [text](list.json)
presciso traduzir para esse [text](categorias.json)
a chave 0 do arquivo traduzido sempre é igual ao fallback


## Marcas
saida [text](.)/OUT/brands.json
a chave 0 do arquivo traduzido sempre é igual ao fallback



# 2-Step Taxonomy

