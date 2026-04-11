"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

export function CepMockFormBlock({ label, helper }: { label: string; helper?: string }) {
  const [cep, setCep] = React.useState("");

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-3 flex items-center gap-2">
        <input
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          placeholder="00000-000"
        />
        <Button type="button" variant="outline">
          OK
        </Button>
      </div>
      {helper ? <div className="mt-2 text-xs text-muted-foreground">{helper}</div> : null}
    </section>
  );
}

