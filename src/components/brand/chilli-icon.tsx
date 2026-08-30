import { cn } from "@/lib/utils";

type ChilliIconProps = {
  filled: boolean;
  className?: string;
};

/**
 * Inline SVG chilli with a transparent background.
 * Filled uses earth (body) and forest (stem); empty is a muted outline.
 */
export function ChilliIcon({ filled, className }: ChilliIconProps) {
  const stem = filled ? "stroke-forest" : "stroke-muted-foreground/35";
  const leaf = filled ? "fill-forest" : "fill-muted-foreground/35";

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-[18px] w-[18px] shrink-0", className)}
      aria-hidden
    >
      <path
        d="M15.15 2.2c-.05 1.45-.85 2.65-2.15 3.4"
        className={stem}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M15.35 3.45c1.25.1 2.15.95 2.05 1.95-1.15-.2-2.2-.05-3.05.45.2-.8.5-1.6 1-2.4Z"
        className={leaf}
      />
      <path
        d="M12.55 6.05c3.35.35 6.15 3.4 5.95 7.05-.15 2.9-2.05 5.45-4.7 6.5-2.4.95-5.25.45-6.95-1.35-1.85-1.95-2.35-4.85-1.15-7.3 1.1-2.25 3.25-4 6.85-4.9Z"
        className={filled ? "fill-earth" : "stroke-muted-foreground/35"}
        strokeWidth={filled ? undefined : 1.55}
        strokeLinejoin="round"
      />
    </svg>
  );
}
