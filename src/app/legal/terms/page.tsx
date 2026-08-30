import type { Metadata } from "next";
import { LegalPage } from "@/components/brand/legal-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of use">
      <p>
        These are placeholder terms for the Phase 2 demo. The operating company name, organisation
        number, and Swedish consumer terms will be published before the first paid order.
      </p>
      <p>
        Guest orders can be cancelled while they are still waiting for the kitchen. After the kitchen
        accepts an order, cancellations go through the restaurant. Card refunds arrive with Phase 5
        payments.
      </p>
    </LegalPage>
  );
}
