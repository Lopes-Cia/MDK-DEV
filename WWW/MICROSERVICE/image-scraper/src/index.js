import "dotenv/config";
import { Command } from "commander";
import crypto from "node:crypto";
import { JsonFileClient } from "./mockend-client.js";
import { ImageScraper } from "./scraper.js";
import { SseHubPublisher } from "./sse-publisher.js";

const program = new Command();

program
  .name("image-scraper")
  .description("Microservice CLI para coleta de imagens com JSON local")
  .version("1.0.0")
  .option("--target-type <type>", "Tipo de alvo: produto|categoria|marca|banner", process.env.TARGET_TYPE || "produto")
  .option("--input <path>", "Arquivo JSON de entrada (produtos)", process.env.INPUT_JSON || "./data/input/produtos.json")
  .option("--output <path>", "Arquivo JSON de saída (produtos enriquecidos)", process.env.OUTPUT_JSON || "./data/output/produtos.json")
  .option("--meta <path>", "Arquivo JSON de metadados de imagens", process.env.META_JSON || "./data/output/image-meta.json")
  .option("--not-found <path>", "Fila JSON de produtos sem imagem válida", process.env.NOT_FOUND_JSON || "./data/output/not-found.json")
  .option("--assets-dir <path>", "Diretório físico para salvar imagens", process.env.ASSETS_DIR || "./data/assets/images")
  .option("--assets-base-url <path>", "Base do path salvo no campo image", process.env.ASSETS_BASE_URL || "/assets/images")
  .option("--sse-hub <url>", "SSE Hub base URL", process.env.SSE_HUB_URL || "")
  .option("-s, --safe", "Executar em modo seguro (amostragem 10%)", true)
  .option("--no-safe", "Desativar modo seguro e processar 100%")
  .option("--retry-not-found", "Processar somente a fila de não encontrados", false)
  .action(async (options) => {
    console.log("Iniciando image-scraper com opções:");
    console.log(options);
    
    try {
      const runId = crypto.randomUUID();
      const client = new JsonFileClient({
        inputFile: options.input,
        outputFile: options.output,
        metaFile: options.meta,
        notFoundFile: options.notFound,
        assetsDir: options.assetsDir,
        assetsBaseUrl: options.assetsBaseUrl,
      });
      const publisher = new SseHubPublisher(options.sseHub);

      const emit = async (event, data = {}) => {
        if (!publisher.enabled()) return;
        try {
          await publisher.publish({
            type: "image-scraper",
            event,
            runId,
            ts: new Date().toISOString(),
            ...data,
          });
        } catch (err) {
          console.warn("[SSE] falha ao publicar evento:", err?.message || err);
        }
      };

      const scraper = new ImageScraper(client, {
        targetType: options.targetType,
        safe: options.safe,
        retryNotFound: options.retryNotFound,
        emit,
      });
      
      await scraper.run();
      console.log("Processo concluído com sucesso!");
    } catch (error) {
      console.error("Erro fatal na execução:", error);
      process.exit(1);
    }
  });

program.parse();
