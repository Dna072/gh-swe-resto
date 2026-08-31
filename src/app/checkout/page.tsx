import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { LocalizedPageBanner } from "@/components/brand/localized-page-banner";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { OrderingPausedBanner } from "@/components/storefront/ordering-paused-banner";
import { getTranslator } from "@/lib/i18n/server";
import { loadPublicCatalog } from "@/server/catalog";
import { restaurantIdFromEnv } from "@/server/composition";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return {
    title: t("checkout.metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage() {
  const catalog = await loadPublicCatalog();
  return (
    <CustomerShell>
      <main id="main">
        <LocalizedPageBanner
          eyebrowKey="checkout.eyebrow"
          titleKey="checkout.title"
          descriptionKey="checkout.description"
        />
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-12">
          {catalog.orderingPaused ? <OrderingPausedBanner /> : null}
          <CheckoutForm restaurantId={restaurantIdFromEnv()} orderingPaused={catalog.orderingPaused} />
        </div>
      </main>
    </CustomerShell>
  );
}
