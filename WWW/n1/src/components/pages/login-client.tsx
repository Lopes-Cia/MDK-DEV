"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

type LoginClientProps = {
  tenant: string;
  title?: string;
};

export function LoginClient({ tenant, title = "Login" }: LoginClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const data = useAuthStore((s) => s.data);
  const login = useAuthStore((s) => s.login);
  const clearError = useAuthStore((s) => s.clearError);
  const reset = useAuthStore((s) => s.reset);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const isAuthenticated =
    data.session?.authenticated === true && data.session.tenant === tenant && Boolean(data.user);

  React.useEffect(() => {
    // Evita “vazar” sessão entre tenants na store global.
    if (data.session && data.session.tenant !== tenant) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  const nextParam = searchParams.get("next");
  const nextUrl = nextParam && nextParam.startsWith("/") ? nextParam : `/${tenant}/minha-conta`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    const ok = await login(tenant, { email: email.trim(), password });
    if (ok) router.replace(nextUrl);
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-lg px-4 py-10">
        <Card>
          <CardHeader>
            <div className="min-w-0">
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="mt-1">Acesse sua conta para acompanhar seus pedidos.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              <div className="grid gap-3">
                <div className="text-sm text-muted-foreground">Você já está autenticado.</div>
                <div className="flex items-center gap-2">
                  <Button asChild>
                    <Link href={`/${tenant}/minha-conta`}>Ir para Minha conta</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) clearError();
                    }}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="voce@exemplo.com"
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium" htmlFor="password">
                    Senha
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) clearError();
                    }}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-md border border-border bg-background p-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Entrando…" : "Entrar"}
                  </Button>
                  <Button asChild variant="ghost" disabled={loading}>
                    <Link href={`/${tenant}/cadastro`}>Criar conta</Link>
                  </Button>
                </div>

                {!loading && !error ? (
                  <div className="text-xs text-muted-foreground">
                    Dica: use um email qualquer. Esta é uma sessão mock para o MVP.
                  </div>
                ) : null}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
