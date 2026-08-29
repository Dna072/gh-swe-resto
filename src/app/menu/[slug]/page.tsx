import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CustomerShell } from "@/components/brand/customer-shell";
import { FoodPhoto } from "@/components/brand/food-photo";
import { Price } from "@/components/brand/price";
import { MealCustomizer } from "@/components/storefront/meal-customizer";
import { TrackView } from "@/components/storefront/track-view";
import { AppError } from "@/lib/errors";
import { getEnv } from "@/lib/env";
import { oreToSek } from "@/lib/money";
import { lowStockLabel, soldOut } from "@/lib/menu/display";
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
    const item = await loadPublicItem(slug);
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

  const unavailable = soldOut(item);
  const stock = lowStockLabel(item);
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
      <main id="main" className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary lg:sticky lg:top-20 lg:self-start">
          <FoodPhoto
            src={item.imageUrl}
            alt={item.imageAlt}
            name={item.name}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            objectPosition={item.imagePosition}
            className="size-full"
          />
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-earth">
              {item.categoryName}
            </p>
            <h1 className="font-heading text-4xl">{item.name}</h1>
            <p className="text-lg text-muted-foreground">{item.description}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Price ore={item.displayPriceOre} size="lg" />
              {unavailable ? <Badge variant="secondary">Sold out</Badge> : null}
              {stock ? <Badge variant="earth">{stock}</Badge> : null}
              {item.dietaryTags.map((tag) => (
                <Badge key={tag} variant={tag === "HALAL" ? "forest" : "outline"}>
                  {tag.replaceAll("_", " ").toLowerCase()}
                </Badge>
              ))}
            </div>
            {item.allergens.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Allergens: {item.allergens.join(", ").toLowerCase()}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No listed EU major allergens in the base plate.</p>
            )}
          </div>
          <MealCustomizer item={item} />
        </div>
      </main>
    </CustomerShell>
  );
}
