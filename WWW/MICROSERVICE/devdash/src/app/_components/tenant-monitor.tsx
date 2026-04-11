"use client";

import { useMemo } from "react";
import Link from "next/link";

import { useControlStore } from "@/stores/control-store";
import { Power, Settings } from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";

export function TenantMonitor() {
  const STORE = useControlStore();

  const selectedTenant = STORE.TENANTSTORE((s) => s.selectedTenant);
  const baseUrl = STORE.TENANTSTORE((s) => s.n1.baseUrl);
  const up = STORE.TENANTSTORE((s) => s.n1.up);
  const process = STORE.TENANTSTORE((s) => s.n1.process);
  const desiredUp = STORE.TENANTSTORE((s) => s.n1.desiredUp);
  const isBusy = STORE.TENANTSTORE((s) => s.n1.isBusy);
  const error = STORE.TENANTSTORE((s) => s.n1.error);
  const toggleDesiredUp = STORE.TENANTSTORE((s) => s.toggleN1DesiredUp);

  const status = useMemo(() => {
    if (!selectedTenant) return "NO_TENANT";
    if (!baseUrl) return "UNKNOWN";
    if (process.running && up.ok) return "UP";
    if (process.running && !up.ok) return "UNHEALTHY";
    return "DOWN";
  }, [baseUrl, process.running, selectedTenant, up.ok]);
  const transition = useMemo(() => {
    if (!isBusy) return "";
    return desiredUp ? "STARTING" : "STOPPING";
  }, [desiredUp, isBusy]);
  const statusVariant = useMemo(() => {
    if (status === "UP") return "success";
    if (status === "UNHEALTHY") return "warning";
    if (status === "UNKNOWN") return "secondary";
    if (status === "NO_TENANT") return "secondary";
    return "destructive";
  }, [status]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="truncate">TENANT / N1</span>
          <Badge variant={statusVariant}>{status}</Badge>
          {transition ? <Badge variant="secondary">{transition}</Badge> : null}
          <Badge variant="outline">{desiredUp ? "ON" : "OFF"}</Badge>
        </CardTitle>
        <CardDescription className="grid gap-1">
          <div className="truncate">
            <span className="text-muted-foreground">Tenant:</span>{" "}
            <span className="font-mono text-foreground">{selectedTenant || "—"}</span>
          </div>
          <div className="truncate">
            <span className="text-muted-foreground">Base:</span>{" "}
            <span className="font-mono text-foreground">{baseUrl || "—"}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Real: {status}</Badge>
            <Badge variant="outline">Desejado: {desiredUp ? "ON" : "OFF"}</Badge>
          </div>
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label="Configurações"
                  render={<Link href="/sistema" />}
                  size="icon"
                  variant="outline"
                >
                  <Settings aria-hidden="true" />
                </Button>
              }
            />
            <TooltipPopup side="bottom">Configurações</TooltipPopup>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label={desiredUp ? "Desligar" : "Ligar"}
                  className={
                    isBusy
                      ? "bg-foreground text-background"
                      : desiredUp
                        ? "bg-success text-white hover:bg-success/90"
                        : "bg-destructive text-white hover:bg-destructive/90"
                  }
                  loading={isBusy}
                  onClick={() => toggleDesiredUp().catch(() => null)}
                  size="icon"
                >
                  <Power aria-hidden="true" />
                </Button>
              }
            />
            <TooltipPopup side="bottom">{desiredUp ? "Desligar" : "Ligar"}</TooltipPopup>
          </Tooltip>
        </CardAction>
      </CardHeader>

      {process.state?.pid || error ? (
        <CardFooter className="pt-0 text-xs text-muted-foreground">
          {process.state?.pid ? (
            <span>
              PID: <span className="font-mono">{process.state.pid}</span>
            </span>
          ) : null}
          {process.state?.pid && error ? <span className="mx-2">•</span> : null}
          {error ? <span className="truncate text-destructive-foreground">{error}</span> : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
