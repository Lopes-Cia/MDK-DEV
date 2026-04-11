import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

import { ControlApp } from "@/app/_components/control-app";
import { AppShell } from "@/app/_components/app-shell";
import { listTenants } from "@/lib/mockend/tenants";
import { getSelectedTenant } from "@/lib/tenant";
import { cn } from "@/lib/utils";

const interHeading = Inter({
  subsets: ["latin"],
  variable: "--font-inter-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DEVDASH",
  description: "Painel de desenvolvimento (Mock-End, Builder, Jobs).",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenants = await listTenants();
  const selectedTenant = await getSelectedTenant();
  const mockEndBaseUrl = process.env.DEVDASH_MOCKEND_BASE_URL ?? "http://localhost:4000";
  const n1BaseUrl = process.env.DEVDASH_N1_BASE_URL ?? "http://localhost:3000";

  return (
    <html
      lang="pt-BR"
      className={cn("h-full antialiased", inter.variable, interHeading.variable, geistMono.variable)}
    >
      <body className="min-h-svh bg-background text-foreground">
        <ControlApp mockEndBaseUrl={mockEndBaseUrl} n1BaseUrl={n1BaseUrl} selectedTenant={selectedTenant} />
        <AppShell tenants={tenants} selectedTenant={selectedTenant}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
