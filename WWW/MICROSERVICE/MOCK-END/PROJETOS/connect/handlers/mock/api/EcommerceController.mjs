import fs from "node:fs/promises";
import path from "node:path";

function isRecord(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export class EcommerceController {
  constructor({ baseDir }) {
    const dir = path.resolve(String(baseDir ?? ""));
    this.ecommercePath = path.join(dir, "ecommerce.json");
  }

  async getConfig() {
    let raw = "{}";
    try {
      raw = await fs.readFile(this.ecommercePath, "utf8");
    } catch (err) {
      const code = String(err?.code ?? "");
      if (code !== "ENOENT") {
        process.stderr.write(
          `[mock-end] ecommerce(config) não conseguiu ler arquivo (${this.ecommercePath}): ${String(err?.message ?? err)}\n`
        );
      }
      return {
        ok: true,
        status: 200,
        body: {
          success: true,
          data: {
            meiosPagamentoDisponiveis: [],
            pedidoMinimo: 0,
            cepsAtendidos: [],
            vendaParaCpf: true,
            vendaParaCnpj: true,
            politicas: {
              pedidoMinimoAtivo: false,
              validarCepAtendido: false,
            },
          },
        },
      };
    }

    try {
      const parsed = JSON.parse(raw);
      const data = isRecord(parsed) ? parsed : {};
      return { ok: true, status: 200, body: { success: true, data } };
    } catch (err) {
      process.stderr.write(
        `[mock-end] ecommerce(config) JSON inválido (${this.ecommercePath}): ${String(err?.message ?? err)}\n`
      );
      return {
        ok: true,
        status: 200,
        body: {
          success: true,
          data: {
            meiosPagamentoDisponiveis: [],
            pedidoMinimo: 0,
            cepsAtendidos: [],
            vendaParaCpf: true,
            vendaParaCnpj: true,
            politicas: {
              pedidoMinimoAtivo: false,
              validarCepAtendido: false,
            },
          },
        },
      };
    }
  }
}
