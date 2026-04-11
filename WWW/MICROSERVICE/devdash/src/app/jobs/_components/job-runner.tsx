"use client";

import { useControlStore } from "@/stores/control-store";

import type { AllowedJobScript } from "@/lib/jobs/allowlist";
import { JOBS } from "@/lib/jobs/allowlist";

type RunResult = {
  ok: boolean;
  script: AllowedJobScript;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
  logFilePath: string;
};

export function JobRunner() {
  const STORE = useControlStore();
  const running = STORE.JOBSSTORE((s) => s.running);
  const result = STORE.JOBSSTORE((s) => s.result) as RunResult | null;
  const error = STORE.JOBSSTORE((s) => s.error);
  const run = STORE.JOBSSTORE((s) => s.run);
  const clear = STORE.JOBSSTORE((s) => s.clear);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {JOBS.map((job) => (
          <div key={job.script} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">{job.title}</div>
            <div className="mt-1 text-sm text-zinc-600">{job.description}</div>
            <button
              type="button"
              onClick={() => run(job.script).catch(() => null)}
              disabled={running}
              className="mt-3 inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {running ? "Executando..." : "Executar"}
            </button>
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <div className="font-semibold">Resultado</div>
              <div className="text-zinc-600">
                script: <span className="font-mono">{result.script}</span> · exitCode:{" "}
                <span className="font-mono">{result.exitCode}</span> · duração:{" "}
                <span className="font-mono">{result.durationMs}ms</span>
              </div>
            </div>
            <div
              className={[
                "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
                result.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
              ].join(" ")}
            >
              {result.ok ? "OK" : "Falhou"}
            </div>
          </div>

          <div className="mt-3 text-sm text-zinc-600">
            Log: <span className="font-mono">{result.logFilePath}</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-sm font-semibold">stdout</div>
              <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">
                {result.stdout || "(vazio)"}
              </pre>
            </div>
            <div>
              <div className="text-sm font-semibold">stderr</div>
              <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">
                {result.stderr || "(vazio)"}
              </pre>
            </div>
          </div>

          <button
            type="button"
            onClick={clear}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            Limpar
          </button>
        </div>
      ) : null}
    </div>
  );
}
