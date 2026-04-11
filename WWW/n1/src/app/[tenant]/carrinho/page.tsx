import { CartClient } from "@/components/pages/cart-client";
import { readTenantJson } from "@/lib/mockend/read";

export default async function CartPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const copy = await readTenantJson<{
    pages?: { cart?: { title?: string; continueShopping?: string; checkoutCta?: string } };
  }>(tenant, ["COPY", "copy.json"]);

  return (
    <CartClient
      tenant={tenant}
      title={copy.pages?.cart?.title ?? "Carrinho"}
      continueShopping={copy.pages?.cart?.continueShopping ?? "Continuar comprando"}
      checkoutCta={copy.pages?.cart?.checkoutCta ?? "Finalizar"}
    />
  );
}

