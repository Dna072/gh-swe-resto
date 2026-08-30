import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CustomerShell } from "@/components/brand/customer-shell";
import { FoodPhoto } from "@/components/brand/food-photo";
import { Price } from "@/components/brand/price";
import { MealCustomizer } from "@/components/storefront/meal-customizer";
import { TrackView } from "@/components/storefront/track-view";
import { localizePublicItem } from "@/lib/i18n/catalog";
import { getLocale, getTranslator } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/messages";
import { AppError } from "@/lib/errors";
import { getEnv } from "@/lib/env";
import { oreToSek } from "@/lib/money";
import { soldOut } from "@/lib/menu/display";
import { loadPublicItem } from "@/server/catalog";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

function pageUrl(slug: string): string {
  const base = getEnv().APP_BASE_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/menu/${slug}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const t = await getTranslator();
    const locale = await getLocale();
    const item = localizePublicItem(await loadPublicItem(slug), locale, t);
    const canonical = pageUrl(item.slug);
    return {
      title: item.name,
      description: item.shortDescription,
      alternates: { canonical },
      openGraph: {
        title: item.name,
        description: item.shortDescription,
        url: canonical,
        type: "website",
        ...(item.hasPhotograph && item.imageUrl
          ? { images: [{ url: item.imageUrl, alt: item.imageAlt }] }
          : {}),
      },
    };
  } catch {
    return { title: "Meal" };
  }
}

export default async function MealPage({ params }: PageProps) {
  const { slug } = await params;
  let item;
  try {
    item = await loadPublicItem(slug);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const t = await getTranslator();
  const locale = await getLocale();
  item = localizePublicItem(item, locale, t);
  const unavailable = soldOut(item);
  const stock =
    item.availability === "LOW_STOCK" && item.remainingPortions !== null
      ? t("menu.lowStock", { count: item.remainingPortions })
      : undefined;
  const dietaryKey = (tag: string): MessageKey | null => {
    if (tag === "HALAL" || tag === "VEGETARIAN" || tag === "VEGAN" || tag === "SPICY") {
      return `dietary.${tag}`;
    }
    return null;
  };
  const allergenKey = (tag: string): MessageKey | null => {
    if (tag === "EGG" || tag === "GLUTEN" || tag === "FISH" || tag === "PEANUT") {
      return `allergen.${tag}`;
    }
    return null;
  };
  const canonical = pageUrl(item.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: item.name,
    description: item.description,
    url: canonical,
    ...(item.hasPhotograph && item.imageUrl ? { image: item.imageUrl } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "SEK",
      price: oreToSek(item.displayPriceOre).toFixed(2),
      availability: unavailable ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };

  return (
    <CustomerShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackView name="item_viewed" properties={{ slug: item.slug, menuItemId: item.id }} />
      <main id="main" className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 lg:grid-cols-2 lg:py-16">
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary lg:sticky lg:top-24 lg:self-start lg:aspect-[4/5]">
          <FoodPhoto
            src={item.imageUrl}
            alt={item.imageAlt}
            name={item.name}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            objectPosition={item.imagePosition}
            placeholderTone="ink"
            className="size-full"
          />
        </div>
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="font-script text-4xl text-gold">{item.categoryName}</p>
            <h1 className="font-heading text-5xl sm:text-6xl">{item.name}</h1>
            <p className="text-lg leading-relaxed text-muted-foreground">{item.description}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Price ore={item.displayPriceOre} size="lg" className="text-gold" />
              {unavailable ? <Badge variant="secondary">{t("menu.soldOut")}</Badge> : null}
              {stock ? <Badge variant="earth">{stock}</Badge> : null}
              {item.dietaryTags.map((tag) => (
                <Badge key={tag} variant={tag === "HALAL" ? "forest" : "outline"}>
                  {dietaryKey(tag) ? t(dietaryKey(tag)!) : tag.replaceAll("_", " ").toLowerCase()}
                </Badge>
              ))}
            </div>
            {item.allergens.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("menu.allergens", {
                  list: item.allergens
                    .map((tag) => (allergenKey(tag) ? t(allergenKey(tag)!) : tag.toLowerCase()))
                    .join(", "),
                })}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("menu.noAllergens")}</p>
            )}
          </div>
          <MealCustomizer item={item} />
        </div>
      </main>
    </CustomerShell>
  );
}
