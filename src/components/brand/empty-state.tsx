import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/70 px-6 py-12 text-center",
        className,
      )}
    >
      <h2 className="font-heading text-2xl">{title}</h2>
      <p className="max-w-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
