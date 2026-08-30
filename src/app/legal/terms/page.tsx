import type { Metadata } from "next";
import { LocalizedLegalPage } from "@/components/brand/localized-legal-page";
import { getTranslator } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("legal.terms.title") };
}

export default function TermsPage() {
  return (
    <LocalizedLegalPage
      eyebrowKey="legal.legal"
      titleKey="legal.terms.title"
      bodyKeys={["legal.terms.p1", "legal.terms.p2"]}
    />
  );
}
