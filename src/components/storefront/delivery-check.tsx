"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/brand/field";
import { AddressAutocomplete, type AddressFields } from "@/components/checkout/address-autocomplete";
import { DeliveryOptionsList, type PublicDeliveryChoice } from "@/components/checkout/delivery-options";
import { useT } from "@/components/i18n/locale-provider";
import { customerErrorMessage } from "@/lib/i18n/api-errors";
import { track } from "@/lib/analytics/client";

type CheckOk = { ok: true; options: PublicDeliveryChoice[] };
type CheckFail = { ok: false; message: string };
type CheckResult = CheckOk | CheckFail;

const emptyAddress: AddressFields = {
  line1: "",
  postalCode: "",
  city: "Uppsala",
};

export function DeliveryCheck() {
  const t = useT();
  const [address, setAddress] = useState<AddressFields>(emptyAddress);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!address.line1.trim()) {
      setResult({ ok: false, message: t("delivery.notFound") });
      return;
    }
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/api/delivery/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line1: address.line1,
          postalCode: address.postalCode || "00000",
          city: address.city || "Uppsala",
          country: "SE",
          lat: address.lat,
          lng: address.lng,
          formatted: address.formatted,
        }),
      });
      const body = (await response.json()) as {
        deliverable?: boolean;
        options?: PublicDeliveryChoice[];
        message?: string;
        code?: string;
      };
      if (!response.ok || !body.deliverable || !body.options?.length) {
        setResult({
          ok: false,
          message: customerErrorMessage(body.code, t, "delivery.no"),
        });
        track("delivery_checked", { deliverable: false });
        return;
      }
      setResult({ ok: true, options: body.options });
      track("delivery_checked", { deliverable: true });
    } catch {
      setResult({ ok: false, message: t("delivery.error") });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 bg-background p-6 shadow-[0_18px_50px_-32px_rgba(40,28,16,0.5)] ring-1 ring-foreground/8 sm:p-8"
    >
      <Field id="line1" label={t("delivery.search")} hint={t("delivery.hint")}>
        <AddressAutocomplete
          value={address}
          onChange={(next) => {
            setAddress(next);
            setResult(null);
          }}
        />
      </Field>
      {address.postalCode ? (
        <Field id="postal-code" label={t("delivery.postcode")}>
          <Input
            id="postal-code"
            name="postalCode"
            inputMode="numeric"
            autoComplete="postal-code"
            value={address.postalCode}
            onChange={(event) => setAddress({ ...address, postalCode: event.target.value })}
          />
        </Field>
      ) : null}
      <Button size="touch" variant="gold" type="submit" disabled={pending}>
        {pending ? t("delivery.checking") : t("delivery.check")}
      </Button>
      {result?.ok ? (
        <div role="status" className="grid gap-3">
          <p className="text-sm text-forest">{t("delivery.available")}</p>
          <DeliveryOptionsList options={result.options} onSelect={() => undefined} customerCanSelect={false} />
        </div>
      ) : null}
      {result && !result.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {result.message}
        </p>
      ) : null}
    </form>
  );
}
