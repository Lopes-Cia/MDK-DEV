import "dotenv/config";
import { Command } from "commander";
import crypto from "node:crypto";
import { MockendClient } from "./mockend-client.js";
import { ImageScraper } from "./scraper.js";
import { SseHubPublisher } from "./sse-publisher.js";

const program = new Command();

program
  .name("image-scraper")
  .description("Microservice CLI para coleta de imagens (A/B pipeline)")
  .version("1.0.0")
  .option("-t, --tenant <tenant>", "Tenant a ser processado", process.env.TENANT || "adega-lopes")
  .option("-m, --mockend <url>", "MOCK-END base URL", process.env.MOCKEND_URL || "http://localhost:4000")
  .option("--sse-hub <url>", "SSE Hub base URL", process.env.SSE_HUB_URL || "")
  .option("-s, --safe", "Executar em modo seguro (amostragem 10%)", true)
  .option("--no-safe", "Desativar modo seguro e processar 100%")
  .action(async (options) => {
    console.log("Iniciando image-scraper com opções:");
    console.log(options);
    
    try {
      const runId = crypto.randomUUID();
      const client = new MockendClient(options.mockend, options.tenant);
      const publisher = new SseHubPublisher(options.sseHub);

      const emit = async (event, data = {}) => {
        if (!publisher.enabled()) return;
        try {
          await publisher.publish({
            type: "image-scraper",
            event,
            runId,
            tenant: options.tenant,
            ts: new Date().toISOString(),
            ...data,
          });
        } catch (err) {
          console.warn("[SSE] falha ao publicar evento:", err?.message || err);
        }
      };

      const scraper = new ImageScraper(client, { safe: options.safe, emit });
      
      await scraper.run();
      console.log("Processo concluído com sucesso!");
    } catch (error) {
      console.error("Erro fatal na execução:", error);
      process.exit(1);
    }
  });

program.parse();
