"use client";

import { useEffect } from "react";

import { useControlStore } from "@/stores/control-store";

type Props = {
  mockEndBaseUrl: string;
  n1BaseUrl: string;
  selectedTenant: string;
};

export function ControlApp({ mockEndBaseUrl, n1BaseUrl, selectedTenant }: Props) {
  const STORE = useControlStore();

  const mockDesiredUp = STORE.MOCKSTORE((s) => s.desiredUp);
  const mockRunning = STORE.MOCKSTORE((s) => s.process.running);
  const mockBusy = STORE.MOCKSTORE((s) => s.isBusy);
  const mockSetBaseUrl = STORE.MOCKSTORE((s) => s.setBaseUrl);
  const mockRefresh = STORE.MOCKSTORE((s) => s.refresh);
  const mockStart = STORE.MOCKSTORE((s) => s.start);
  const mockStop = STORE.MOCKSTORE((s) => s.stop);

  const n1DesiredUp = STORE.TENANTSTORE((s) => s.n1.desiredUp);
  const n1Running = STORE.TENANTSTORE((s) => s.n1.process.running);
  const n1Busy = STORE.TENANTSTORE((s) => s.n1.isBusy);
  const n1SetBaseUrl = STORE.TENANTSTORE((s) => s.setN1BaseUrl);
  const n1Refresh = STORE.TENANTSTORE((s) => s.refreshN1);
  const n1Start = STORE.TENANTSTORE((s) => s.startN1);
  const n1Stop = STORE.TENANTSTORE((s) => s.stopN1);
  const setTenant = STORE.TENANTSTORE((s) => s.setSelectedTenant);

  useEffect(() => {
    setTenant(selectedTenant);
  }, [selectedTenant, setTenant]);

  useEffect(() => {
    mockSetBaseUrl(mockEndBaseUrl);
    n1SetBaseUrl(n1BaseUrl);
    Promise.all([mockRefresh(), n1Refresh()]).catch(() => null);
  }, [mockEndBaseUrl, mockRefresh, mockSetBaseUrl, n1BaseUrl, n1Refresh, n1SetBaseUrl]);

  useEffect(() => {
    const id = setInterval(() => {
      Promise.all([mockRefresh(), n1Refresh()]).catch(() => null);
    }, 5_000);
    return () => clearInterval(id);
  }, [mockRefresh, n1Refresh]);

  useEffect(() => {
    if (mockDesiredUp && !mockRunning && !mockBusy) {
      mockStart().catch(() => null);
    }
    if (!mockDesiredUp && mockRunning && !mockBusy) {
      mockStop().catch(() => null);
    }
  }, [mockBusy, mockDesiredUp, mockRunning, mockStart, mockStop]);

  useEffect(() => {
    if (n1DesiredUp && !n1Running && !n1Busy) {
      n1Start().catch(() => null);
    }
    if (!n1DesiredUp && n1Running && !n1Busy) {
      n1Stop().catch(() => null);
    }
  }, [n1Busy, n1DesiredUp, n1Running, n1Start, n1Stop]);

  return null;
}
