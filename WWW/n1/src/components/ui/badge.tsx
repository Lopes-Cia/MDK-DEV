import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "soft" | "outline";
};

export function Badge({ className, variant = "soft", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-4",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "soft" && "bg-muted text-muted-foreground",
        variant === "outline" && "border border-border bg-transparent text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

