import type { Metadata } from "next";
import { LocalizedLegalPage } from "@/components/brand/localized-legal-page";
import { getTranslator } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("legal.allergens.title") };
}

export default function AllergensPage() {
  return (
    <LocalizedLegalPage
      eyebrowKey="legal.kitchen"
      titleKey="legal.allergens.title"
      bodyKeys={["legal.allergens.p1", "legal.allergens.p2"]}
    />
  );
}
