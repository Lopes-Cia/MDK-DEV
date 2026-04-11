import { create } from "zustand";

import type { AllowedJobScript } from "@/lib/jobs/allowlist";

type RunResult = {
  ok: boolean;
  script: AllowedJobScript;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
  logFilePath: string;
};

type JobsStoreState = {
  running: boolean;
  result: RunResult | null;
  error: string;
};

type JobsStoreActions = {
  clear: () => void;
  run: (script: AllowedJobScript) => Promise<void>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export const useJobsStore = create<JobsStoreState & JobsStoreActions>((set) => ({
  running: false,
  result: null,
  error: "",

  clear: () => set({ result: null, error: "" }),

  run: async (script) => {
    set({ running: true, result: null, error: "" });
    try {
      const res = await fetch("/api/jobs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      const data = (await res.json().catch(() => null)) as unknown;

      if (!res.ok) {
        const msg =
          isRecord(data) && typeof data.error === "string" && data.error
            ? data.error
            : "Falha ao executar o job (ver console/server).";
        set({ error: msg });
        return;
      }

      if (!isRecord(data) || typeof data.script !== "string") {
        set({ error: "Resposta inválida ao executar o job." });
        return;
      }

      set({ result: data as RunResult });
    } catch {
      set({ error: "Falha de rede ao executar o job." });
    } finally {
      set({ running: false });
    }
  },
}));

