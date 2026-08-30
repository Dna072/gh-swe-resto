"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MarketingSignup } from "@/components/storefront/marketing-signup";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/locale-provider";
import { hasMarketingSignup, rememberMarketingSignup } from "@/lib/marketing/local";

const DISMISS_KEY = "ghana-restaurant.marketing-dismissed";

export function DiscountInvite() {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (
      !pathname ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/kitchen") ||
      hasMarketingSignup() ||
      window.localStorage.getItem(DISMISS_KEY) === "1"
    ) {
      return;
    }
    const showOn = pathname.startsWith("/menu") || pathname.startsWith("/cart");
    if (!showOn) {
      return;
    }
    const timer = window.setTimeout(() => setOpen(true), pathname.startsWith("/cart") ? 400 : 8000);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!open) {
    return null;
  }

  return (
    <aside className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-md rounded-2xl bg-card p-4 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.45)] ring-1 ring-foreground/10 md:bottom-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-xl">{t("signup.inviteTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("signup.inviteBody")}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, "1");
            setOpen(false);
          }}
        >
          {t("signup.dismiss")}
        </Button>
      </div>
      <div className="mt-4">
        <MarketingSignup
          source="stay-invite"
          onSuccess={() => {
            rememberMarketingSignup();
            setOpen(false);
          }}
        />
      </div>
    </aside>
  );
}
