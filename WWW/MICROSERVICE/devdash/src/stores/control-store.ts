import { create } from "zustand";
import { useJobsStore } from "./jobs-store";
import { useMockEndStore } from "./mockend-store";
import { useSeedStore } from "./seed-store";
import { useTenantStore } from "./tenant-store";

export const JOBS_STORE = "JOBS-STORE" as const;
export const MOCKEND_STORE = "MOCKEND-STORE" as const;
export const SEED_STORE = "SEED-STORE" as const;
export const TENANT_STORE = "TENANT-STORE" as const;

type ControlState = {
  count: number;
  inc: () => void;
  JOBSSTORE: typeof useJobsStore;
  MOCKSTORE: typeof useMockEndStore;
  SEEDSTORE: typeof useSeedStore;
  TENANTSTORE: typeof useTenantStore;
};

export const useControlStore = create<ControlState>((set) => ({
  count: 0,
  inc: () => set((s) => ({ ...s, count: s.count + 1 })),
  JOBSSTORE: useJobsStore,
  MOCKSTORE: useMockEndStore,
  SEEDSTORE: useSeedStore,
  TENANTSTORE: useTenantStore,
}));
