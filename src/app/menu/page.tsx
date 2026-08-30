import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { MenuListItem } from "@/components/brand/menu-list-item";
import { LocalizedPageBanner } from "@/components/brand/localized-page-banner";
import { Reveal, RevealGroup } from "@/components/brand/reveal";
import { LocalizedCategoryDescription, LocalizedCategoryName } from "@/components/storefront/localized-category";
import { TrackView } from "@/components/storefront/track-view";
import { localizeCatalog } from "@/lib/i18n/catalog";
import { getLocale, getTranslator } from "@/lib/i18n/server";
import { soldOut } from "@/lib/menu/display";
import { loadPublicCatalog } from "@/server/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return {
    title: t("menuPage.metaTitle"),
    description: t("menuPage.metaDescription"),
  };
}

export default async function MenuPage() {
  const t = await getTranslator();
  const locale = await getLocale();
  const catalog = localizeCatalog(await loadPublicCatalog(), locale, t);

  return (
    <CustomerShell>
      <TrackView name="menu_viewed" properties={{ surface: "menu" }} />
      <main id="main">
        <LocalizedPageBanner
          eyebrowKey="menuPage.eyebrow"
          titleKey="menuPage.title"
          descriptionKey="menuPage.description"
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
                  <p className="font-script text-5xl text-gold">
                    <LocalizedCategoryName id={category.id} fallback={category.name} />
                  </p>
                  <LocalizedCategoryDescription
                    id={category.id}
                    fallback={category.description}
                    className="mx-auto mt-4 max-w-2xl text-muted-foreground"
                  />
                </div>
                <RevealGroup className="mt-10 divide-y divide-foreground/10">
                  {items.map((item) => (
                    <Reveal as="div" key={item.id}>
                      <MenuListItem
                        itemId={item.id}
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
