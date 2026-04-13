import * as React from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StateCardTone = "default" | "muted" | "error";

type StateCardProps = {
  title: string;
  description?: React.ReactNode;
  tone?: StateCardTone;
  actions?: React.ReactNode;
  className?: string;
};

export function StateCard({ title, description, tone = "default", actions, className }: StateCardProps) {
  const descriptionClassName =
    tone === "error" ? "text-sm text-destructive" : tone === "muted" ? "text-sm text-muted-foreground" : "text-sm";

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {description ? <div className={descriptionClassName}>{description}</div> : null}
        {actions ? <div className={cn("mt-4 flex flex-wrap items-center gap-2", !description && "mt-0")}>{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
