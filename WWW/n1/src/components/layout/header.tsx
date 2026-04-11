import Link from "next/link";
import { headers } from "next/headers";

import { Button } from "@/components/ui/button";

async function getBasePathFromRequest(tenant: string) {
  const host = (await headers()).get("host") ?? "";
  const hostname = host.split(":")[0] ?? host;
  if (hostname === "lvh.me" || hostname.endsWith(".lvh.me")) return "";
  return `/${tenant}`;
}

export async function Header({
  tenant,
  title,
  showDevShortcut = false,
}: {
  tenant: string;
  title: string;
  showDevShortcut?: boolean;
}) {
  const basePath = await getBasePathFromRequest(tenant);

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4">
          <Link href={`${basePath}/`} className="text-sm font-semibold tracking-tight">
            {title}
          </Link>
          <nav className="hidden items-center gap-2 sm:flex">
            <Link href={`${basePath}/`} className="text-sm text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <Link
              href={`${basePath}/carrinho`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Carrinho
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" className="h-9 px-3">
            Login
          </Button>
          <Button variant="outline" className="h-9 px-3">
            Cadastro
          </Button>
          {showDevShortcut ? (
            <Link
              href={`${basePath}/dashboard/builder`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm hover:bg-accent hover:text-accent-foreground"
              aria-label="Modo dev"
            >
              Dev
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

