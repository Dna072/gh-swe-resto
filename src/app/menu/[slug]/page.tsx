import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CustomerShell } from "@/components/brand/customer-shell";
import { Price } from "@/components/brand/price";
import { MealCustomizer } from "@/components/storefront/meal-customizer";
import { TrackView } from "@/components/storefront/track-view";
import { AppError } from "@/lib/errors";
import { lowStockLabel, soldOut } from "@/lib/menu/display";
import { loadPublicItem } from "@/server/catalog";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const item = await loadPublicItem(slug);
    return {
      title: item.name,
      description: item.shortDescription,
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

  return (
    <CustomerShell>
      <TrackView name="item_viewed" properties={{ slug: item.slug, menuItemId: item.id }} />
      <main id="main" className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary lg:sticky lg:top-20 lg:self-start">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.imageAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : null}
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
