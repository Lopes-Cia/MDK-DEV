"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (productId: number) => void;
  setQty: (productId: number, qty: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) => {
        const current = get().items;
        const existing = current.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            items: current.map((i) =>
              i.productId === item.productId ? { ...i, qty: i.qty + qty } : i
            ),
          });
          return;
        }
        set({ items: [...current, { ...item, qty }] });
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      setQty: (productId, qty) => {
        const safeQty = Math.max(0, Math.floor(qty));
        if (safeQty === 0) {
          set({ items: get().items.filter((i) => i.productId !== productId) });
          return;
        }
        set({
          items: get().items.map((i) => (i.productId === productId ? { ...i, qty: safeQty } : i)),
        });
      },
      clear: () => set({ items: [] }),
    }),
    { name: "mdk-cart-v1" }
  )
);

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((acc, item) => acc + item.price * item.qty, 0);
}

