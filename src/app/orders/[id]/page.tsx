import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { LocalizedPageBanner } from "@/components/brand/localized-page-banner";
import { OrderConfirmation } from "@/components/storefront/order-confirmation";
import { getTranslator } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return {
    title: t("order.metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  return (
    <CustomerShell>
      <main id="main">
        <LocalizedPageBanner
          eyebrowKey="order.eyebrow"
          titleKey="order.title"
          descriptionKey="order.description"
        />
        <div className="mx-auto w-full max-w-xl px-4 py-12">
          <OrderConfirmation orderId={id} tokenFromUrl={token} />
        </div>
      </main>
    </CustomerShell>
  );
}
