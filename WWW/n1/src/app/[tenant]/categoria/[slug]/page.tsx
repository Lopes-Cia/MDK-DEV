import { CategoryClient } from "@/components/pages/category-client";
import { readTenantJson } from "@/lib/mockend/read";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}) {
  const { tenant, slug } = await params;
  const copy = await readTenantJson<{
    pages?: { category?: { title?: string; emptyState?: string } };
  }>(tenant, ["COPY", "copy.json"]);

  return (
    <CategoryClient
      tenant={tenant}
      slug={slug}
      title={copy.pages?.category?.title ?? "Categoria"}
      emptyState={copy.pages?.category?.emptyState ?? "Nenhum produto encontrado"}
    />
  );
}

