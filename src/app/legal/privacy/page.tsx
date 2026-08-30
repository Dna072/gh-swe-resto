import type { Metadata } from "next";
import { LocalizedLegalPage } from "@/components/brand/localized-legal-page";
import { getTranslator } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("legal.privacy.title") };
}

export default function PrivacyPage() {
  return (
    <LocalizedLegalPage
      eyebrowKey="legal.legal"
      titleKey="legal.privacy.title"
      bodyKeys={["legal.privacy.p1", "legal.privacy.p2"]}
    />
  );
}
