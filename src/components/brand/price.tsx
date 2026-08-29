import { formatSek, type Ore } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({
  ore,
  className,
  size = "md",
}: {
  ore: Ore;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "font-medium tabular-nums text-earth",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "font-heading text-2xl tracking-tight",
        className,
      )}
    >
      {formatSek(ore)}
    </span>
  );
}
