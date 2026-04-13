import { PedidoClient } from "@/components/pages/pedido-client";

export default async function PedidoPage({ params }: { params: Promise<{ tenant: string; orderId: string }> }) {
  const { tenant, orderId } = await params;
  return <PedidoClient tenant={tenant} orderId={orderId} />;
}

