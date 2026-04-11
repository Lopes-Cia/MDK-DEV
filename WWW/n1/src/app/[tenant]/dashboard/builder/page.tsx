import { notFound } from "next/navigation";

import { BuilderEditor } from "@/components/puck/builder-editor";

export default async function BuilderPage({ params }: { params: Promise<{ tenant: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { tenant } = await params;
  return <BuilderEditor tenant={tenant} />;
}

