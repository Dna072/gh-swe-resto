import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";
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
  const t = await getTranslator();
  return (
    <CustomerShell>
      <main id="main">
        <PageBanner
          eyebrow={t("orders.eyebrow")}
          title={t("orders.title")}
          description={t("orders.description")}
        />
        <div className="mx-auto w-full max-w-xl px-4 py-12">
          <OrderLookup />
        </div>
      </main>
    </CustomerShell>
  );
}
