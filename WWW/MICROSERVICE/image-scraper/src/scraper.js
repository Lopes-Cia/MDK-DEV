import { PlaywrightCrawler, log } from 'crawlee';
import sizeOf from 'image-size';
import { generateShortHash } from './mockend-client.js';

log.setLevel(log.LEVELS.INFO);

export class ImageScraper {
  constructor(mockendClient, options = {}) {
    this.client = mockendClient;
    this.safeMode = options.safe !== false; // Default true
    this.maxConcurrency = parseInt(process.env.MAX_CONCURRENCY || '2', 10);
    this.emit = typeof options.emit === "function" ? options.emit : null;
    this.minBytes = parseInt(process.env.MIN_IMAGE_BYTES || '10000', 10);
  }

  async run() {
    log.info(`Iniciando Scraper. Modo Seguro: ${this.safeMode}`);
    if (this.emit) {
      await this.emit("run.start", { safe: this.safeMode, maxConcurrency: this.maxConcurrency });
    }
    
    // 1. Carregar Catálogo
    const produtos = await this.client.getCatalog('produtos');
    let metaData = await this.client.getMeta();
    const isBadMetaSource = (id) => {
      const src = String(metaData?.[id]?.sourceUrl || "");
      const lower = src.toLowerCase();
      return lower.includes("/ip3/") || lower.includes("/dist/react-assets/") || lower.endsWith(".ico");
    };
    let targetProdutos = produtos.filter(p => !p.image || p.image.includes('placeholder') || isBadMetaSource(p.id) || String(p.image || "").toLowerCase().endsWith(".gif"));
    if (this.emit) {
      await this.emit("catalog.loaded", {
        totalProdutos: produtos.length,
        semImagem: targetProdutos.length,
      });
    }

    if (this.safeMode) {
      const sampleSize = Math.max(1, Math.floor(targetProdutos.length * 0.1));
      log.info(`Modo Seguro: Amostrando ${sampleSize} de ${targetProdutos.length} produtos sem imagem.`);
      targetProdutos = targetProdutos.slice(0, sampleSize);
    } else {
      log.info(`Modo Completo: Processando ${targetProdutos.length} produtos sem imagem.`);
    }

    if (targetProdutos.length === 0) {
      log.info('Nenhum produto precisando de imagem.');
      if (this.emit) await this.emit("run.noop", {});
      return;
    }
    let updatedProdutos = [...produtos]; // Cópia
    let changes = 0;

    const self = this; // Para acessar client dentro do handler

    // 2. Configurar o Crawler
    const crawler = new PlaywrightCrawler({
      maxConcurrency: this.maxConcurrency,
      maxRequestRetries: 2,
      headless: true,
      requestHandlerTimeoutSecs: 30,
      
      async requestHandler({ request, page, log }) {
        const { id, title, query, slug } = request.userData;
        log.info(`Buscando imagem para: ${title} (${query})`);
        if (self.emit) {
          await self.emit("produto.start", { produtoId: id, title, query, slug });
        }

        try {
          const q = `${query} produto`;
          const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

          let candidates = [];
          const initUrl = `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`;
          const initRes = await fetch(initUrl, { headers: { "user-agent": ua } });
          if (initRes.ok) {
            const initHtml = await initRes.text();
            const vqdMatch =
              initHtml.match(/vqd='([^']+)'/) ??
              initHtml.match(/vqd="([^"]+)"/) ??
              initHtml.match(/vqd=([^&\s"]+)/);
            const vqd = vqdMatch?.[1] ? String(vqdMatch[1]).trim() : "";
            if (vqd) {
              const apiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(q)}&vqd=${encodeURIComponent(vqd)}`;
              const apiRes = await fetch(apiUrl, {
                headers: { "user-agent": ua, accept: "application/json" },
              });
              if (apiRes.ok) {
                const apiData = await apiRes.json().catch(() => null);
                const results = Array.isArray(apiData?.results) ? apiData.results : [];
                candidates = results.map((r) => r?.image).filter(Boolean);
              }
            }
          }

          if (candidates.length === 0) {
            await page.goto(initUrl, { waitUntil: 'domcontentloaded' });
            await page.waitForSelector("img", { timeout: 15000 });

            const candidatesRaw = await page.$$eval("img", (imgs) =>
              imgs
                .map((img) => img.currentSrc || img.src || img.getAttribute("data-src") || img.getAttribute("data-original") || "")
                .filter(Boolean)
            );

            candidates = [...new Set(candidatesRaw)]
              .map((u) => (u.startsWith("//") ? `https:${u}` : u))
              .filter((u) => u.startsWith("http"))
              .filter((u) => !u.startsWith("data:"))
              .filter((u) => !u.includes("/ip3/"))
              .filter((u) => !u.includes("/dist/react-assets/"))
              .filter((u) => !u.toLowerCase().endsWith(".ico"));
          }

          if (candidates.length === 0) {
            log.warning(`Nenhuma imagem candidata encontrada para ${title}`);
            if (self.emit) {
              await self.emit("produto.not_found", { produtoId: id, title, query });
            }
            return;
          }

          let imageUrl = null;
          let buffer = null;
          let contentType = "";

          for (const cand of candidates.slice(0, 20)) {
            try {
              const response = await fetch(cand);
              if (!response.ok) continue;
              contentType = response.headers.get("content-type") || "";
              if (!contentType.toLowerCase().startsWith("image/")) continue;
              if (contentType.toLowerCase().includes("icon")) continue;
              if (contentType.toLowerCase().includes("gif")) continue;
              if (cand.includes("/dist/react-assets/")) continue;

              const arrayBuffer = await response.arrayBuffer();
              const b = Buffer.from(arrayBuffer);
              if (b.length < self.minBytes) continue;

              // Validar dimensões e formato com image-size
              let dimensions;
              try {
                dimensions = sizeOf(b);
              } catch (err) {
                // Buffer não é uma imagem válida ou não suportada
                continue;
              }

              // Rejeitar gifs animados, ícones ou imagens menores que 300x300
              if (!dimensions || dimensions.type === "gif" || dimensions.type === "ico") continue;
              if (dimensions.width < 300 || dimensions.height < 300) continue;

              imageUrl = cand;
              buffer = b;
              break;
            } catch {
              continue;
            }
          }

          if (!imageUrl || !buffer) {
            log.warning(`Nenhuma imagem válida encontrada para ${title}`);
            if (self.emit) {
              await self.emit("produto.not_found", { produtoId: id, title, query });
            }
            return;
          }

          log.info(`Encontrada URL: ${imageUrl}`);
          if (self.emit) {
            await self.emit("produto.image_found", { produtoId: id, title, imageUrl, contentType, bytes: buffer.length });
          }

          // Salvar asset no MOCK-END
          const shortHash = generateShortHash(imageUrl);
          const ct = (contentType || "").toLowerCase();
          const ext =
            ct.includes("image/webp") ? ".webp" :
            ct.includes("image/png") ? ".png" :
            ct.includes("image/jpeg") ? ".jpg" :
            ct.includes("image/jpg") ? ".jpg" :
            ct.includes("image/gif") ? ".gif" :
            ct.includes("image/svg") ? ".svg" :
            ".jpg";
          const fileName = `produtos/${slug}-${shortHash}${ext}`;
          
          const relativePath = await self.client.uploadAsset(fileName, buffer);
          log.info(`Imagem salva no MOCK-END em: ${relativePath}`);
          if (self.emit) {
            await self.emit("produto.asset_uploaded", {
              produtoId: id,
              title,
              imageUrl,
              relativePath,
              bytes: buffer.length,
              contentType,
            });
          }

          // Atualizar metadados locais em memória
          metaData[id] = {
            sourceUrl: imageUrl,
            method: 'B (Playwright DuckDuckGo Images)',
            ts: new Date().toISOString(),
            hash: shortHash,
            bytes: buffer.length,
            contentType,
          };

          // Atualizar produto na lista em memória
          const prodIndex = updatedProdutos.findIndex(p => p.id === id);
          if (prodIndex > -1) {
            updatedProdutos[prodIndex].image = relativePath;
            changes++;
            if (self.emit) {
              await self.emit("produto.updated", { produtoId: id, title, image: relativePath, changes });
            }
          }

        } catch (error) {
          log.error(`Erro ao processar ${title}: ${error.message}`);
          if (self.emit) {
            await self.emit("produto.error", { produtoId: id, title, message: error?.message || String(error) });
          }
        }
      },
      
      failedRequestHandler({ request, log }) {
        log.error(`Request falhou permanentemente para ${request.userData.title}`);
      }
    });

    // 3. Alimentar a fila
    const requests = targetProdutos.map(p => ({
      url: 'https://example.com/dummy', // Crawlee exige URL inicial válida
      uniqueKey: String(p.id),
      userData: {
        id: p.id,
        slug: p.slug || p.id,
        title: p.name,
        query: `${p.name} ${p.brand || ''}`.trim()
      }
    }));

    await crawler.addRequests(requests);
    
    // Rodar crawler
    await crawler.run();

    // 4. Salvar tudo no MOCK-END
    if (changes > 0) {
      log.info(`Salvando JSONs: ${changes} produtos atualizados.`);
      await this.client.updateJson('produtos', updatedProdutos);
      await this.client.updateMeta(metaData);
      log.info('MOCK-END atualizado com sucesso.');
      if (this.emit) {
        await this.emit("run.persisted", { changes });
      }
    } else {
      log.info('Nenhuma imagem nova foi baixada. JSONs não alterados.');
      if (this.emit) {
        await this.emit("run.no_changes", {});
      }
    }

    if (this.emit) {
      await this.emit("run.finish", { changes });
    }
  }
}
