/* eslint-disable @next/next/no-img-element */
import { MAX_SPICE_LEVEL, type SpiceLevel } from "@/lib/menu/spice-level";
import { cn } from "@/lib/utils";

export function SpiceLevelBadge({
  level,
  max = MAX_SPICE_LEVEL,
  label,
  className,
}: {
  level: SpiceLevel | number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const filled = Math.min(max, Math.max(0, Math.round(level)));
  const description = label ?? `${filled} of ${max} chillies`;

  return (
    <span
      role="img"
      aria-label={description}
      title={description}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {Array.from({ length: max }, (_, index) => (
        <img
          key={index}
          src="/icons/chilli.png"
          alt=""
          width={18}
          height={18}
          className={cn("h-[18px] w-[18px] shrink-0", index < filled ? "" : "opacity-25 grayscale")}
        />
      ))}
    </span>
  );
}
