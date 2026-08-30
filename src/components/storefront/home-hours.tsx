"use client";

import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { Reveal } from "@/components/brand/reveal";
import { useT } from "@/components/i18n/locale-provider";
import { restaurantDisplay } from "@/lib/restaurant/display";

export function HomeHours() {
  const t = useT();
  const hours = [
    { label: t("hours.kitchen"), days: t("hours.days"), time: restaurantDisplay.hours[0].time },
    { label: t("hours.delivery"), days: t("hours.days"), time: restaurantDisplay.hours[1].time },
  ];

  return (
    <section id="hours" className="scroll-mt-24 bg-card py-16 sm:py-20">
      <Reveal className="mx-auto max-w-4xl px-4 text-center">
        <p className="font-script text-5xl text-gold">{t("hours.heading")}</p>
        <h2 className="mt-3 font-heading text-4xl sm:text-5xl">{t("hours.subheading")}</h2>
        <AdinkraRule className="mx-auto mt-5" />
        <div className="mt-10 grid gap-10 sm:grid-cols-2">
          {hours.map((slot) => (
            <div key={slot.label}>
              <p className="text-[11px] uppercase tracking-[0.28em] text-earth">{slot.label}</p>
              <p className="mt-3 font-heading text-2xl">{slot.days}</p>
              <p className="mt-1 text-lg text-muted-foreground">{slot.time}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
