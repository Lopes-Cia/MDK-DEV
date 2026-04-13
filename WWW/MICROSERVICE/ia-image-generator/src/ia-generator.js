import { MockendClient, generateShortHash } from './mockend-client.js';

export class IAGenerator {
  constructor(client, options = {}) {
    this.client = client;
    this.hasKey = !!process.env.GEMINI_API_KEY; // ou OPENAI_API_KEY, etc.
  }

  async run() {
    console.log(`Iniciando IA Image Generator. Chave disponível: ${this.hasKey}`);

    const categorias = await this.client.getCatalog('categorias');
    if (!categorias || categorias.length === 0) {
      console.log("Nenhuma categoria encontrada para processar.");
      return;
    }

    console.log(`Gerando manifesto de prompts para ${categorias.length} categorias...`);
    const manifesto = [];

    // Gerar manifesto
    for (const cat of categorias) {
      const slug = cat.slug || cat.id;
      // Prompts variados para banners
      manifesto.push({
        id: cat.id,
        slug: slug,
        type: 'banner-hero',
        prompt: `A high quality, cinematic, ultra-realistic e-commerce banner background for ${cat.name}. Soft lighting, clean composition, no text, no words, negative space for UI overlay. Product context: ${cat.description || cat.name}.`,
        aspectRatio: '16:9'
      });
      
      manifesto.push({
        id: cat.id,
        slug: slug,
        type: 'category-square',
        prompt: `A minimalist, premium product photography background representing ${cat.name}. Soft shadows, neutral studio background, no text, no words.`,
        aspectRatio: '1:1'
      });
    }

    // Salvar manifesto no MOCK-END (dentro de THEMA/assets ou CATALOGO)
    // Usaremos a API de JSON do MOCK-END.
    const manifestoPath = `THEMA/prompts-manifesto.json`;
    await this.saveJson(manifestoPath, manifesto);
    console.log(`Manifesto de prompts gerado com sucesso em ${manifestoPath}`);

    // Se tiver chave, geraria imagens. (Como não vamos bater na API real agora, vamos mockar ou ignorar se não tiver chave)
    if (!this.hasKey) {
      console.log("Sem API key. Processo de IA pausado. Apenas manifesto gerado.");
      return;
    }

    console.log("Gerando imagens via IA (Simulação)...");
    let changes = 0;
    let updatedCategorias = [...categorias];

    for (const item of manifesto) {
      if (item.type === 'category-square') {
        // Simulando a geração da imagem e retorno de um buffer
        // const buffer = await generateImage(item.prompt);
        // await this.client.uploadAsset(`categorias/${item.slug}-${generateShortHash(item.prompt)}.webp`, buffer);
        console.log(`[SIMULAÇÃO] Imagem gerada para ${item.slug}`);
        changes++;
      }
    }

    if (changes > 0) {
      // await this.client.updateJson('categorias', updatedCategorias);
      console.log("Categorias atualizadas com as imagens da IA.");
    }
  }

  async saveJson(relPath, data) {
    const url = `${this.client.baseUrl}/api/${this.client.tenant}/json?path=${encodeURIComponent(relPath)}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data, null, 2),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro ao salvar JSON ${relPath}: ${errorText}`);
    }
  }
}
