import { PuckPage } from "@/components/puck/puck-page";

export default async function TenantHome({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return <PuckPage tenant={tenant} urlPath="/" />;
}

