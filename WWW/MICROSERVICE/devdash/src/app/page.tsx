import {
  CheckCircle2,
  Hammer,
  Layers,
  PackageSearch,
  Settings,
} from "lucide-react";

import { AppCard } from "@/app/_components/app-card";
import { MockEndMonitor } from "@/app/_components/mockend-monitor";
import { TenantMonitor } from "@/app/_components/tenant-monitor";
import { getSelectedTenant } from "@/lib/tenant";

export default async function Home() {
  const selectedTenant = await getSelectedTenant();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">DEVDASH</h1>
        <p className="text-sm text-muted-foreground">
          Painel rápido para operar o Mock-End, abrir o Builder e rodar scripts (allowlist).
        </p>
      </header>

      {!selectedTenant ? (
        <section className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          Selecione um tenant na barra lateral para habilitar links diretos (Mock-End/Builder).
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Status
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MockEndMonitor />
          <TenantMonitor />
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Atalhos
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AppCard
            title="Sistema"
            description="Links e informações gerais do DevDash."
            href="/sistema"
            icon={Settings}
          />
          <AppCard
            title="Mock-End"
            description="Health check, tenants detectados e links de endpoints."
            href="/mock-end"
            icon={PackageSearch}
          />
          <AppCard
            title="Builder"
            description="Link para /{tenant}/dashboard/builder (host via env)."
            href="/builder"
            icon={Layers}
          />
          <AppCard
            title="Seeding/Jobs"
            description="Rodar scripts allowlist do MOCK-END e ver logs."
            href="/jobs"
            icon={Hammer}
          />
          <AppCard
            title="Verificações"
            description="Espaço para checks rápidos (placeholder)."
            href="/verificacoes"
            icon={CheckCircle2}
          />
        </div>
      </section>
    </div>
  );
}
