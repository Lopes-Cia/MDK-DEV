"use client";

import { create } from "zustand";

import { PublicUserSchema, type PublicUser } from "@/lib/commerce/schemas";

type AuthSession = {
  tenant: string;
  authenticated: boolean;
};

type AuthData = {
  session: AuthSession | null;
  user: PublicUser | null;
};

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  email: string;
  password: string;
  name: string;
};

type AuthStoreState = {
  loading: boolean;
  error: string;
  data: AuthData;
};

type AuthStoreActions = {
  login: (tenant: string, input: LoginInput) => Promise<boolean>;
  register: (tenant: string, input: RegisterInput) => Promise<boolean>;
  logout: (tenant: string) => Promise<void>;
  refreshMe: (tenant: string) => Promise<boolean>;
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

function mapAuthErrorToMessage(code: string) {
  switch (code) {
    case "invalid_credentials":
      return "Email ou senha inválidos.";
    case "email_already_registered":
      return "Este email já está cadastrado.";
    case "not_authenticated":
    case "invalid_session":
    case "session_expired":
      return "Sua sessão expirou. Faça login novamente.";
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

export const useAuthStore = create<AuthStoreState & AuthStoreActions>((set, get) => ({
  loading: false,
  error: "",
  data: { session: null, user: null },

  clearError: () => set({ error: "" }),

  reset: () => set({ loading: false, error: "", data: { session: null, user: null } }),

  login: async (tenant, input) => {
    set({ loading: true, error: "" });
    try {
      const res = await commerceFetchJson<{ ok: true; user: unknown }>(tenant, "/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const code = extractApiErrorCode(res.payload);
        const message = mapAuthErrorToMessage(code) || "Falha ao fazer login.";
        set({ error: message });
        return false;
      }

      const user = PublicUserSchema.parse((res.data as { user: unknown }).user);
      set({ data: { session: { tenant, authenticated: true }, user } });
      return true;
    } catch (err) {
      console.error("[auth-store] login error", err);
      set({ error: "Falha ao fazer login." });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  register: async (tenant, input) => {
    set({ loading: true, error: "" });
    try {
      const res = await commerceFetchJson<{ ok: true; user: unknown }>(tenant, "/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const code = extractApiErrorCode(res.payload);
        const message = mapAuthErrorToMessage(code) || "Falha ao criar conta.";
        set({ error: message });
        return false;
      }

      const user = PublicUserSchema.parse((res.data as { user: unknown }).user);
      set({ data: { session: { tenant, authenticated: true }, user } });
      return true;
    } catch (err) {
      console.error("[auth-store] register error", err);
      set({ error: "Falha ao criar conta." });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  logout: async (tenant) => {
    set({ loading: true, error: "" });
    try {
      const res = await commerceFetchJson<{ ok: true }>(tenant, "/logout", { method: "POST" });
      if (!res.ok) {
        const code = extractApiErrorCode(res.payload);
        const message = mapAuthErrorToMessage(code) || "Falha ao sair.";
        set({ error: message });
        return;
      }
      set({ data: { session: null, user: null } });
    } catch (err) {
      console.error("[auth-store] logout error", err);
      set({ error: "Falha ao sair." });
    } finally {
      set({ loading: false });
    }
  },

  refreshMe: async (tenant) => {
    set({ loading: true, error: "" });
    try {
      const res = await commerceFetchJson<{ ok: true; user: unknown }>(tenant, "/me", { method: "GET" });
      if (!res.ok) {
        // 401/403 => sessão inválida (não é “erro” para UI, apenas estado anon).
        if (res.status === 401 || res.status === 403) {
          set({ data: { session: null, user: null } });
          return false;
        }
        const code = extractApiErrorCode(res.payload);
        const message = mapAuthErrorToMessage(code) || "Falha ao atualizar sessão.";
        set({ error: message });
        return false;
      }

      const user = PublicUserSchema.parse((res.data as { user: unknown }).user);
      set({ data: { session: { tenant, authenticated: true }, user } });
      return true;
    } catch (err) {
      console.error("[auth-store] refreshMe error", err);
      set({ error: "Falha ao atualizar sessão." });
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));

