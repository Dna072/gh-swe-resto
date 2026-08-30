import type { Metadata } from "next";
import { LegalPage } from "@/components/brand/legal-page";
import { getTranslator } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("legal.allergens.title") };
}

export default async function AllergensPage() {
  const t = await getTranslator();
  return (
    <LegalPage eyebrow={t("legal.kitchen")} title={t("legal.allergens.title")}>
      <p>{t("legal.allergens.p1")}</p>
      <p>{t("legal.allergens.p2")}</p>
    </LegalPage>
  );
}
