import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { getTranslator } from "@/lib/i18n/server";
import { restaurantIdFromEnv, restaurantSettings } from "@/server/composition";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return {
    title: t("checkout.metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage() {
  const t = await getTranslator();
  const pickup = restaurantSettings().pickup;
  return (
    <CustomerShell>
      <main id="main">
        <PageBanner
          eyebrow={t("checkout.eyebrow")}
          title={t("checkout.title")}
          description={t("checkout.description")}
        />
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <CheckoutForm restaurantId={restaurantIdFromEnv()} pickup={pickup} />
        </div>
      </main>
    </CustomerShell>
  );
}
