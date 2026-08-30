"use client";

import Link from "next/link";
import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useT } from "@/components/i18n/locale-provider";
import { restaurantDisplay } from "@/lib/restaurant/display";

export function SiteFooter() {
  const t = useT();
  const menuLinks = [
    { href: "/menu", label: t("nav.todaysMenu") },
    { href: "/#story", label: t("nav.story") },
    { href: "/#delivery", label: t("nav.delivery") },
    { href: "/contact", label: t("nav.contact") },
  ];
  const resourceLinks = [
    { href: "/legal/allergens", label: t("nav.allergens") },
    { href: "/legal/terms", label: t("nav.terms") },
    { href: "/legal/privacy", label: t("nav.privacy") },
    { href: "/orders", label: t("nav.findOrder") },
  ];
  const hours = [
    { label: t("hours.kitchen"), days: t("hours.days"), time: restaurantDisplay.hours[0].time },
    { label: t("hours.delivery"), days: t("hours.days"), time: restaurantDisplay.hours[1].time },
  ];

  return (
    <footer className="mt-auto bg-ink text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1.3fr_0.8fr_0.9fr]">
        <div>
          <p className="font-script text-4xl text-gold">{restaurantDisplay.mark}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.34em]">{t("brand.tagline")}</p>
          <AdinkraRule className="mt-5 text-gold" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/70">{t("footer.blurb")}</p>
          <LanguageSwitcher className="mt-6" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold">{t("nav.menu")}</p>
          <nav aria-label={t("a11y.footerMenu")} className="mt-4 grid gap-2 text-sm">
            {menuLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-primary-foreground/75 hover:text-gold">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold">{t("nav.visit")}</p>
          <p className="mt-4 text-sm text-primary-foreground/75">
            {restaurantDisplay.addressLine}
            <br />
            {restaurantDisplay.postalLine}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
            {hours.map((slot) => (
              <li key={slot.label}>
                <span className="text-gold">{slot.label}</span>
                <br />
                {slot.days} · {slot.time}
              </li>
            ))}
          </ul>
          <nav aria-label={t("a11y.legal")} className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs uppercase tracking-[0.16em] text-primary-foreground/55">
            {resourceLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-gold">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-primary-foreground/45">{t("footer.demo")}</p>
      </div>
    </footer>
  );
}
