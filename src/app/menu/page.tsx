import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { MenuListItem } from "@/components/brand/menu-list-item";
import { PageBanner } from "@/components/brand/page-banner";
import { Reveal, RevealGroup } from "@/components/brand/reveal";
import { TrackView } from "@/components/storefront/track-view";
import { soldOut } from "@/lib/menu/display";
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
      <main id="main">
        <PageBanner
          eyebrow="Our menu"
          title="Today's Ghanaian plates"
          description="Choose a meal to set protein, heat and extras. Display prices are resolved on the server."
        />
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-20 px-4 py-16 sm:py-24">
          {catalog.categories.map((category) => {
            const items = catalog.items.filter((item) => item.categoryId === category.id);
            if (items.length === 0) {
              return null;
            }
            return (
              <Reveal as="section" key={category.id} className="scroll-mt-28">
                <div id={category.slug} className="text-center">
                  <p className="font-script text-5xl text-gold">{category.name}</p>
                  {category.description ? (
                    <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{category.description}</p>
                  ) : null}
                </div>
                <RevealGroup className="mt-10 divide-y divide-foreground/10">
                  {items.map((item) => (
                    <Reveal as="div" key={item.id}>
                      <MenuListItem
                        name={item.name}
                        description={item.shortDescription}
                        priceOre={item.displayPriceOre}
                        href={`/menu/${item.slug}`}
                        soldOut={soldOut(item)}
                      />
                    </Reveal>
                  ))}
                </RevealGroup>
              </Reveal>
            );
          })}
        </div>
      </main>
    </CustomerShell>
  );
}
