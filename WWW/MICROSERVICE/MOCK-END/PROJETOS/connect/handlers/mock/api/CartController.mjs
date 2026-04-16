import path from "node:path";

import { readJsonArray, updateJsonArray } from "../../../../../lib/array-store.mjs";

function nowIso() {
  return new Date().toISOString();
}

function asText(value) {
  return String(value ?? "").trim();
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((i) => {
      const productId = asText(i?.productId ?? i?.idProduto ?? i?.id ?? "");
      const qty = Number(i?.qty ?? i?.quantity ?? 0);
      if (!productId) return null;
      if (!Number.isFinite(qty) || qty <= 0) return null;
      return {
        productId,
        sku: asText(i?.sku ?? ""),
        name: asText(i?.name ?? ""),
        unitPrice: Number(i?.unitPrice ?? i?.price ?? 0) || 0,
        qty: Math.floor(qty),
      };
    })
    .filter(Boolean);
}

export class CartController {
  constructor({ baseDir }) {
    const dir = path.resolve(String(baseDir ?? ""));
    this.cartsPath = path.join(dir, "carts.json");
    this.usersPath = path.join(dir, "users.json");
  }

  async getCart({ userId }) {
    const uid = asText(userId);
    if (!uid) return { ok: false, status: 401, body: { success: false, message: "Sessao nao encontrada." } };

    const carts = await readJsonArray(this.cartsPath, "carts");
    const found =
      (Array.isArray(carts) ? carts : []).find((c) => String(c?.userId ?? "") === String(uid)) ?? null;
    const out = found ?? { id: `cart-${uid}`, userId: uid, items: [], updatedAt: nowIso() };
    return { ok: true, status: 200, body: { success: true, data: out } };
  }

  async putCart({ userId, items }) {
    const uid = asText(userId);
    if (!uid) return { ok: false, status: 401, body: { success: false, message: "Sessao nao encontrada." } };

    const normalized = normalizeItems(items);
    const updatedAt = nowIso();
    const nextCart = { id: `cart-${uid}`, userId: uid, items: normalized, updatedAt };

    await updateJsonArray(this.cartsPath, "carts", async (list) => {
      const base = Array.isArray(list) ? list : [];
      const idx = base.findIndex((c) => String(c?.userId ?? "") === String(uid));
      if (idx >= 0) {
        const copy = [...base];
        copy[idx] = nextCart;
        return copy;
      }
      return [...base, nextCart];
    });

    return { ok: true, status: 200, body: { success: true, data: nextCart } };
  }
}

