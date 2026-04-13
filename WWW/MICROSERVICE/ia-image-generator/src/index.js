import "dotenv/config";
import { Command } from "commander";
import { MockendClient } from "./mockend-client.js";
import { IAGenerator } from "./ia-generator.js";

const program = new Command();

program
  .name("ia-image-generator")
  .description("Microservice CLI para geração de banners/criativos de categorias")
  .version("1.0.0")
  .option("-t, --tenant <tenant>", "Tenant a ser processado", process.env.TENANT || "adega-lopes")
  .option("-m, --mockend <url>", "MOCK-END base URL", process.env.MOCKEND_URL || "http://localhost:4000")
  .action(async (options) => {
    console.log("Iniciando ia-image-generator com opções:");
    console.log(options);
    
    try {
      const client = new MockendClient(options.mockend, options.tenant);
      const generator = new IAGenerator(client, options);
      
      await generator.run();
      console.log("Processo de IA concluído com sucesso!");
    } catch (error) {
      console.error("Erro fatal na execução da IA:", error);
      process.exit(1);
    }
  });

program.parse();
