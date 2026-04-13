"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StateCard } from "@/components/ui/state-card";
import { useAuthStore } from "@/stores/auth-store";

type MinhaContaClientProps = {
  tenant: string;
  title?: string;
};

export function MinhaContaClient({ tenant, title = "Minha conta" }: MinhaContaClientProps) {
  const router = useRouter();

  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const data = useAuthStore((s) => s.data);
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);
  const reset = useAuthStore((s) => s.reset);

  const [checked, setChecked] = React.useState(false);

  const isAuthenticated =
    data.session?.authenticated === true && data.session.tenant === tenant && Boolean(data.user);

  React.useEffect(() => {
    // Evita “vazar” sessão entre tenants na store global.
    if (data.session && data.session.tenant !== tenant) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      await refreshMe(tenant);
      if (alive) setChecked(true);
    })();
    return () => {
      alive = false;
    };
  }, [tenant, refreshMe]);

  React.useEffect(() => {
    if (!checked) return;
    if (loading) return;
    if (isAuthenticated) return;

    const next = encodeURIComponent(`/${tenant}/minha-conta`);
    router.replace(`/${tenant}/login?next=${next}`);
  }, [checked, loading, isAuthenticated, router, tenant]);

  async function handleLogout() {
    clearError();
    await logout(tenant);
    router.replace(`/${tenant}/login`);
  }

  const user = data.user;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <div className="mt-1 text-sm text-muted-foreground">Dados da sessão mock do MVP.</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void refreshMe(tenant)} disabled={loading}>
              {loading ? "Atualizando…" : "Atualizar"}
            </Button>
            <Button variant="ghost" onClick={handleLogout} disabled={loading}>
              Sair
            </Button>
          </div>
        </div>

        {!checked || loading ? (
          <StateCard
            className="mt-8"
            title="Carregando"
            tone="muted"
            description="Carregando sessão…"
          />
        ) : error ? (
          <StateCard
            className="mt-8"
            title="Não foi possível carregar a sessão"
            tone="error"
            description={error}
            actions={
              <>
                <Button onClick={() => void refreshMe(tenant)} disabled={loading}>
                  Tentar novamente
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/${tenant}/login`}>Ir para login</Link>
                </Button>
              </>
            }
          />
        ) : !isAuthenticated ? (
          <StateCard
            className="mt-8"
            title="Login necessário"
            tone="muted"
            description="Você precisa estar autenticado. Redirecionando para login…"
          />
        ) : !user ? (
          <StateCard
            className="mt-8"
            title="Sessão incompleta"
            tone="muted"
            description="Sessão ativa, mas sem dados do usuário."
            actions={
              <Button onClick={() => void refreshMe(tenant)} disabled={loading}>
                Recarregar
              </Button>
            }
          />
        ) : (
          <div className="mt-8 grid gap-6">
            <Card>
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle className="text-lg">Perfil</CardTitle>
                  <CardDescription>Informações do usuário logado.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span> {user.name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span> {user.email}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle className="text-lg">Próximos passos</CardTitle>
                  <CardDescription>Navegação do MVP.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild>
                    <Link href={`/${tenant}/pedidos`}>Ver pedidos</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/${tenant}/`}>Voltar para home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
