"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckCircle2,
  Hammer,
  Home,
  Layers,
  PackageSearch,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { TenantSelect } from "@/app/_components/tenant-select";

type Props = {
  tenants: string[];
  selectedTenant: string;
  children: React.ReactNode;
};

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/sistema", label: "Sistema", icon: Settings },
  { href: "/mock-end", label: "Mock-End", icon: PackageSearch },
  { href: "/builder", label: "Builder", icon: Layers },
  { href: "/jobs", label: "Seeding/Jobs", icon: Hammer },
  { href: "/verificacoes", label: "Verificações", icon: CheckCircle2 },
];

export function AppShell({ tenants, selectedTenant, children }: Props) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="gap-3">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 outline-hidden ring-sidebar-ring focus-visible:ring-2",
              "group-data-[collapsible=icon]:justify-center",
            )}
          >
            <img
              alt="Lopes"
              className="h-7 w-auto shrink-0"
              src="/logoLopes.png"
            />
            <span className="font-semibold text-sm tracking-tight group-data-[collapsible=icon]:hidden">
              DEVDASH
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegação</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={item.href} />}
                        tooltip={item.label}
                      >
                        <Icon aria-hidden="true" className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator />
          <div className="p-2">
            <TenantSelect tenants={tenants} selectedTenant={selectedTenant} />
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="flex min-h-svh flex-col">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur md:px-4">
          <SidebarTrigger className="h-9 w-9" />
          <div className="min-w-0 flex-1 text-sm">
            <span className="truncate font-medium">
              {navItems.find((i) => i.href === pathname)?.label ?? "DEVDASH"}
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

