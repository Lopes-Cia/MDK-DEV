import { getSelectedTenant } from "@/lib/tenant";

export default async function BuilderPage() {
  const selectedTenant = await getSelectedTenant();
  const baseUrl = process.env.DEVDASH_BUILDER_BASE_URL ?? "http://localhost:3000";

  const url = selectedTenant ? `${baseUrl}/${selectedTenant}/dashboard/builder` : "";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-lg font-semibold tracking-tight">Builder</h1>
        <p className="text-sm text-zinc-600">
          Link para o builder no app existente (host configurável via env).
        </p>
      </header>

      {!selectedTenant ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          Selecione um tenant para montar o link do Builder.
        </div>
      ) : (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold">Link</div>
          <div className="mt-2">
            <a className="text-sm text-blue-700 hover:underline" href={url} target="_blank" rel="noreferrer">
              {url}
            </a>
          </div>
          <div className="mt-2 text-sm text-zinc-600">
            Base URL: <span className="font-mono">{baseUrl}</span>
          </div>
        </section>
      )}
    </div>
  );
}
