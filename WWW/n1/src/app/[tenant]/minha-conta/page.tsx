import { MinhaContaClient } from "@/components/pages/minha-conta-client";

export default async function MinhaContaPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return <MinhaContaClient tenant={tenant} />;
}

