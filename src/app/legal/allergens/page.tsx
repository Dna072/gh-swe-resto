import type { Metadata } from "next";
import { LegalPage } from "@/components/brand/legal-page";

export const metadata: Metadata = { title: "Allergens" };

export default function AllergensPage() {
  return (
    <LegalPage eyebrow="Kitchen" title="Allergens">
      <p>
        Each meal lists EU major allergens from the catalog. Fufu with groundnut soup contains
        peanut. Kenkey and tilapia contain fish. Waakye may contain egg and gluten. Malt contains
        gluten.
      </p>
      <p>
        Cross-contact is possible in a small kitchen. If you have a severe allergy, call us before
        you order — contact details are on the contact page.
      </p>
    </LegalPage>
  );
}
