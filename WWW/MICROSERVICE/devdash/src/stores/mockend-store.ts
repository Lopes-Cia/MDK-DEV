import { create } from "zustand";

type HealthResult = { ok: boolean; status: number };

type MockEndProcessState = {
  pid?: number;
  port?: number;
  baseUrl?: string;
  startedAt?: string;
  logFilePath?: string;
};

type MockEndProcessStatus = {
  running: boolean;
  state: MockEndProcessState | null;
};

type MockEndStoreState = {
  desiredUp: boolean;
  baseUrl: string;
  health: HealthResult;
  process: MockEndProcessStatus;
  isBusy: boolean;
  error: string;
};

type MockEndStoreActions = {
  toggleDesiredUp: () => Promise<void>;
  setBaseUrl: (baseUrl: string) => void;
  setInitialHealth: (health: HealthResult) => void;
  refresh: () => Promise<void>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  toggle: () => Promise<void>;
  clearError: () => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function fetchHealth(baseUrl: string): Promise<HealthResult> {
  try {
    const res = await fetch(`/api/mockend/health?baseUrl=${encodeURIComponent(baseUrl)}`, { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as unknown;
    if (!isRecord(data)) return { ok: false, status: 0 };
    const ok = typeof data.ok === "boolean" ? data.ok : Boolean(data.ok);
    const status = typeof data.status === "number" ? data.status : Number(data.status || 0);
    return { ok, status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function fetchProcessStatus(): Promise<MockEndProcessStatus> {
  const res = await fetch("/api/mockend/process", { cache: "no-store" });
  const data = (await res.json().catch(() => null)) as unknown;
  if (!isRecord(data)) return { running: false, state: null };
  const state = isRecord(data.state) ? (data.state as MockEndProcessState) : null;
  return { running: Boolean(data.running), state };
}

async function postAction(action: "start" | "stop") {
  const res = await fetch("/api/mockend/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => null) };
}

function extractBackendError(data: unknown) {
  if (!isRecord(data)) return "";
  const base = typeof data.error === "string" && data.error ? data.error : typeof data.status === "string" ? data.status : "";
  const details = isRecord(data.details) ? data.details : null;
  const message = details && typeof details.message === "string" ? details.message : "";
  const code = details && typeof details.code === "string" ? details.code : "";
  const tail = [code, message].filter(Boolean).join(" ");
  return [base, tail].filter(Boolean).join(" - ");
}

async function waitUntilHealthy(baseUrl: string, onUpdate: (health: HealthResult) => void) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const health = await fetchHealth(baseUrl);
    onUpdate(health);
    if (health.ok) return true;
    await new Promise((r) => setTimeout(r, 750));
  }
  return false;
}

export const useMockEndStore = create<MockEndStoreState & MockEndStoreActions>((set, get) => ({
  desiredUp: true,
  baseUrl: "http://localhost:4000",
  health: { ok: false, status: 0 },
  process: { running: false, state: null },
  isBusy: false,
  error: "",

  toggleDesiredUp: async () => {
    const next = !get().desiredUp;
    set((state) => ({ ...state, desiredUp: next }));
    if (next) await get().start();
    else await get().stop();
  },

  setBaseUrl: (baseUrl) => {
    set((state) => ({ ...state, baseUrl }));
  },

  setInitialHealth: (health) => {
    set((state) => ({ ...state, health }));
  },

  clearError: () => {
    set((state) => ({ ...state, error: "" }));
  },

  refresh: async () => {
    const { baseUrl } = get();
    const [health, process] = await Promise.all([fetchHealth(baseUrl), fetchProcessStatus()]);
    set((state) => ({ ...state, health, process }));
  },

  start: async () => {
    set((state) => ({ ...state, desiredUp: true, error: "", isBusy: true }));
    try {
      const { baseUrl } = get();
      const res = await postAction("start");
      if (!res.ok) {
        const reason = extractBackendError(res.data);
        set((state) => ({ ...state, error: `Falha ao iniciar o Mock-End${reason ? ` (${reason})` : ""}.` }));
        await get().refresh();
        return;
      }
      await waitUntilHealthy(baseUrl, (health) => set((state) => ({ ...state, health })));
      await get().refresh();
    } finally {
      set((state) => ({ ...state, isBusy: false }));
    }
  },

  stop: async () => {
    set((state) => ({ ...state, desiredUp: false, error: "", isBusy: true }));
    try {
      const res = await postAction("stop");
      if (!res.ok) {
        const reason = extractBackendError(res.data);
        set((state) => ({ ...state, error: `Falha ao parar o Mock-End${reason ? ` (${reason})` : ""}.` }));
      }
      await get().refresh();
    } finally {
      set((state) => ({ ...state, isBusy: false }));
    }
  },

  toggle: async () => {
    const running = get().process.running;
    if (running) await get().stop();
    else await get().start();
  },
}));
