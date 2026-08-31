"use client";

import { useT } from "@/components/i18n/locale-provider";

export function OrderingPausedBanner() {
  const t = useT();
  return (
    <p
      role="status"
      className="mx-auto max-w-5xl rounded-2xl bg-card px-4 py-3 text-sm text-earth ring-1 ring-earth/30"
    >
      {t("home.paused")}
    </p>
  );
}
