"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

type CadastroClientProps = {
  tenant: string;
  title?: string;
};

export function CadastroClient({ tenant, title = "Cadastro" }: CadastroClientProps) {
  const router = useRouter();

  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const data = useAuthStore((s) => s.data);
  const register = useAuthStore((s) => s.register);
  const clearError = useAuthStore((s) => s.clearError);
  const reset = useAuthStore((s) => s.reset);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const isAuthenticated =
    data.session?.authenticated === true && data.session.tenant === tenant && Boolean(data.user);

  React.useEffect(() => {
    // Evita “vazar” sessão entre tenants na store global.
    if (data.session && data.session.tenant !== tenant) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    const ok = await register(tenant, { name: name.trim(), email: email.trim(), password });
    if (ok) router.replace(`/${tenant}/minha-conta`);
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-lg px-4 py-10">
        <Card>
          <CardHeader>
            <div className="min-w-0">
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="mt-1">Crie sua conta para comprar mais rápido.</CardDescription>
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
                  <label className="text-sm font-medium" htmlFor="name">
                    Nome
                  </label>
                  <input
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) clearError();
                    }}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Seu nome"
                    required
                  />
                </div>

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
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) clearError();
                    }}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Mínimo 4 caracteres"
                    minLength={4}
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
                    {loading ? "Criando…" : "Criar conta"}
                  </Button>
                  <Button asChild variant="ghost" disabled={loading}>
                    <Link href={`/${tenant}/login`}>Já tenho conta</Link>
                  </Button>
                </div>

                {!loading && !error ? (
                  <div className="text-xs text-muted-foreground">
                    Esta é uma conta mock: os dados ficam no JSON do MOCK-END para o tenant.
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
