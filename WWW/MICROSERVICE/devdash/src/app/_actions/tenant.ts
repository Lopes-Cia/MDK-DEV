"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isValidTenant } from "@/lib/mockend/tenants";
import { TENANT_COOKIE } from "@/lib/tenant";

export async function setSelectedTenantAction(formData: FormData) {
  const tenant = String(formData.get("tenant") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "/").trim() || "/";
  const cookieStore = await cookies();

  if (!tenant) {
    cookieStore.delete(TENANT_COOKIE);
    redirect(redirectTo);
  }

  const ok = await isValidTenant(tenant);
  if (!ok) {
    cookieStore.delete(TENANT_COOKIE);
    redirect(`${redirectTo}?tenant=invalid`);
  }

  cookieStore.set(TENANT_COOKIE, tenant, {
    path: "/",
    sameSite: "lax",
  });

  redirect(redirectTo);
}
