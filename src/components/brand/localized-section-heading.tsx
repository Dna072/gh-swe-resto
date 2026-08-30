"use client";

import { SectionHeading } from "@/components/brand/section-heading";
import { useT } from "@/components/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

export function LocalizedSectionHeading({
  eyebrowKey,
  titleKey,
  descriptionKey,
  descriptionVars,
  align,
  tone,
  className,
}: {
  eyebrowKey?: MessageKey;
  titleKey: MessageKey;
  descriptionKey?: MessageKey;
  descriptionVars?: Record<string, string | number>;
  align?: "left" | "center";
  tone?: "default" | "light";
  className?: string;
}) {
  const t = useT();
  return (
    <SectionHeading
      align={align}
      tone={tone}
      className={className}
      eyebrow={eyebrowKey ? t(eyebrowKey) : undefined}
      title={t(titleKey)}
      description={descriptionKey ? t(descriptionKey, descriptionVars) : undefined}
    />
  );
}
