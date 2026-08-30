import type { Metadata } from "next";
import { LegalPage } from "@/components/brand/legal-page";
import { getTranslator } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("legal.privacy.title") };
}

export default async function PrivacyPage() {
  const t = await getTranslator();
  return (
    <LegalPage eyebrow={t("legal.legal")} title={t("legal.privacy.title")}>
      <p>{t("legal.privacy.p1")}</p>
      <p>{t("legal.privacy.p2")}</p>
    </LegalPage>
  );
}
