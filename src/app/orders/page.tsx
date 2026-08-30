import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { LocalizedPageBanner } from "@/components/brand/localized-page-banner";
import { OrderLookup } from "@/components/storefront/order-lookup";
import { getTranslator } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return {
    title: t("orders.metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function OrdersPage() {
  return (
    <CustomerShell>
      <main id="main">
        <LocalizedPageBanner
          eyebrowKey="orders.eyebrow"
          titleKey="orders.title"
          descriptionKey="orders.description"
        />
        <div className="mx-auto w-full max-w-xl px-4 py-12">
          <OrderLookup />
        </div>
      </main>
    </CustomerShell>
  );
}
