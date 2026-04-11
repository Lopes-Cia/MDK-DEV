"use client";

import { useEffect, useMemo } from "react";

import { useControlStore } from "@/stores/control-store";

type HealthResult = { ok: boolean; status: number };
export function MockEndToggle({ baseUrl, initialHealth }: { baseUrl: string; initialHealth: HealthResult }) {
  const STORE = useControlStore();

  const storeBaseUrl = STORE.MOCKSTORE((s) => s.baseUrl);
  const health = STORE.MOCKSTORE((s) => s.health);
  const process = STORE.MOCKSTORE((s) => s.process);
  const isBusy = STORE.MOCKSTORE((s) => s.isBusy);
  const error = STORE.MOCKSTORE((s) => s.error);

  const setBaseUrl = STORE.MOCKSTORE((s) => s.setBaseUrl);
  const setInitialHealth = STORE.MOCKSTORE((s) => s.setInitialHealth);
  const refresh = STORE.MOCKSTORE((s) => s.refresh);
  const toggle = STORE.MOCKSTORE((s) => s.toggle);

  const isUp = useMemo(() => process.running && health.ok, [health.ok, process.running]);

  const statusLabel = useMemo(() => (isUp ? "UP" : "DOWN"), [isUp]);
  const statusClassName = useMemo(() => {
    return [
      "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
      isUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
    ].join(" ");
  }, [isUp]);

  useEffect(() => {
    setBaseUrl(baseUrl);
    setInitialHealth(initialHealth);
    refresh().catch(() => null);
  }, [baseUrl, initialHealth, refresh, setBaseUrl, setInitialHealth]);

  useEffect(() => {
    const id = setInterval(() => {
      refresh().catch(() => null);
    }, 3_000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <div className="font-semibold">MOCK-END</div>
          <div className="text-zinc-600">{storeBaseUrl}/health</div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={statusClassName}>{statusLabel}</div>

          <button
            type="button"
            role="switch"
            aria-checked={process.running}
            aria-label={process.running ? "Parar Mock-End" : "Iniciar Mock-End"}
            onClick={() => toggle().catch(() => null)}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50"
          >
            {isBusy ? <span className="text-zinc-600">{process.running ? "Parando..." : "Iniciando..."}</span> : null}
            <span
              className={[
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                process.running ? "bg-zinc-900" : "bg-zinc-200",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                  process.running ? "translate-x-5" : "translate-x-1",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </div>

      {process.running && process.state?.pid ? (
        <div className="mt-3 text-xs text-zinc-600">
          PID: <span className="font-mono">{process.state.pid}</span>
          {process.state.startedAt ? (
            <>
              {" "}
              · Iniciado em: <span className="font-mono">{process.state.startedAt}</span>
            </>
          ) : null}
          {process.state.logFilePath ? (
            <>
              {" "}
              · Log: <span className="font-mono">{process.state.logFilePath}</span>
            </>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      ) : null}
    </section>
  );
}
