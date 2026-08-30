import type { Metadata } from "next";
import { LegalPage } from "@/components/brand/legal-page";
import { getTranslator } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("legal.terms.title") };
}

export default async function TermsPage() {
  const t = await getTranslator();
  return (
    <LegalPage eyebrow={t("legal.legal")} title={t("legal.terms.title")}>
      <p>{t("legal.terms.p1")}</p>
      <p>{t("legal.terms.p2")}</p>
    </LegalPage>
  );
}
