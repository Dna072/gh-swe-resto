import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { SectionHeading } from "@/components/brand/section-heading";
import { OrderConfirmation } from "@/components/storefront/order-confirmation";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

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
      <main id="main" className="mx-auto w-full max-w-xl px-4 py-10">
        <SectionHeading
          eyebrow="Reserved"
          title="Your order"
          description="The kitchen has your snapshot. Card payment is still Phase 5 — you can cancel while the order is waiting, or order again."
        />
        <div className="mt-8">
          <OrderConfirmation orderId={id} tokenFromUrl={token} />
        </div>
      </main>
    </CustomerShell>
  );
}
