"use client";

import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { FoodPhoto } from "@/components/brand/food-photo";
import { Price } from "@/components/brand/price";
import { useLocale, useT } from "@/components/i18n/locale-provider";
import { localizeMenuDescription, localizeMenuName } from "@/lib/i18n/catalog";
import type { Ore } from "@/lib/money";
import { cn } from "@/lib/utils";

export function FeaturedPlate({
  itemId,
  name,
  description,
  priceOre,
  href,
  imageUrl,
  imageAlt,
  imagePosition,
  featured,
  className,
}: {
  itemId?: string;
  name: string;
  description: string;
  priceOre: Ore;
  href: string;
  imageUrl?: string | null;
  imageAlt: string;
  imagePosition?: string;
  featured?: boolean;
  className?: string;
}) {
  const t = useT();
  const { locale } = useLocale();
  const reduced = useReducedMotion() ?? false;
  const displayName = itemId ? localizeMenuName(itemId, name, locale) : name;
  const displayDescription = itemId
    ? localizeMenuDescription(itemId, description, locale)
    : description;
  const displayAlt = itemId ? localizeMenuName(itemId, imageAlt, locale) : imageAlt;

  return (
    <Link
      href={href}
      className={cn(
        "group relative block min-h-[22rem] overflow-hidden bg-ink text-primary-foreground md:min-h-[28rem]",
        className,
      )}
    >
      <FoodPhoto
        src={imageUrl}
        alt={displayAlt}
        name={displayName}
        sizes="(max-width: 768px) 100vw, 50vw"
        objectPosition={imagePosition}
        placeholderTone="ink"
        className={cn(
          "absolute inset-0 size-full transition-transform duration-[1.1s] ease-out",
          !reduced && "group-hover:scale-[1.08]",
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent transition-opacity duration-500 group-hover:via-ink/45" />
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-6 sm:p-8">
        {featured ? (
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold">{t("menu.popular")}</p>
        ) : null}
        <h3 className="font-heading text-3xl sm:text-4xl">{displayName}</h3>
        <p className="max-w-md text-sm italic text-primary-foreground/75">{displayDescription}</p>
        <Price ore={priceOre} className="text-gold" />
      </div>
    </Link>
  );
}
