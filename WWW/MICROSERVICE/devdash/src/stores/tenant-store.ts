import { create } from "zustand";

type UpResult = { ok: boolean; status: number };

type N1ProcessState = {
  pid?: number;
  port?: number;
  baseUrl?: string;
  startedAt?: string;
  logFilePath?: string;
};

type N1ProcessStatus = {
  running: boolean;
  state: N1ProcessState | null;
};

type TenantStoreState = {
  selectedTenant: string;
  n1: {
    desiredUp: boolean;
    baseUrl: string;
    up: UpResult;
    process: N1ProcessStatus;
    isBusy: boolean;
    error: string;
  };
};

type TenantStoreActions = {
  setSelectedTenant: (tenant: string) => void;

  setN1BaseUrl: (baseUrl: string) => void;
  toggleN1DesiredUp: () => Promise<void>;
  refreshN1: () => Promise<void>;
  startN1: () => Promise<void>;
  stopN1: () => Promise<void>;
  toggleN1: () => Promise<void>;
  clearN1Error: () => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function fetchUp(baseUrl: string): Promise<UpResult> {
  try {
    const res = await fetch(`/api/n1/up?baseUrl=${encodeURIComponent(baseUrl)}`, { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as unknown;
    if (!isRecord(data)) return { ok: false, status: 0 };
    const ok = typeof data.ok === "boolean" ? data.ok : Boolean(data.ok);
    const status = typeof data.status === "number" ? data.status : Number(data.status || 0);
    return { ok, status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function fetchN1ProcessStatus(): Promise<N1ProcessStatus> {
  const res = await fetch("/api/n1/process", { cache: "no-store" });
  const data = (await res.json().catch(() => null)) as unknown;
  if (!isRecord(data)) return { running: false, state: null };
  const state = isRecord(data.state) ? (data.state as N1ProcessState) : null;
  return { running: Boolean(data.running), state };
}

async function postN1Action(action: "start" | "stop") {
  const res = await fetch("/api/n1/process", {
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

async function waitUntilUp(baseUrl: string, onUpdate: (up: UpResult) => void) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const up = await fetchUp(baseUrl);
    onUpdate(up);
    if (up.ok) return true;
    await new Promise((r) => setTimeout(r, 750));
  }
  return false;
}

export const useTenantStore = create<TenantStoreState & TenantStoreActions>((set, get) => ({
  selectedTenant: "",
  n1: {
    desiredUp: true,
    baseUrl: "http://localhost:3000",
    up: { ok: false, status: 0 },
    process: { running: false, state: null },
    isBusy: false,
    error: "",
  },

  setSelectedTenant: (tenant) => {
    set((state) => ({ ...state, selectedTenant: tenant }));
  },

  setN1BaseUrl: (baseUrl) => {
    set((state) => ({ ...state, n1: { ...state.n1, baseUrl } }));
  },

  toggleN1DesiredUp: async () => {
    const next = !get().n1.desiredUp;
    set((state) => ({ ...state, n1: { ...state.n1, desiredUp: next } }));
    if (next) await get().startN1();
    else await get().stopN1();
  },

  clearN1Error: () => {
    set((state) => ({ ...state, n1: { ...state.n1, error: "" } }));
  },

  refreshN1: async () => {
    const { baseUrl } = get().n1;
    const [up, process] = await Promise.all([fetchUp(baseUrl), fetchN1ProcessStatus()]);
    set((state) => ({ ...state, n1: { ...state.n1, up, process } }));
  },

  startN1: async () => {
    set((state) => ({ ...state, n1: { ...state.n1, desiredUp: true, error: "", isBusy: true } }));
    try {
      const { baseUrl } = get().n1;
      const res = await postN1Action("start");
      if (!res.ok) {
        const reason = extractBackendError(res.data);
        set((state) => ({
          ...state,
          n1: { ...state.n1, error: `Falha ao iniciar o N1${reason ? ` (${reason})` : ""}.` },
        }));
        await get().refreshN1();
        return;
      }
      await waitUntilUp(baseUrl, (up) => set((state) => ({ ...state, n1: { ...state.n1, up } })));
      await get().refreshN1();
    } finally {
      set((state) => ({ ...state, n1: { ...state.n1, isBusy: false } }));
    }
  },

  stopN1: async () => {
    set((state) => ({ ...state, n1: { ...state.n1, desiredUp: false, error: "", isBusy: true } }));
    try {
      const res = await postN1Action("stop");
      if (!res.ok) {
        const reason = extractBackendError(res.data);
        set((state) => ({ ...state, n1: { ...state.n1, error: `Falha ao parar o N1${reason ? ` (${reason})` : ""}.` } }));
      }
      await get().refreshN1();
    } finally {
      set((state) => ({ ...state, n1: { ...state.n1, isBusy: false } }));
    }
  },

  toggleN1: async () => {
    const running = get().n1.process.running;
    if (running) await get().stopN1();
    else await get().startN1();
  },
}));
