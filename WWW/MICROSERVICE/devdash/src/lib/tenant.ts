import "server-only";

import { cookies } from "next/headers";

export const TENANT_COOKIE = "devdash-tenant";

export async function getSelectedTenant() {
  const cookieStore = await cookies();
  return cookieStore.get(TENANT_COOKIE)?.value ?? "";
}
