import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerShell } from "@/components/brand/customer-shell";
import { MealView } from "@/components/storefront/meal-view";
import { TrackView } from "@/components/storefront/track-view";
import { localizePublicItem } from "@/lib/i18n/catalog";
import { getLocale, getTranslator } from "@/lib/i18n/server";
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
    const t = await getTranslator();
    return { title: t("nav.menu") };
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
  const localized = localizePublicItem(item, locale, t);
  const unavailable = soldOut(localized);
  const canonical = pageUrl(localized.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: localized.name,
    description: localized.description,
    url: canonical,
    ...(localized.hasPhotograph && localized.imageUrl ? { image: localized.imageUrl } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "SEK",
      price: oreToSek(localized.displayPriceOre).toFixed(2),
      availability: unavailable ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };

  return (
    <CustomerShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackView name="item_viewed" properties={{ slug: localized.slug, menuItemId: localized.id }} />
      <main id="main" className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 lg:grid-cols-2 lg:py-16">
        <MealView item={item} />
      </main>
    </CustomerShell>
  );
}
