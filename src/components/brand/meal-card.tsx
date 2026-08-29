"use client";

import Image from "next/image";
import Link from "next/link";
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
  imageUrl?: string | null;
  href?: string;
  featured?: boolean;
  soldOut?: boolean;
  lowStockLabel?: string;
  addLabel?: string;
  onAdd?: () => void;
  className?: string;
}

export function MealCard({
  name,
  description,
  priceOre,
  imageAlt,
  imageUrl,
  href,
  featured = false,
  soldOut = false,
  lowStockLabel,
  addLabel = "Add",
  onAdd,
  className,
}: MealCardProps) {
  const reduced = useReducedMotion() ?? false;
  const media = (
    <div className="relative aspect-[4/3] bg-secondary">
      {imageUrl ? (
        <Image src={imageUrl} alt={imageAlt} fill sizes="(max-width: 768px) 100vw, 360px" className="object-cover" />
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
      ) : lowStockLabel ? (
        <Badge variant="earth" className="absolute top-3 right-3">
          {lowStockLabel}
        </Badge>
      ) : null}
    </div>
  );

  return (
    <motion.article
      variants={revealVariants(reduced)}
      initial={reduced ? "visible" : "hidden"}
      animate="visible"
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10",
        className,
      )}
    >
      {href ? (
        <Link href={href} className="block focus-visible:outline-none">
          {media}
        </Link>
      ) : (
        media
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          {href ? (
            <h3 className="font-heading text-xl leading-tight">
              <Link href={href} className="hover:text-earth">
                {name}
              </Link>
            </h3>
          ) : (
            <h3 className="font-heading text-xl leading-tight">{name}</h3>
          )}
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <Price ore={priceOre} />
          {onAdd ? (
            <Button size="touch" disabled={soldOut} onClick={onAdd}>
              {soldOut ? "Unavailable" : addLabel}
            </Button>
          ) : href ? (
            <Button size="touch" disabled={soldOut} asChild>
              <Link href={href}>{soldOut ? "Unavailable" : addLabel}</Link>
            </Button>
          ) : (
            <Button size="touch" disabled={soldOut}>
              {soldOut ? "Unavailable" : addLabel}
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
