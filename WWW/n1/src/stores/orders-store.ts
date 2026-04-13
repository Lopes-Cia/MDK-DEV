"use client";

import { create } from "zustand";

import { OrderSchema, type Address, type Order, type Payment } from "@/lib/commerce/schemas";

export type CreateOrderItemInput = {
  productId: number;
  sku?: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type CreateOrderInput = {
  items: CreateOrderItemInput[];
  address: Address;
  payment: Payment;
};

type OrdersData = {
  orders: Order[];
  order: Order | null;
};

type OrdersStoreState = {
  loading: boolean;
  error: string;
  data: OrdersData;
};

type OrdersStoreActions = {
  listOrders: (tenant: string) => Promise<Order[]>;
  getOrder: (tenant: string, orderId: string) => Promise<Order | null>;
  createOrder: (tenant: string, input: CreateOrderInput) => Promise<Order | null>;
  clearError: () => void;
  reset: () => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractApiErrorCode(payload: unknown) {
  if (!isRecord(payload)) return "";
  return typeof payload.error === "string" ? payload.error : "";
}

function mapOrdersErrorToMessage(code: string) {
  switch (code) {
    case "not_authenticated":
    case "invalid_session":
    case "session_expired":
      return "Você precisa estar logado para ver/criar pedidos.";
    case "order_not_found":
      return "Pedido não encontrado.";
    case "tenant_not_found":
      return "Tenant inválido.";
    default:
      return "";
  }
}

async function commerceFetchJson<T>(
  tenant: string,
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; payload: unknown }> {
  const url = `/api/commerce/${encodeURIComponent(tenant)}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    cache: "no-store",
    credentials: "include",
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  const payload = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) return { ok: false, status: res.status, payload };
  return { ok: true, data: payload as T };
}

export const useOrdersStore = create<OrdersStoreState & OrdersStoreActions>((set, get) => ({
  loading: false,
  error: "",
  data: { orders: [], order: null },

  clearError: () => set({ error: "" }),

  reset: () => set({ loading: false, error: "", data: { orders: [], order: null } }),

  listOrders: async (tenant) => {
    set({ loading: true, error: "" });
    try {
      const res = await commerceFetchJson<{ ok: true; orders: unknown }>(tenant, "/orders", { method: "GET" });
      if (!res.ok) {
        const code = extractApiErrorCode(res.payload);
        const message = mapOrdersErrorToMessage(code) || "Falha ao carregar pedidos.";
        set({ error: message });
        return [];
      }

      const rawOrders = isRecord(res.data) ? (res.data as { orders?: unknown }).orders : undefined;
      const parsed = Array.isArray(rawOrders) ? rawOrders.map((o) => OrderSchema.parse(o)) : [];
      set((state) => ({ ...state, data: { ...state.data, orders: parsed } }));
      return parsed;
    } catch (err) {
      console.error("[orders-store] listOrders error", err);
      set({ error: "Falha ao carregar pedidos." });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  getOrder: async (tenant, orderId) => {
    set({ loading: true, error: "" });
    try {
      const res = await commerceFetchJson<{ ok: true; order: unknown }>(tenant, `/orders/${encodeURIComponent(orderId)}`, {
        method: "GET",
      });

      if (!res.ok) {
        const code = extractApiErrorCode(res.payload);
        const message = mapOrdersErrorToMessage(code) || "Falha ao carregar pedido.";
        set({ error: message });
        set((state) => ({ ...state, data: { ...state.data, order: null } }));
        return null;
      }

      const rawOrder = isRecord(res.data) ? (res.data as { order?: unknown }).order : undefined;
      const order = OrderSchema.parse(rawOrder);
      set((state) => {
        const orders = state.data.orders;
        const nextOrders = orders.some((o) => o.id === order.id)
          ? orders.map((o) => (o.id === order.id ? order : o))
          : orders;
        return { ...state, data: { orders: nextOrders, order } };
      });
      return order;
    } catch (err) {
      console.error("[orders-store] getOrder error", err);
      set({ error: "Falha ao carregar pedido." });
      set((state) => ({ ...state, data: { ...state.data, order: null } }));
      return null;
    } finally {
      set({ loading: false });
    }
  },

  createOrder: async (tenant, input) => {
    set({ loading: true, error: "" });
    try {
      const res = await commerceFetchJson<{ ok: true; order: unknown }>(tenant, "/orders", {
        method: "POST",
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const code = extractApiErrorCode(res.payload);
        const message = mapOrdersErrorToMessage(code) || "Falha ao criar pedido.";
        set({ error: message });
        return null;
      }

      const rawOrder = isRecord(res.data) ? (res.data as { order?: unknown }).order : undefined;
      const order = OrderSchema.parse(rawOrder);
      set((state) => ({
        ...state,
        data: { ...state.data, order, orders: [order, ...state.data.orders.filter((o) => o.id !== order.id)] },
      }));
      return order;
    } catch (err) {
      console.error("[orders-store] createOrder error", err);
      set({ error: "Falha ao criar pedido." });
      return null;
    } finally {
      set({ loading: false });
    }
  },
}));

