# Plano: Seeding do Catálogo no `MOCK-END` (ADEGA + MERCEARIA)

## Resumo
Explodir o desenho de seeds do catálogo ([seeding-catalogo.md](file:///c:/LOPES/www/MDK-DEV/IA/DESENHOS/seeding-catalogo.md)) em microtarefas e, após aprovação, executar criando os arquivos JSON no caminho padrão de microsserviço de mock:
- `WWW/MICROSERVICE/MOCK-END/adega-lopes/CATALOGO/categorias.json`
- `WWW/MICROSERVICE/MOCK-END/adega-lopes/CATALOGO/produtos.json`
- `WWW/MICROSERVICE/MOCK-END/mercearia-lopes/CATALOGO/categorias.json`
- `WWW/MICROSERVICE/MOCK-END/mercearia-lopes/CATALOGO/produtos.json`

## Estado atual (checado no repo)
- O desenho de seed já define:
  - hierarquia 3 níveis via `parentId` (pai=0, filho=ID do pai, neto=ID do filho)
  - produto com `categoryId` apontando para a categoria final
  - produto com `inStock` e `stock` (quantidade numérica)
  - categorias sem `icon`, com `image` opcional
- Ainda não existe a pasta `WWW/MICROSERVICE/` no repo.
- Existe um app Next.js em `WWW/n1/` (criado pelo create-next-app), mas este plano foca só nos seeds do catálogo e no diretório do mock.

## Decisões (travadas)
- Pastas dos 2 ecoms no mock: `adega-lopes` e `mercearia-lopes`.
- Nomes dos arquivos: `categorias.json` e `produtos.json` (pt-BR), conforme atualização do desenho.
- Sem novas dependências para gerar/validar os JSONs (validação simples em script Node, se necessário).

## Mudanças propostas (após aprovação)
### 1) Criar estrutura do MOCK-END
**Criar diretórios:**
- `WWW/MICROSERVICE/MOCK-END/adega-lopes/CATALOGO/`
- `WWW/MICROSERVICE/MOCK-END/mercearia-lopes/CATALOGO/`

**Criar arquivos vazios iniciais (para versionar estrutura):**
- `categorias.json`
- `produtos.json`

### 2) Definir e materializar categorias (JSON) com 3 níveis
**ADEGA**
- Árvore mínima igual ao desenho (Bebidas/Conveniência com netos).
- IDs numéricos estáveis (ex.: 10/20/30…), com `parentId` seguindo a regra.

**MERCEARIA**
- Árvore mínima igual ao desenho (Alimentos/Casa & Cuidados com netos).
- IDs numéricos estáveis e regra de `parentId`.

**Saída**
- `categorias.json` por tenant contendo uma lista flat (não aninhada), ordenável por `order`.

### 3) Gerar produtos (JSON) com volume realista para POC
**Regras**
- `id` numérico (faixa por tenant para evitar colisão: adega 1000+; mercearia 2000+).
- `categoryId` sempre aponta para a categoria final (neto preferencial; filho quando fizer sentido).
- `inStock` coerente com `stock`:
  - `stock > 0` => `inStock: true`
  - `stock = 0` => `inStock: false`
- Manter:
  - 2–3 produtos com `compareAtPrice` (promo)
  - 2–3 produtos com `inStock=false` e `stock=0` (indisponível)
  - `slug` único por tenant
- Volume alvo (conforme desenho atual):
  - ADEGA: 50–80 itens
  - MERCEARIA: 80–120 itens

**Saída**
- `produtos.json` por tenant com lista de produtos em formato compatível com o contrato do desenho.

### 4) (Opcional, recomendado) Script de verificação local
Criar um script simples em Node (sem deps) para validar:
- JSON parseável
- IDs únicos por arquivo
- `parentId` sempre 0 ou referencia existente
- `categoryId` sempre referencia existente
- coerência `inStock` vs `stock`

### 5) Sincronizar docs que referenciam o seed
Atualizar o plano principal para refletir:
- novo caminho do seed via `MOCK-END`
- volumes de produtos (ADEGA 50–80, MERCEARIA 80–120)

Arquivos:
- `.trae/documents/plan-poc-ecommerce-n1.md`

## Microtarefas (para virar Todo e executar depois da aprovação)
1. Criar diretórios `WWW/MICROSERVICE/MOCK-END/.../CATALOGO/` (2 tenants).
2. Criar `categorias.json` e `produtos.json` (4 arquivos).
3. Montar `categorias.json` da ADEGA com IDs + `parentId` + `slug` + `order` + `image` (opcional).
4. Montar `categorias.json` da MERCEARIA com IDs + `parentId` + `slug` + `order` + `image` (opcional).
5. Gerar `produtos.json` da ADEGA (50–80) com:
   - mix de cervejas/packs/destilados/vinhos/energéticos/refrigerantes/gelo/snacks
   - promo + indisponível
6. Gerar `produtos.json` da MERCEARIA (80–120) com:
   - mix de essenciais/café/laticínios/congelados/limpeza/higiene/bebidas
   - promo + indisponível
7. (Opcional) Criar e rodar script de validação dos seeds.
8. Atualizar `.trae/documents/plan-poc-ecommerce-n1.md` para manter consistência (caminhos + volumes).

## Critérios de aceite (Pronto quando…)
- Os 4 arquivos existem nos caminhos do `MOCK-END`, com JSON válido.
- As categorias têm 3 níveis possíveis (pai/filho/neto) e respeitam a regra de `parentId`.
- Todo `categoryId` em produto referencia uma categoria existente.
- `inStock` é coerente com `stock`.
- Existem exemplos de promo (`compareAtPrice`) e indisponível (`stock=0`).

## Como validar localmente (após execução)
- Abrir os 4 JSONs e validar parse.
- (Se o script opcional existir) rodar `node` nele e checar saída “ok”.
