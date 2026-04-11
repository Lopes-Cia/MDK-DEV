"use client";

import * as React from "react";

import { ReactQueryProvider } from "./react-query-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}

