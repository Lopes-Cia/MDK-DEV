import Link from "next/link";
import { getSelectedTenant } from "@/lib/tenant";
import { MockEndToggle } from "@/app/sistema/_components/mockend-toggle";

async function checkHealth(baseUrl: string) {
  try {
    const res = await fetch(`${baseUrl}/health`, { cache: "no-store" });
    if (!res.ok) return { ok: false as const, status: res.status };
    const data = (await res.json()) as { ok?: boolean };
    return { ok: Boolean(data?.ok), status: res.status };
  } catch {
    return { ok: false as const, status: 0 };
  }
}

export default async function SistemaPage() {
  const selectedTenant = await getSelectedTenant();
  const mockEndBaseUrl = process.env.DEVDASH_MOCKEND_BASE_URL ?? "http://localhost:4000";
  const builderBaseUrl = process.env.DEVDASH_BUILDER_BASE_URL ?? "http://localhost:3000";
  const health = await checkHealth(mockEndBaseUrl);

  const builderUrl = selectedTenant ? `${builderBaseUrl}/${selectedTenant}/dashboard/builder` : "";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-lg font-semibold tracking-tight">Sistema</h1>
        <p className="text-sm text-zinc-600">Atalhos e informações gerais do DevDash.</p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Tenant</div>
        <div className="mt-1 text-sm text-zinc-600">
          {selectedTenant ? selectedTenant : "Nenhum tenant selecionado."}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Config</div>
        <dl className="mt-3 grid gap-3">
          <div className="grid gap-1">
            <dt className="text-xs font-medium text-zinc-500">DEVDASH_MOCKEND_BASE_URL</dt>
            <dd className="font-mono text-xs">{mockEndBaseUrl}</dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-xs font-medium text-zinc-500">DEVDASH_BUILDER_BASE_URL</dt>
            <dd className="font-mono text-xs">{builderBaseUrl}</dd>
          </div>
        </dl>
      </section>

      <MockEndToggle baseUrl={mockEndBaseUrl} initialHealth={health} />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Links</div>
        <div className="mt-3 grid gap-2 text-sm">
          <Link className="text-blue-700 hover:underline" href="/mock-end">
            Abrir Mock-End
          </Link>
          <Link className="text-blue-700 hover:underline" href="/jobs">
            Abrir Seeding/Jobs
          </Link>
          <Link className="text-blue-700 hover:underline" href="/verificacoes">
            Abrir Verificações
          </Link>
          {selectedTenant ? (
            <a className="text-blue-700 hover:underline" href={builderUrl} target="_blank" rel="noreferrer">
              Abrir Builder (externo)
            </a>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Selecione um tenant para habilitar o link externo do Builder.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
