"use client";

import { MarketingSignup } from "@/components/storefront/marketing-signup";
import { useT } from "@/components/i18n/locale-provider";

export function HomePromo() {
  const t = useT();
  return (
    <>
      <p className="font-script text-4xl text-gold">{t("home.promo.eyebrow")}</p>
      <h3 className="mt-2 font-heading text-3xl">{t("home.promo.title")}</h3>
      <p className="mt-3 text-muted-foreground">{t("home.promo.body")}</p>
      <div className="mt-6">
        <MarketingSignup />
      </div>
    </>
  );
}
