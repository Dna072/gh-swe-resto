import type { Metadata } from "next";
import { CustomerShell } from "@/components/brand/customer-shell";
import { SectionHeading } from "@/components/brand/section-heading";
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
      <main id="main" className="mx-auto w-full max-w-5xl px-4 py-10">
        <SectionHeading
          eyebrow="Checkout"
          title="Guest checkout"
          description="Name, phone, and where the food should go. Prices and delivery fees are quoted on the server. Payment is Phase 5."
        />
        <div className="mt-8">
          <CheckoutForm restaurantId={restaurantIdFromEnv()} pickup={pickup} />
        </div>
      </main>
    </CustomerShell>
  );
}
