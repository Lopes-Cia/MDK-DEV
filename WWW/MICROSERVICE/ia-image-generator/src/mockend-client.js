import crypto from "node:crypto";

export class MockendClient {
  constructor(baseUrl, tenant) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.tenant = tenant;
  }

  async getCatalog(type) { // "produtos" ou "categorias"
    const url = `${this.baseUrl}/api/${this.tenant}/catalogo/${type}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Erro ao buscar catálogo ${type}: ${res.statusText}`);
    }
    return res.json();
  }

  async uploadAsset(fileName, buffer) {
    const relPath = `THEMA/assets/images/${fileName}`;
    const url = `${this.baseUrl}/api/${this.tenant}/assets?path=${encodeURIComponent(relPath)}`;
    const res = await fetch(url, {
      method: "PUT",
      body: buffer,
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro no upload do asset ${relPath}: ${errorText}`);
    }
    return `/assets/images/${fileName}`; // Path relativo para o JSON
  }

  async updateJson(type, data) { // "produtos" ou "categorias"
    const relPath = `CATALOGO/${type}.json`;
    const url = `${this.baseUrl}/api/${this.tenant}/json?path=${encodeURIComponent(relPath)}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro ao atualizar JSON ${relPath}: ${errorText}`);
    }
  }
  
  async getMeta() {
    const relPath = `CATALOGO/image-meta.json`;
    const url = `${this.baseUrl}/api/${this.tenant}/json?path=${encodeURIComponent(relPath)}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 400 || res.status === 404) return {}; // Não existe ainda
      throw new Error(`Erro ao ler metadados: ${res.statusText}`);
    }
    const data = await res.json();
    return data?.data || {};
  }

  async updateMeta(metaData) {
    const relPath = `CATALOGO/image-meta.json`;
    const url = `${this.baseUrl}/api/${this.tenant}/json?path=${encodeURIComponent(relPath)}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metaData),
    });
    if (!res.ok) {
      throw new Error(`Erro ao atualizar metadados: ${res.statusText}`);
    }
  }
}

export function generateShortHash(input) {
  return crypto.createHash("md5").update(input).digest("hex").substring(0, 6);
}
