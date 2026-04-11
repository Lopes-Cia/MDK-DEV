import Link from "next/link";

import { TenantSelect } from "./tenant-select";

type Props = {
  tenants: string[];
  selectedTenant: string;
};

export function TopNav({ tenants, selectedTenant }: Props) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            DEVDASH
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/sistema" className="text-zinc-700 hover:text-zinc-900">
              Sistema
            </Link>
            <Link href="/mock-end" className="text-zinc-700 hover:text-zinc-900">
              Mock-End
            </Link>
            <Link href="/builder" className="text-zinc-700 hover:text-zinc-900">
              Builder
            </Link>
            <Link href="/jobs" className="text-zinc-700 hover:text-zinc-900">
              Seeding/Jobs
            </Link>
            <Link href="/verificacoes" className="text-zinc-700 hover:text-zinc-900">
              Verificações
            </Link>
          </nav>
        </div>

        <TenantSelect tenants={tenants} selectedTenant={selectedTenant} />
      </div>
    </header>
  );
}
