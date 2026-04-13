import { CheckoutSucessoClient } from "@/components/pages/checkout-sucesso-client";

export default async function CheckoutSucessoPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return <CheckoutSucessoClient tenant={tenant} />;
}

