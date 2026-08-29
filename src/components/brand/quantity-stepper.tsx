"use client";

import { Minus, Plus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { scalePopVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  disabled = false,
  className,
  label = "Quantity",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="sr-only" id={`${label}-live`} aria-live="polite">
        {label}: {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-touch"
        disabled={disabled || value <= min}
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus />
      </Button>
      <motion.span
        key={value}
        variants={scalePopVariants(reduced)}
        initial="pressed"
        animate="rest"
        className="min-w-8 text-center text-base font-medium tabular-nums"
      >
        {value}
      </motion.span>
      <Button
        type="button"
        variant="outline"
        size="icon-touch"
        disabled={disabled || value >= max}
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus />
      </Button>
    </div>
  );
}
