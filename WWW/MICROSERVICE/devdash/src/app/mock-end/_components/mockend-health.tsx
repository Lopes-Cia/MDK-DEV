"use client";

import { useEffect, useMemo } from "react";

import { useControlStore } from "@/stores/control-store";

type HealthResult = { ok: boolean; status: number };

export function MockEndHealth({ baseUrl, initialHealth }: { baseUrl: string; initialHealth: HealthResult }) {
  const STORE = useControlStore();

  const storeBaseUrl = STORE.MOCKSTORE((s) => s.baseUrl);
  const health = STORE.MOCKSTORE((s) => s.health);
  const process = STORE.MOCKSTORE((s) => s.process);
  const isBusy = STORE.MOCKSTORE((s) => s.isBusy);

  const setBaseUrl = STORE.MOCKSTORE((s) => s.setBaseUrl);
  const setInitialHealth = STORE.MOCKSTORE((s) => s.setInitialHealth);
  const refresh = STORE.MOCKSTORE((s) => s.refresh);
  const start = STORE.MOCKSTORE((s) => s.start);
  const stop = STORE.MOCKSTORE((s) => s.stop);

  const statusLabel = useMemo(() => {
    return health.ok ? `OK (${health.status})` : `Falhou (${health.status || "sem resposta"})`;
  }, [health.ok, health.status]);

  const statusClassName = useMemo(() => {
    return [
      "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
      health.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
    ].join(" ");
  }, [health.ok]);

  useEffect(() => {
    setBaseUrl(baseUrl);
    setInitialHealth(initialHealth);
    refresh().catch(() => null);
  }, [baseUrl, initialHealth, refresh, setBaseUrl, setInitialHealth]);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <div className="font-semibold">Health</div>
          <div className="text-zinc-600">{storeBaseUrl}/health</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={statusClassName}>{statusLabel}</div>

          {process.running ? (
            <button
              type="button"
              onClick={() => stop().catch(() => null)}
              disabled={isBusy}
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
            >
              {isBusy ? "Parando..." : "Stop"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => start().catch(() => null)}
              disabled={isBusy}
              className="inline-flex items-center rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isBusy ? "Iniciando..." : "Start"}
            </button>
          )}

          <button
            type="button"
            onClick={() => refresh().catch(() => null)}
            disabled={isBusy}
            className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          >
            Atualizar
          </button>
        </div>
      </div>
    </section>
  );
}
