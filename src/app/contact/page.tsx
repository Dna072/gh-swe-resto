import type { Metadata } from "next";
import { LegalPage } from "@/components/brand/legal-page";
import { seedRestaurant } from "@/infrastructure/seed/ghana-menu";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <LegalPage eyebrow="Uppsala" title="Contact">
      <p>
        {seedRestaurant.name} is preparing service in {seedRestaurant.city}. The demo pickup
        address is {seedRestaurant.pickup.line1}, {seedRestaurant.pickup.postalCode}{" "}
        {seedRestaurant.pickup.city}. Confirm the real kitchen address before launch.
      </p>
      <p>Email and phone will be published with the legal entity. Kitchen questions: use the allergen page first.</p>
    </LegalPage>
  );
}
