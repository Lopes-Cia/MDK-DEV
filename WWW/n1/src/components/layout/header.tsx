import Link from "next/link";
import { headers } from "next/headers";

import { AuthLinksClient } from "@/components/layout/auth-links-client";

async function getBasePathFromRequest(tenant: string) {
  const host = (await headers()).get("host") ?? "";
  const hostname = host.split(":")[0] ?? host;
  if (hostname === "lvh.me" || hostname.endsWith(".lvh.me")) return "";
  return `/${tenant}`;
}

export async function Header({
  tenant,
  title,
}: {
  tenant: string;
  title: string;
}) {
  const basePath = await getBasePathFromRequest(tenant);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`${basePath}/`} className="truncate text-sm font-semibold tracking-tight">
            {title}
          </Link>
          <nav className="hidden items-center gap-1.5 sm:flex">
            <Link
              href={`${basePath}/`}
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Home
            </Link>
            <Link
              href={`${basePath}/carrinho`}
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Carrinho
            </Link>
          </nav>
        </div>

        <AuthLinksClient tenant={tenant} basePath={basePath} />
      </div>
    </header>
  );
}

