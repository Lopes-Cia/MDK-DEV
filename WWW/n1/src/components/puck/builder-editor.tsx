"use client";

import * as React from "react";

import { Puck } from "@puckeditor/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

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

async function saveBuilderData(tenant: string, urlPath: string, data: unknown) {
  const res = await fetch(`/api/builder/${encodeURIComponent(tenant)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urlPath, data }),
  });
  if (!res.ok) throw new Error("builder_save_failed");
  return (await res.json()) as { ok: boolean };
}

export function BuilderEditor({ tenant }: { tenant: string }) {
  const search = useSearchParams();
  const urlPath = search.get("path") ?? "/";
  const queryClient = useQueryClient();

  const dataQuery = useQuery({
    queryKey: ["builder", tenant, urlPath],
    queryFn: () => fetchBuilderData(tenant, urlPath),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { urlPath: string; data: unknown }) =>
      saveBuilderData(tenant, payload.urlPath, payload.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["builder", tenant, urlPath] });
    },
  });

  const onPublish = React.useCallback(
    async (data: unknown) => {
      await saveMutation.mutateAsync({ urlPath, data });
    },
    [saveMutation, urlPath]
  );

  if (dataQuery.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando…</div>;
  }

  if (dataQuery.isError) {
    return <div className="p-6 text-sm text-muted-foreground">Erro ao carregar editor</div>;
  }

  const builder = dataQuery.data;
  if (!builder) {
    return <div className="p-6 text-sm text-muted-foreground">Erro ao carregar editor</div>;
  }

  return (
    <TenantRuntimeProvider tenant={tenant}>
      <Puck config={puckConfig} data={builder.data} onPublish={onPublish} />
    </TenantRuntimeProvider>
  );
}

