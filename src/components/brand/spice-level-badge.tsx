import { ChilliIcon } from "@/components/brand/chilli-icon";
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
        <ChilliIcon key={index} filled={index < filled} />
      ))}
    </span>
  );
}
