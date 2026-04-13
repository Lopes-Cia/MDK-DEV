import { PedidosClient } from "@/components/pages/pedidos-client";

export default async function PedidosPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return <PedidosClient tenant={tenant} />;
}

