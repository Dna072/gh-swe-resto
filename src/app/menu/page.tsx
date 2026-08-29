import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { MealCard } from "@/components/brand/meal-card";
import { SectionHeading } from "@/components/brand/section-heading";
import { TrackView } from "@/components/storefront/track-view";
import { lowStockLabel, soldOut } from "@/lib/menu/display";
import { loadPublicCatalog } from "@/server/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Today's menu",
  description: "Ghanaian plates, sides and drinks for delivery in Uppsala.",
};

export default async function MenuPage() {
  const catalog = await loadPublicCatalog();

  return (
    <CustomerShell>
      <TrackView name="menu_viewed" properties={{ surface: "menu" }} />
      <main id="main" className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-10">
        <SectionHeading
          eyebrow="Menu"
          title="Today's Ghanaian plates"
          description="Choose a meal to set protein, heat and extras. Display prices are resolved on the server."
        />
        {catalog.categories.map((category) => {
          const items = catalog.items.filter((item) => item.categoryId === category.id);
          if (items.length === 0) {
            return null;
          }
          return (
            <section key={category.id} id={category.slug} className="space-y-6">
              <div>
                <h2 className="font-heading text-3xl">{category.name}</h2>
                {category.description ? (
                  <p className="mt-2 max-w-2xl text-muted-foreground">{category.description}</p>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((item) => (
                  <MealCard
                    key={item.id}
                    name={item.name}
                    description={item.shortDescription}
                    priceOre={item.displayPriceOre}
                    imageAlt={item.imageAlt}
                    imageUrl={item.imageUrl}
                    imagePosition={item.imagePosition}
                    href={`/menu/${item.slug}`}
                    dietaryLabels={item.dietaryTags.map((tag) => tag.replaceAll("_", " ").toLowerCase())}
                    featured={item.popular}
                    soldOut={soldOut(item)}
                    lowStockLabel={lowStockLabel(item)}
                    addLabel={item.modifierGroups.length > 0 ? "Customize" : "Add"}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </CustomerShell>
  );
}
