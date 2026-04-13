import { CadastroClient } from "@/components/pages/cadastro-client";

export default async function CadastroPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return <CadastroClient tenant={tenant} />;
}

