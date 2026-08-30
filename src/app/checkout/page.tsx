import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { LocalizedPageBanner } from "@/components/brand/localized-page-banner";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { getTranslator } from "@/lib/i18n/server";
import { restaurantIdFromEnv } from "@/server/composition";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return {
    title: t("checkout.metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage() {
  return (
    <CustomerShell>
      <main id="main">
        <LocalizedPageBanner
          eyebrowKey="checkout.eyebrow"
          titleKey="checkout.title"
          descriptionKey="checkout.description"
        />
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <CheckoutForm restaurantId={restaurantIdFromEnv()} />
        </div>
      </main>
    </CustomerShell>
  );
}
