import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { readTenantJson, readTenantText } from "@/lib/mockend/read";
import { isValidTenant } from "@/lib/mockend/tenants";

type LayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}>;

function looksLikeTenant(value: string) {
  return /^[a-z0-9-]+$/.test(value);
}

export async function generateMetadata(props: Omit<LayoutProps, "children">): Promise<Metadata> {
  const { tenant } = await props.params;
  return { title: tenant };
}

export default async function TenantLayout({ children, params }: LayoutProps) {
  const { tenant } = await params;
  if (!looksLikeTenant(tenant)) notFound();

  const valid = await isValidTenant(tenant);
  if (!valid) notFound();

  const [tokensCss, context, copy] = await Promise.all([
    readTenantText(tenant, ["THEMA", "tokens.css"]),
    readTenantJson<{ tenantName: string }>(tenant, ["CONTEXTO", "contexto.json"]),
    readTenantJson<{ pages?: { home?: { title?: string } } }>(tenant, ["COPY", "copy.json"]),
  ]);

  const tenantName = context?.tenantName ?? tenant;
  const title = copy?.pages?.home?.title ?? tenantName;
  const showDevShortcut = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-full flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: tokensCss }} />
      <Header tenant={tenant} title={title} showDevShortcut={showDevShortcut} />
      {children}
      <Footer tenantName={tenantName} />
    </div>
  );
}

