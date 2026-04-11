"use client";

import { useRef, useTransition } from "react";
import { usePathname } from "next/navigation";

import { setSelectedTenantAction } from "@/app/_actions/tenant";

type Props = {
  tenants: string[];
  selectedTenant: string;
  className?: string;
};

export function TenantSelect({ tenants, selectedTenant, className }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [, startTransition] = useTransition();
  const pathname = usePathname();

  return (
    <form ref={formRef} action={setSelectedTenantAction} className={className}>
      <input type="hidden" name="redirectTo" value={pathname || "/"} />
      <label className="grid gap-1.5 text-sm">
        <span className="text-muted-foreground text-xs">Tenant</span>
        <select
          key={selectedTenant}
          name="tenant"
          defaultValue={selectedTenant}
          onChange={() => {
            startTransition(() => formRef.current?.requestSubmit());
          }}
          className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground shadow-xs/5 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24"
        >
          <option value="">(selecione)</option>
          {tenants.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
