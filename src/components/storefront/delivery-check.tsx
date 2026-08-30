"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/brand/field";

type CheckResult =
  | { ok: true; zoneName: string; feeLabel: string; etaMinutes: number }
  | { ok: false; message: string };

export function DeliveryCheck() {
  const [postalCode, setPostalCode] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/api/delivery/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode, city: "Uppsala" }),
      });
      const body = (await response.json()) as {
        zoneName?: string;
        feeLabel?: string;
        etaMinutes?: number;
        message?: string;
      };
      if (!response.ok) {
        setResult({ ok: false, message: body.message ?? "We cannot deliver there yet." });
        return;
      }
      setResult({
        ok: true,
        zoneName: body.zoneName ?? "Uppsala",
        feeLabel: body.feeLabel ?? "",
        etaMinutes: body.etaMinutes ?? 0,
      });
    } catch {
      setResult({ ok: false, message: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 bg-background p-6 shadow-[0_18px_50px_-32px_rgba(40,28,16,0.5)] ring-1 ring-foreground/8 sm:p-8">
      <Field
        id="postal-code"
        label="Postcode"
        hint="We check Uppsala delivery zones on the server."
      >
        <Input
          id="postal-code"
          name="postalCode"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="75322"
          value={postalCode}
          onChange={(event) => setPostalCode(event.target.value)}
          required
        />
      </Field>
      <Button size="touch" variant="gold" type="submit" disabled={pending}>
        {pending ? "Checking…" : "Check delivery"}
      </Button>
      {result?.ok ? (
        <p role="status" className="text-sm text-forest">
          Yes — we deliver to {result.zoneName}. From {result.feeLabel}, about {result.etaMinutes}{" "}
          minutes.
        </p>
      ) : null}
      {result && !result.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {result.message}
        </p>
      ) : null}
    </form>
  );
}
