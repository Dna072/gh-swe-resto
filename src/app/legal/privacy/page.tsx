import type { Metadata } from "next";
import { LegalPage } from "@/components/brand/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy">
      <p>
        This demo stores a guest cart in your browser and can save a marketing email if you
        consent. No payment data is collected in Phase 2.
      </p>
      <p>
        A full GDPR notice — controller, processors, retention, and your rights — will be published
        before launch. Do not submit real personal data to this preview.
      </p>
    </LegalPage>
  );
}
