"use client";

import { useOptionalT } from "@/components/i18n/locale-provider";

export function ComingSoonLabel() {
  const t = useOptionalT();
  return t("photo.comingSoon");
}
