import Link from "next/link";

import { getMockEndRoot } from "@/lib/mockend/root";
import { listTenants } from "@/lib/mockend/tenants";
import { getSelectedTenant } from "@/lib/tenant";
import { MockEndHealth } from "@/app/mock-end/_components/mockend-health";

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

export default async function MockEndPage() {
  const baseUrl = process.env.DEVDASH_MOCKEND_BASE_URL ?? "http://localhost:4000";
  const health = await checkHealth(baseUrl);

  const root = getMockEndRoot();
  const tenants = await listTenants();
  const selectedTenant = await getSelectedTenant();

  const apiBase = `${baseUrl}/api/${selectedTenant}/catalogo`;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-lg font-semibold tracking-tight">Mock-End</h1>
        <p className="text-sm text-zinc-600">
          Health, tenants detectados no filesystem e links de endpoints principais.
        </p>
      </header>

      <MockEndHealth baseUrl={baseUrl} initialHealth={health} />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Tenants (filesystem)</div>
        <div className="mt-1 text-sm text-zinc-600">Root: {root}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {tenants.length ? (
            tenants.map((t) => (
              <span
                key={t}
                className={[
                  "rounded-full border px-3 py-1 text-sm",
                  selectedTenant === t
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-800",
                ].join(" ")}
              >
                {t}
              </span>
            ))
          ) : (
            <span className="text-sm text-zinc-600">Nenhum tenant encontrado.</span>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Endpoints principais</div>
        {!selectedTenant ? (
          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Selecione um tenant para montar os links de API.
          </div>
        ) : (
          <div className="mt-3 grid gap-2">
            <a
              className="text-sm text-blue-700 hover:underline"
              href={`${apiBase}/categorias`}
              target="_blank"
              rel="noreferrer"
            >
              {apiBase}/categorias
            </a>
            <a
              className="text-sm text-blue-700 hover:underline"
              href={`${apiBase}/produtos`}
              target="_blank"
              rel="noreferrer"
            >
              {apiBase}/produtos
            </a>
          </div>
        )}

        <div className="mt-4 text-sm text-zinc-600">
          Voltar para <Link href="/">Home</Link>.
        </div>
      </section>
    </div>
  );
}
