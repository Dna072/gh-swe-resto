"use client";

import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/brand/price";
import { revealVariants } from "@/lib/motion";
import type { Ore } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface MealCardProps {
  name: string;
  description: string;
  priceOre: Ore;
  imageAlt: string;
  imageUrl?: string;
  featured?: boolean;
  soldOut?: boolean;
  onAdd?: () => void;
  className?: string;
}

export function MealCard({
  name,
  description,
  priceOre,
  imageAlt,
  imageUrl,
  featured = false,
  soldOut = false,
  onAdd,
  className,
}: MealCardProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.article
      variants={revealVariants(reduced)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10",
        className,
      )}
    >
      <div className="relative aspect-[4/3] bg-secondary">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={imageAlt} className="size-full object-cover" />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-full items-end bg-kente p-4 text-sm text-muted-foreground"
          >
            {imageAlt}
          </div>
        )}
        {featured ? (
          <Badge variant="gold" className="absolute top-3 left-3">
            Popular
          </Badge>
        ) : null}
        {soldOut ? (
          <Badge variant="secondary" className="absolute top-3 right-3">
            Sold out
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="font-heading text-xl leading-tight">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <Price ore={priceOre} />
          <Button size="touch" disabled={soldOut} onClick={onAdd}>
            {soldOut ? "Unavailable" : "Add"}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
