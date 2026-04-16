# GEN-SEED

Gerador de seed de catálogo (categorias + produtos) para **adega**, salvando:

- `./data/categorias.json`
- `./data/produtos.json`

## Como rodar

No diretório `WWW/MICROSERVICE/GEN-SEED`:

```bash
node src/index.mjs
```

Opcional (override sem editar o JSON):

```bash
node src/index.mjs --outputDir=./data
node src/index.mjs --config=./config.json
```

## Regras (validação)

O script falha (throw) se violar o desenho:

- categorias: >= 5 raízes; 3–5 filhos por raiz; 2–4 netos por filho
- slugs únicos em categorias e produtos
- produtos: >= 120; `categoryId` válido (categoria neta); `(stock > 0) === inStock`

## Saída

Em sucesso, imprime um resumo (counts) no console e grava os dois JSONs no `outputDir`.
