import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveTenantAssetPath(tenant: string, assetPath: string | null | undefined) {
  if (!assetPath) return null;
  const p = String(assetPath);
  if (!p.startsWith("/assets/")) return p;
  if (p.startsWith(`/assets/${tenant}/`)) return p;
  if (p.startsWith("/assets/images/")) return `/assets/${tenant}${p.slice("/assets".length)}`;
  if (p.startsWith("/assets/products/")) return `/assets/${tenant}/images/produtos/${p.slice("/assets/products/".length)}`;
  if (p.startsWith("/assets/categories/")) return `/assets/${tenant}/images/categorias/${p.slice("/assets/categories/".length)}`;
  return `/assets/${tenant}${p.slice("/assets".length)}`;
}
