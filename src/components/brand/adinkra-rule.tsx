import { cn } from "@/lib/utils";

/** Abstract geometric rule inspired by Adinkra grids — not a sacred symbol. */
export function AdinkraRule({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 8"
      className={cn("h-2 w-28 text-gold", className)}
    >
      <rect x="0" y="3" width="28" height="2" fill="currentColor" />
      <rect x="34" y="1" width="6" height="6" fill="currentColor" opacity="0.85" />
      <rect x="46" y="3" width="28" height="2" fill="currentColor" />
      <rect x="80" y="1" width="6" height="6" fill="currentColor" opacity="0.55" />
      <rect x="92" y="3" width="28" height="2" fill="currentColor" />
    </svg>
  );
}
