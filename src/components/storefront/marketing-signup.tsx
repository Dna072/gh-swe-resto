"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/brand/field";
import { useLocale, useT } from "@/components/i18n/locale-provider";
import { customerErrorMessage } from "@/lib/i18n/api-errors";
import { rememberMarketingSignup } from "@/lib/marketing/local";
import { track } from "@/lib/analytics/client";

export function MarketingSignup({
  source = "homepage",
  onSuccess,
}: {
  source?: string;
  onSuccess?: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) {
      toast.error(t("signup.needConsent"));
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/marketing/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent: true, source, locale }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string; code?: string };
        toast.error(customerErrorMessage(body.code, t, "signup.failed"));
        return;
      }
      setEmail("");
      setConsent(false);
      rememberMarketingSignup();
      track("marketing_signup", { source });
      toast.success(t("signup.success"));
      onSuccess?.();
    } catch {
      toast.error(t("signup.failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field id="marketing-email" label={t("signup.email")}>
        <Input
          id="marketing-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </Field>
      <label className="flex items-start gap-3 text-sm leading-6">
        <Checkbox
          checked={consent}
          onCheckedChange={(value) => setConsent(value === true)}
          className="mt-1"
          aria-label={t("signup.consentAria")}
        />
        <span>{t("signup.consent")}</span>
      </label>
      <Button size="touch" type="submit" disabled={pending}>
        {pending ? t("signup.saving") : t("signup.join")}
      </Button>
    </form>
  );
}
