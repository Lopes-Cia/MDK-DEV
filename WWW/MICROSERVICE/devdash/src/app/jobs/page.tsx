import { JobRunner } from "@/app/jobs/_components/job-runner";
import { getMockEndRoot } from "@/lib/mockend/root";

export default function JobsPage() {
  const cwd = getMockEndRoot();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-lg font-semibold tracking-tight">Seeding/Jobs</h1>
        <p className="text-sm text-zinc-600">
          Execução segura via allowlist dos scripts do MOCK-END (cwd fixo) + logs.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
        <div className="font-semibold">CWD</div>
        <div className="mt-1 font-mono text-xs">{cwd}</div>
      </section>

      <JobRunner />
    </div>
  );
}

