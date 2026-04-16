import path from "node:path";
import crypto from "node:crypto";

import { readJsonArray, updateJsonArray } from "../../../../../lib/array-store.mjs";

function nowIso() {
  return new Date().toISOString();
}

function asText(value) {
  return String(value ?? "").trim();
}

function nextNumericId(list) {
  let max = 0;
  for (const item of Array.isArray(list) ? list : []) {
    const n = Number(item?.id ?? 0);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

export class OrdersController {
  constructor({ baseDir }) {
    const dir = path.resolve(String(baseDir ?? ""));
    this.ordersPath = path.join(dir, "orders.json");
    this.cartsPath = path.join(dir, "carts.json");
  }

  async checkout({ userId, address, payment }) {
    const uid = asText(userId);
    if (!uid) return { ok: false, status: 401, body: { success: false, message: "Sessao nao encontrada." } };

    const carts = await readJsonArray(this.cartsPath, "carts");
    const cart =
      (Array.isArray(carts) ? carts : []).find((c) => String(c?.userId ?? "") === String(uid)) ?? null;
    const items = Array.isArray(cart?.items) ? cart.items : [];
    if (!items.length) {
      return { ok: false, status: 400, body: { success: false, message: "Carrinho vazio." } };
    }

    const orders = await readJsonArray(this.ordersPath, "orders");
    const id = nextNumericId(orders);
    const createdAt = nowIso();
    const order = {
      id,
      userId: uid,
      status: "created",
      createdAt,
      items,
      address: address ?? null,
      payment: payment ?? null,
      code: `PED-${createdAt.slice(0, 10).replaceAll("-", "")}-${String(id).padStart(4, "0")}`,
      token: crypto.randomBytes(6).toString("hex"),
    };

    await updateJsonArray(this.ordersPath, "orders", async (list) => [...(Array.isArray(list) ? list : []), order]);

    await updateJsonArray(this.cartsPath, "carts", async (list) =>
      (Array.isArray(list) ? list : []).map((c) => {
        if (String(c?.userId ?? "") !== String(uid)) return c;
        return { ...c, items: [], updatedAt: nowIso() };
      })
    );

    return { ok: true, status: 200, body: { success: true, data: { orderId: id, code: order.code } } };
  }

  async list({ userId }) {
    const uid = asText(userId);
    if (!uid) return { ok: false, status: 401, body: { success: false, message: "Sessao nao encontrada." } };
    const orders = await readJsonArray(this.ordersPath, "orders");
    const data = (Array.isArray(orders) ? orders : []).filter((o) => String(o?.userId ?? "") === String(uid));
    return { ok: true, status: 200, body: { success: true, data } };
  }

  async detail({ userId, orderId }) {
    const uid = asText(userId);
    const oid = asText(orderId);
    if (!uid) return { ok: false, status: 401, body: { success: false, message: "Sessao nao encontrada." } };
    if (!oid) return { ok: false, status: 400, body: { success: false, message: "orderId e obrigatorio." } };
    const orders = await readJsonArray(this.ordersPath, "orders");
    const found =
      (Array.isArray(orders) ? orders : []).find(
        (o) => String(o?.id ?? "") === String(oid) && String(o?.userId ?? "") === String(uid)
      ) ?? null;
    if (!found) return { ok: false, status: 404, body: { success: false, message: "not_found" } };
    return { ok: true, status: 200, body: { success: true, data: found } };
  }
}

