# Microservice: Tratamento de Imagens (Arquitetura Definitiva)

## 1. Visão Geral e Arquitetura
- **Localização:** Projeto independente em `WWW/MICROSERVICE/TRATAMENTO-IMAGENS`.
- **Stack:** Node.js + `sharp` (libvips).
- **Responsabilidade:** Receber imagens, validar, processar (resize/crop/format) e enviar para armazenamento final.
- **Isolamento:** Roda em porta própria. Não acessa arquivos de outros domínios diretamente. Toda persistência final é feita via chamadas HTTP (Push) para o `MOCK-END`.

## 2. Regras de Negócio e Limites (MVP)

### 2.1. Entrada (Upload / Ingest)
- **Formatos suportados:** JPG, PNG, WEBP, GIF, TIF, AVIF.
- **GIF Animado:** **Não suportado**. Arquivos com > 1 frame/página retornam erro (`unsupported_animation`).
- **Limites do Arquivo Original:**
  - Peso máximo: **10MB**.
  - Dimensões máximas: **25 Megapixels** (proteção contra image bomb).
  - Dimensões mínimas: **150x150 px** (rejeita imagens muito pequenas).

### 2.2. Saída (Derivados)
- **Formato obrigatório:** **WebP**.
- **Metadata:** Sempre remover EXIF e metadados (foco em privacidade e performance).
- **Dimensão máxima:** Nenhuma variante derivada pode exceder **1000x1000 px**.

### 2.3. Variantes (Presets)
- `zoom`: Formato "master" derivado do original. Fit inside. Máx 1000x1000 px.
- `produto`: Imagem principal da página de produto. Fit inside.
- `card`: Imagem para listagens/cards. Fit inside.
- `thumb`: Miniatura. Crop/Cover (center).
- *Pendente: As dimensões exatas de `produto`, `card` e `thumb` serão padronizadas futuramente nas tarefas de frontend do E-commerce.*

## 3. Estratégia de Processamento (Síncrono + Lazy)

O microserviço atua em duas fases para economizar armazenamento e processamento:

### Fase 1: Ingest (Upload) - Síncrono
1. **Recepção:** Recebe o arquivo (multipart) ou a referência (path).
2. **Processamento Local (Temporário):** Salva o arquivo original bruto em uma pasta temporária isolada (ex: `/tmp/`).
3. **Validação:** Checa limites de peso, dimensões, formato e frames. Gera o hash (SHA-256).
4. **Geração do Master (`zoom`):** Converte IMEDIATAMENTE o original para a variante `zoom` (WebP, máx 1000x1000, sem EXIF) na pasta `/tmp/`.
5. **Push para o MOCK-END:** Faz um HTTP POST/PUT para a API do MOCK-END, enviando o arquivo original e a variante `zoom` gerada.
6. **Limpeza:** Apaga obrigatoriamente os arquivos da pasta `/tmp/`.
7. **Retorno:** Responde ao cliente com sucesso, o ID/Hash e os paths. (Nenhuma outra variante é gerada nesta etapa).

### Fase 2: Geração Sob Demanda (On-the-fly)
1. **Requisição:** O frontend/browser solicita uma variante menor (ex: `card` ou `thumb`) na rota de assets.
2. **Interceptação (Miss):** Se a imagem não existe no MOCK-END, a requisição aciona o TRATAMENTO-IMAGENS.
3. **Geração Lazy:**
   - O TRATAMENTO-IMAGENS faz o download da variante master (`zoom`) do MOCK-END para o seu `/tmp/` local (evitando baixar o original pesado de 25MP).
   - Aplica o resize/crop específico do preset solicitado.
   - Faz o Push (HTTP POST/PUT) do novo derivado para o MOCK-END.
   - Apaga o arquivo do `/tmp/` e devolve o stream da imagem gerada diretamente para o cliente.

## 4. Persistência e Armazenamento (MOCK-END)

O armazenamento definitivo (POC/MVP) pertence ao `MOCK-END`, com isolamento estrito por tenant. O TRATAMENTO-IMAGENS apenas envia os dados para lá.
- **Path Base (no MOCK-END):** `WWW/MICROSERVICE/MOCK-END/<tenant>/COMMERCE/assets/images/`
- **Nomenclatura e Estrutura de Pastas:** O identificador único de cada imagem é o hash SHA-256 do arquivo original bruto. Isso garante deduplicação exata e nomes de arquivos seguros.
  - **Originais:** `.../originals/<sha256>.<extOriginal>` (Ex: `.../originals/a1b2c3d4...e5f6.jpg`)
  - **Derivados:** Agrupados em pastas pelo hash da imagem. O nome do arquivo é a chave da variante.
    - `.../derived/<sha256>/zoom.webp`
    - `.../derived/<sha256>/card.webp`
    - `.../derived/<sha256>/thumb.webp`
  - **Manifests:** `.../manifests/<sha256>.json` (Armazena os metadados como tamanho, dimensões e paths de cada variante).
- **Deduplicação:** Feita pelo hash (SHA-256) do arquivo original. O dedupe é isolado **por tenant** (mesmo arquivo em tenants diferentes gera cópias isoladas).

## 5. Interfaces da API (Contrato)

### 5.1. Endpoint de Processamento (Upload)
`POST /api/images/process`
- **Modo A:** `multipart/form-data` contendo o `file`.
- **Modo B:** JSON `{ "tenant": "...", "source": { "type": "path", "path": "..." } }`.
- **Resposta Esperada:**
  ```json
  {
    "id": "sha256-hash",
    "source": { "format": "jpeg", "width": 4000, "height": 3000, "bytes": 4500000, "sha256": "..." },
    "variants": [
      { "key": "zoom", "path": ".../derived/hash/zoom.webp", "width": 1000, "height": 750, "bytes": 120000 }
    ]
  }
  ```

## 6. Segurança e Robustez
- **Limpeza Garantida:** Exclusão obrigatória de arquivos do diretório temporário (`/tmp/`) independente de sucesso ou falha na conversão (bloco `finally`).
- **Isolamento de Recursos:** Restrição lógica de CPU/Memória (preparado para cgroups em Docker no futuro).
- **Observabilidade:** Logs do microserviço devem conter ID de correlação, Tenant e Hash, omitindo rigorosamente o conteúdo binário e dados sensíveis do payload.