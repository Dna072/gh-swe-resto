import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { restaurantIdFromEnv, restaurantSettings } from "@/server/composition";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  const pickup = restaurantSettings().pickup;
  return (
    <CustomerShell>
      <main id="main">
        <PageBanner
          eyebrow="Reservation"
          title="Guest checkout"
          description="Name, phone, and where the food should go. Prices and delivery fees are quoted on the server. Payment is Phase 5."
        />
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <CheckoutForm restaurantId={restaurantIdFromEnv()} pickup={pickup} />
        </div>
      </main>
    </CustomerShell>
  );
}
