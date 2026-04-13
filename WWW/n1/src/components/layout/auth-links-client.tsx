"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

type AuthLinksClientProps = {
  tenant: string;
  basePath: string;
};

export function AuthLinksClient({ tenant, basePath }: AuthLinksClientProps) {
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const data = useAuthStore((s) => s.data);
  const refreshMe = useAuthStore((s) => s.refreshMe);

  const isAuthenticated =
    data.session?.authenticated === true && data.session.tenant === tenant && Boolean(data.user);

  React.useEffect(() => {
    void refreshMe(tenant);
  }, [tenant, refreshMe]);

  if (loading && !isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" className="h-9 px-3" disabled title={error || undefined}>
          Carregando…
        </Button>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" className="h-9 px-3">
          <Link href={`${basePath}/minha-conta`}>Minha conta</Link>
        </Button>
        <Button asChild variant="ghost" className="h-9 px-3">
          <Link href={`${basePath}/pedidos`}>Pedidos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" className="h-9 px-3">
        <Link href={`${basePath}/login`}>Login</Link>
      </Button>
      <Button asChild variant="outline" className="h-9 px-3">
        <Link href={`${basePath}/cadastro`}>Cadastro</Link>
      </Button>
    </div>
  );
}
