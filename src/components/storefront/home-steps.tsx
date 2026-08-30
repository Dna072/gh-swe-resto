"use client";

import { useT } from "@/components/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

const STEPS: Array<{ title: MessageKey; body: MessageKey }> = [
  { title: "home.steps.1.title", body: "home.steps.1.body" },
  { title: "home.steps.2.title", body: "home.steps.2.body" },
  { title: "home.steps.3.title", body: "home.steps.3.body" },
];

export function HomeSteps() {
  const t = useT();
  return (
    <ol className="mt-14 grid gap-10 md:grid-cols-3">
      {STEPS.map((step, index) => (
        <li key={step.title} className="text-center">
          <p className="font-script text-4xl text-gold">0{index + 1}</p>
          <h3 className="mt-3 font-heading text-2xl sm:text-3xl">{t(step.title)}</h3>
          <p className="mt-3 text-muted-foreground">{t(step.body)}</p>
        </li>
      ))}
    </ol>
  );
}
