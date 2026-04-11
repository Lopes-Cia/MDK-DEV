import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function looksLikeTenant(value: string) {
  return /^[a-z0-9-]+$/.test(value);
}

function getTenantFromHost(hostname: string) {
  if (!hostname.endsWith(".lvh.me")) return null;
  const subdomain = hostname.slice(0, -".lvh.me".length);
  if (!subdomain || subdomain === "www") return null;
  if (!looksLikeTenant(subdomain)) return null;
  return subdomain;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 0 && looksLikeTenant(parts[0])) {
    return NextResponse.next();
  }

  const tenant = getTenantFromHost(req.nextUrl.hostname);
  if (!tenant) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/${tenant}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

