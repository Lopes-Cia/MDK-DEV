"use client";

import * as React from "react";

const TenantRuntimeContext = React.createContext<{ tenant: string } | null>(null);

export function TenantRuntimeProvider({ tenant, children }: { tenant: string; children: React.ReactNode }) {
  return <TenantRuntimeContext.Provider value={{ tenant }}>{children}</TenantRuntimeContext.Provider>;
}

export function useTenant() {
  const ctx = React.useContext(TenantRuntimeContext);
  if (!ctx) throw new Error("TenantRuntimeProvider missing");
  return ctx.tenant;
}

