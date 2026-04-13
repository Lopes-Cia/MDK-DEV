import { HomeClient } from "@/components/pages/home-client";
import { readTenantJson } from "@/lib/mockend/read";

export default async function TenantHome({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const [context, copy] = await Promise.all([
    readTenantJson<{ tenantName: string }>(tenant, ["CONTEXTO", "contexto.json"]),
    readTenantJson<{ pages?: { home?: { title?: string; subtitle?: string } } }>(tenant, ["COPY", "copy.json"]),
  ]);

  const tenantName = context?.tenantName ?? tenant;
  const title = copy?.pages?.home?.title ?? tenantName;
  const subtitle = copy?.pages?.home?.subtitle ?? "";

  return <HomeClient tenant={tenant} title={title} subtitle={subtitle} />;
}

