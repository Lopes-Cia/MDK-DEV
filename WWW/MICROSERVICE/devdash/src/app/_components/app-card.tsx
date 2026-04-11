import Link from "next/link";
import type { ComponentType } from "react";
import { ChevronRight } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
};

export function AppCard({ title, description, href, icon: Icon }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-2xl outline-hidden ring-ring/24 transition-shadow focus-visible:ring-[3px]",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <Card className="transition hover:bg-accent/40">
        <CardHeader className="gap-1.5 p-5">
          <CardTitle className="flex items-center gap-2 text-sm">
            {Icon ? (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-background">
                <Icon className="size-4" />
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate">{title}</span>
            <ChevronRight className="size-4 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-80" />
          </CardTitle>
          <CardDescription className="line-clamp-2 text-sm">
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
