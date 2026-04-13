import { LoginClient } from "@/components/pages/login-client";

export default async function LoginPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return <LoginClient tenant={tenant} />;
}

