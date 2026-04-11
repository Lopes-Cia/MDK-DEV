"use client";

import { Render } from "@puckeditor/core";
import { useQuery } from "@tanstack/react-query";

import { puckConfig } from "@/puck/puck-config";
import { TenantRuntimeProvider } from "@/components/puck/tenant-runtime";

type PuckContentItem = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

type PuckData = {
  root: { props: Record<string, unknown> };
  content: PuckContentItem[];
};

type BuilderGetResponse = {
  tenantId: string;
  urlPath: string;
  data: PuckData;
};

async function fetchBuilderData(tenant: string, urlPath: string) {
  const res = await fetch(`/api/builder/${encodeURIComponent(tenant)}?path=${encodeURIComponent(urlPath)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("builder_fetch_failed");
  return (await res.json()) as BuilderGetResponse;
}

export function PuckPage({ tenant, urlPath }: { tenant: string; urlPath: string }) {
  const dataQuery = useQuery({
    queryKey: ["builder", tenant, urlPath],
    queryFn: () => fetchBuilderData(tenant, urlPath),
  });

  if (dataQuery.isLoading) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="text-sm text-muted-foreground">Carregando…</div>
        </div>
      </main>
    );
  }

  if (dataQuery.isError) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="text-sm text-muted-foreground">Erro ao carregar página</div>
        </div>
      </main>
    );
  }

  const builder = dataQuery.data;
  if (!builder) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="text-sm text-muted-foreground">Erro ao carregar página</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <TenantRuntimeProvider tenant={tenant}>
          <Render config={puckConfig} data={builder.data} />
        </TenantRuntimeProvider>
      </div>
    </main>
  );
}

