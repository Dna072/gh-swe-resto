"use client";

import { Badge } from "@/components/ui/badge";
import { FoodPhoto } from "@/components/brand/food-photo";
import { Price } from "@/components/brand/price";
import { MealCustomizer } from "@/components/storefront/meal-customizer";
import { useLocale } from "@/components/i18n/locale-provider";
import { localizePublicItem } from "@/lib/i18n/catalog";
import type { MessageKey } from "@/lib/i18n/messages";
import { soldOut } from "@/lib/menu/display";
import type { PublicMenuItem } from "@/lib/menu/public";

function dietaryKey(tag: string): MessageKey | null {
  if (tag === "HALAL" || tag === "VEGETARIAN" || tag === "VEGAN" || tag === "SPICY") {
    return `dietary.${tag}`;
  }
  return null;
}

function allergenKey(tag: string): MessageKey | null {
  if (tag === "EGG" || tag === "GLUTEN" || tag === "FISH" || tag === "PEANUT") {
    return `allergen.${tag}`;
  }
  return null;
}

export function MealView({ item }: { item: PublicMenuItem }) {
  const { locale, t } = useLocale();
  const localized = localizePublicItem(item, locale, t);
  const unavailable = soldOut(localized);
  const stock =
    localized.availability === "LOW_STOCK" && localized.remainingPortions !== null
      ? t("menu.lowStock", { count: localized.remainingPortions })
      : undefined;

  return (
    <>
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary lg:sticky lg:top-24 lg:self-start lg:aspect-[4/5]">
        <FoodPhoto
          src={localized.imageUrl}
          alt={localized.imageAlt}
          name={localized.name}
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          objectPosition={localized.imagePosition}
          placeholderTone="ink"
          className="size-full"
        />
      </div>
      <div className="space-y-8">
        <div className="space-y-4">
          <p className="font-script text-4xl text-gold">{localized.categoryName}</p>
          <h1 className="font-heading text-5xl sm:text-6xl">{localized.name}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{localized.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Price ore={localized.displayPriceOre} size="lg" className="text-gold" />
            {unavailable ? <Badge variant="secondary">{t("menu.soldOut")}</Badge> : null}
            {stock ? <Badge variant="earth">{stock}</Badge> : null}
            {localized.dietaryTags.map((tag) => (
              <Badge key={tag} variant={tag === "HALAL" ? "forest" : "outline"}>
                {dietaryKey(tag) ? t(dietaryKey(tag)!) : tag.replaceAll("_", " ").toLowerCase()}
              </Badge>
            ))}
          </div>
          {localized.allergens.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("menu.allergens", {
                list: localized.allergens
                  .map((tag) => (allergenKey(tag) ? t(allergenKey(tag)!) : tag.toLowerCase()))
                  .join(", "),
              })}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{t("menu.noAllergens")}</p>
          )}
        </div>
        <MealCustomizer item={localized} />
      </div>
    </>
  );
}
