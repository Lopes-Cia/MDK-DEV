import { CheckoutClient } from "@/components/pages/checkout-client";

export default async function CheckoutPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return <CheckoutClient tenant={tenant} />;
}

