import { ProductClient } from "@/components/pages/product-client";
import { readTenantJson } from "@/lib/mockend/read";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}) {
  const { tenant, slug } = await params;
  const copy = await readTenantJson<{
    pages?: { product?: { addToCart?: string; outOfStock?: string } };
  }>(tenant, ["COPY", "copy.json"]);

  return (
    <ProductClient
      tenant={tenant}
      slug={slug}
      addToCartLabel={copy.pages?.product?.addToCart ?? "Adicionar"}
      outOfStockLabel={copy.pages?.product?.outOfStock ?? "Indisponível"}
    />
  );
}

