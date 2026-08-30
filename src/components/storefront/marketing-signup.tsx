"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/brand/field";
import { useT } from "@/components/i18n/locale-provider";

export function MarketingSignup() {
  const t = useT();
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
        body: JSON.stringify({ email, consent: true, source: "homepage" }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        toast.error(body.message ?? t("signup.failed"));
        return;
      }
      setEmail("");
      setConsent(false);
      toast.success(t("signup.success"));
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
