# Fórmulas Maduras de Scraping em Node.js

Embora Python tenha sido historicamente a linguagem padrão para web scraping (com Scrapy, BeautifulSoup, etc.), o **Node.js** evoluiu para se tornar indiscutivelmente a melhor plataforma para scraping moderno. Isso ocorre porque a web atual é massivamente baseada em JavaScript (SPA, React, Vue), e rodar browsers headless ou interpretar JS é nativo do ecossistema Node.

Este documento consolida as "fórmulas" e bibliotecas mais maduras para resolver os principais desafios de scraping mantendo a stack 100% em Node.js, sem precisar recorrer ao Python.

## 1. O Framework Definitivo: Crawlee (by Apify)
Em vez de reinventar a roda juntando bibliotecas soltas, o padrão ouro atual em Node.js é o **[Crawlee](https://crawlee.dev/)**. Ele é o equivalente ao "Scrapy" do Python, mas construído para a web moderna. Ele suporta tanto scraping HTTP rápido quanto scraping via Browser (Playwright/Puppeteer) na mesma API.

## 2. Estratégias e Fórmulas

### A. Anti-Bot e Evasão (Stealth)
Sites modernos usam Cloudflare, Datadome e Akamai para bloquear bots.
- **Para requests HTTP (Estratégia A)**: Usar `got-scraping`. É um cliente HTTP feito especificamente para scraping que imita perfeitamente as assinaturas TLS e headers de navegadores reais (Chrome, Firefox). O Crawlee já usa isso por baixo dos panos no `CheerioCrawler`.
- **Para Browser Automation (Estratégia B)**: Usar `playwright-extra` com o plugin `puppeteer-extra-plugin-stealth`. Ele remove as flags de `webdriver`, mascara o `navigator.plugins`, corrige o `WebGL` e faz o Playwright passar em testes como o *bot.sannysoft.com*.

### B. Rate-Limit, Backoff e Cooldown
Fazer requests rápidos demais resulta em banimento (HTTP 429 ou TCP drop).
- **Fórmula Node.js**: O Crawlee possui um `AutoscaledPool` inteligente. Ele monitora a CPU e memória da sua máquina, além do tempo de resposta do site alvo. Se o site começar a demorar ou retornar 429, ele diminui a concorrência automaticamente.
- **Cooldown por Domínio**: Criar um "Session Pool". Se uma sessão/proxy for bloqueada, a sessão é descartada, um atraso (backoff exponencial) é aplicado, e a fila de requests tenta novamente com outra identidade.

### C. Deduplicação (Dedupe)
Evitar baixar a mesma imagem duas vezes ou visitar a mesma URL em loop.
- **Na Fila de Visitas**: Usar o `RequestQueue` do Crawlee, que faz deduplicação nativa baseada em hash da URL.
- **Na Imagem (File Level)**: 
  1. Pegar a URL da imagem.
  2. Gerar um MD5 ou SHA-1 curto da URL (ex: `crypto.createHash('md5').update(url).digest('hex').substring(0, 6)`).
  3. Verificar se o arquivo `produto-slug-<hash>.webp` já existe no disco do MOCK-END antes de fazer o download.

### D. Validação (Poison Pill Detection)
Não salvar lixo (ex: páginas HTML de erro 404/403 disfarçadas de imagem 200 OK).
- **Fórmula de Validação de Imagem**:
  1. Fazer um request `HEAD` (se suportado) ou ler os headers iniciais do `GET`.
  2. Validar o `content-type`: Tem que ser `image/jpeg`, `image/png`, `image/webp`. Se vier `text/html`, é bloqueio ou página de erro.
  3. Validar o tamanho: Rejeitar buffers menores que 2KB (geralmente são pixels transparentes ou imagens corrompidas).
  4. (Opcional) Usar a lib `sharp` no Node para tentar ler os metadados da imagem no buffer. Se o `sharp` der erro, a imagem é inválida.

## 3. Resumo da Arquitetura do Microservice `image-scraper`
- **Linguagem**: Node.js (TypeScript).
- **Core**: `crawlee` + `playwright`.
- **Fluxo**:
  1. Puxa a lista do MOCK-END.
  2. Alimenta a `RequestQueue` do Crawlee.
  3. O `CheerioCrawler` (Estratégia A - rápido) tenta primeiro usando `got-scraping`.
  4. Se detectar falha/bloqueio, joga a URL para o `PlaywrightCrawler` (Estratégia B - lento mas stealth).
  5. Processa o buffer, gera o short-hash, faz o PUT via CRUD JSON no MOCK-END.