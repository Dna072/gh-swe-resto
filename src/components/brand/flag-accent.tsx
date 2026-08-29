import { cn } from "@/lib/utils";

/** Thin Ghana flag stripe. Use once per page, never as a full theme. */
export function FlagAccent({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex h-1 w-full overflow-hidden rounded-full", className)}
    >
      <span className="flex-1 bg-[oklch(0.52_0.18_28)]" />
      <span className="flex-1 bg-[oklch(0.8_0.14_95)]" />
      <span className="flex-1 bg-[oklch(0.42_0.1_145)]" />
    </div>
  );
}
