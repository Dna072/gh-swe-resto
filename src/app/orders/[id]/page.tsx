import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";
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
  const t = await getTranslator();
  const { id } = await params;
  const { token } = await searchParams;
  return (
    <CustomerShell>
      <main id="main">
        <PageBanner
          eyebrow={t("order.eyebrow")}
          title={t("order.title")}
          description={t("order.description")}
        />
        <div className="mx-auto w-full max-w-xl px-4 py-12">
          <OrderConfirmation orderId={id} tokenFromUrl={token} />
        </div>
      </main>
    </CustomerShell>
  );
}
