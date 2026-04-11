import { create } from "zustand";

type SeedState = {
  count: number;
  inc: () => void;
};

export const useSeedStore = create<SeedState>((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));
