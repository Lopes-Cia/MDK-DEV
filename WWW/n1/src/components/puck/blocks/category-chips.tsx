"use client";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { fetchCatalogCategories } from "@/lib/mockend/catalog-client";
import { useTenant } from "@/components/puck/tenant-runtime";

export function CategoryChipsBlock({ title, limit = 12 }: { title: string; limit?: number }) {
  const tenant = useTenant();
  const categoriesQuery = useQuery({
    queryKey: ["catalogo", tenant, "categorias"],
    queryFn: () => fetchCatalogCategories(tenant),
  });
  const categories = categoriesQuery.data ?? [];

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {categoriesQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : categoriesQuery.isError ? (
        <div className="text-sm text-muted-foreground">Erro ao carregar categorias</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, limit).map((c) => (
            <Link
              key={c.id}
              href={`/${tenant}/categoria/${c.slug}`}
              className="rounded-full border border-border px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

