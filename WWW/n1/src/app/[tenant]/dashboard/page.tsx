import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";

export default async function DashboardPage({ params }: { params: Promise<{ tenant: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { tenant } = await params;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="mt-6">
        <Button asChild>
          <Link href={`/${tenant}/dashboard/builder?path=/`}>Abrir Builder</Link>
        </Button>
      </div>
    </main>
  );
}

