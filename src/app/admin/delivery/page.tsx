"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/brand/field";
import { ActionResultDialog } from "@/components/admin/action-result-dialog";
import { useActionFeedback } from "@/components/admin/use-action-feedback";
import { adminFetch } from "@/lib/admin/client";
import { formatSek } from "@/lib/money";
import type { DeliverySettings } from "@/domains/delivery/models";
import type { DeliveryPricingConfig, DeliveryPricingStrategy } from "@/domains/delivery/pricing";

const STRATEGIES: Array<{ id: DeliveryPricingStrategy; label: string }> = [
  { id: "PASS_THROUGH", label: "Pass-through" },
  { id: "SUBSIDIZED", label: "Subsidized" },
  { id: "FREE", label: "Free" },
  { id: "MARKUP", label: "Markup" },
  { id: "MARKUP_WITH_CEILING", label: "Markup with ceiling" },
];

const PREVIEW_COSTS = [8000, 10000, 12000];

export default function AdminDeliveryPage() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { feedback, succeed, fail, close } = useActionFeedback();

  useEffect(() => {
    adminFetch<{ settings: DeliverySettings }>("/api/admin/delivery-settings")
      .then((body) => setSettings(body.settings))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load delivery settings."));
  }, []);

  const pricing = settings?.pricing;
  const previews = useMemo(() => {
    if (!pricing) {
      return [];
    }
    return PREVIEW_COSTS.map((cost) => ({
      cost,
      fee: previewCustomerFee(cost, pricing),
    }));
  }, [pricing]);

  async function save() {
    if (!settings) {
      return;
    }
    setBusy(true);
    try {
      const saved = await adminFetch<{ settings: DeliverySettings }>("/api/admin/delivery-settings", {
        method: "PUT",
        body: JSON.stringify({
          providers: settings.providers,
          customerCanSelect: settings.customerCanSelect,
          selectionStrategy: settings.selectionStrategy,
          preferredProvider: settings.preferredProvider,
          pricing: normalizePricing(settings.pricing),
        }),
      });
      setSettings(saved.settings);
      succeed("Delivery settings saved", "Checkout will use this pricing and the enabled providers.");
    } catch (cause) {
      fail("Not saved", cause instanceof Error ? cause.message : "Could not save delivery settings.");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-destructive">{error}</main>;
  }
  if (!settings || !pricing) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-muted-foreground">Loading delivery settings…</main>;
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-earth">Admin</p>
        <h1 className="mt-2 font-heading text-4xl">Delivery</h1>
        <p className="mt-3 text-muted-foreground">
          Enable last-mile providers independently. Availability and quotes come from the selected
          providers — not from a restaurant polygon. Credentials stay in Secret Manager.
        </p>
      </div>

      <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Enabled providers</h2>
        {settings.providers.map((provider, index) => (
          <label key={provider.id} className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={provider.enabled}
              onCheckedChange={(checked) => {
                const providers = [...settings.providers];
                providers[index] = { ...provider, enabled: checked === true };
                setSettings({ ...settings, providers });
              }}
            />
            {provider.displayName}
          </label>
        ))}
        <label className="mt-2 flex items-center gap-3 text-sm">
          <Checkbox
            checked={settings.customerCanSelect}
            onCheckedChange={(checked) => setSettings({ ...settings, customerCanSelect: checked === true })}
          />
          Customers can choose when more than one provider is available
        </label>
        <Field id="preferred" label="Preferred provider">
          <select
            id="preferred"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={settings.preferredProvider ?? ""}
            onChange={(event) =>
              setSettings({
                ...settings,
                preferredProvider: (event.target.value || undefined) as DeliverySettings["preferredProvider"],
              })
            }
          >
            <option value="">None</option>
            {settings.providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.displayName}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Pricing strategy</h2>
        <Field id="strategy" label="Strategy">
          <select
            id="strategy"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={pricing.strategy}
            onChange={(event) =>
              setSettings({
                ...settings,
                pricing: { ...pricing, strategy: event.target.value as DeliveryPricingStrategy },
              })
            }
          >
            {STRATEGIES.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.label}
              </option>
            ))}
          </select>
        </Field>
        {pricing.strategy === "MARKUP" || pricing.strategy === "MARKUP_WITH_CEILING" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="markupType" label="Markup">
              <select
                id="markupType"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={pricing.markupType ?? "PERCENTAGE"}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    pricing: { ...pricing, markupType: event.target.value as "FIXED" | "PERCENTAGE" },
                  })
                }
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed (öre)</option>
              </select>
            </Field>
            <Field id="markupValue" label={pricing.markupType === "FIXED" ? "Markup (öre)" : "Markup %"}>
              <Input
                id="markupValue"
                type="number"
                min={0}
                value={pricing.markupValue ?? 20}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    pricing: { ...pricing, markupValue: Number(event.target.value) },
                  })
                }
              />
            </Field>
          </div>
        ) : null}
        {pricing.strategy === "MARKUP_WITH_CEILING" ? (
          <Field id="ceiling" label="Provider cost ceiling (SEK)">
            <Input
              id="ceiling"
              type="number"
              min={0}
              value={(pricing.markupCeilingOre ?? 10000) / 100}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  pricing: { ...pricing, markupCeilingOre: Math.round(Number(event.target.value) * 100) },
                })
              }
            />
          </Field>
        ) : null}
        {pricing.strategy === "SUBSIDIZED" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="subsidyType" label="Subsidy">
              <select
                id="subsidyType"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                value={pricing.subsidyType ?? "FIXED"}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    pricing: { ...pricing, subsidyType: event.target.value as "FIXED" | "PERCENTAGE" },
                  })
                }
              >
                <option value="FIXED">Fixed (öre)</option>
                <option value="PERCENTAGE">Percentage</option>
              </select>
            </Field>
            <Field id="subsidyValue" label={pricing.subsidyType === "PERCENTAGE" ? "Subsidy %" : "Subsidy (öre)"}>
              <Input
                id="subsidyValue"
                type="number"
                min={0}
                value={pricing.subsidyValue ?? 2000}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    pricing: { ...pricing, subsidyValue: Number(event.target.value) },
                  })
                }
              />
            </Field>
          </div>
        ) : null}
        {pricing.strategy === "MARKUP_WITH_CEILING" ? (
          <p className="text-sm text-muted-foreground">
            Markup is applied when the delivery provider&apos;s quoted cost is at or below the ceiling.
            If the provider&apos;s cost exceeds the ceiling, the full provider cost is passed through to
            the customer.
          </p>
        ) : null}
        <div className="grid gap-1 text-sm">
          <p className="font-medium">Preview</p>
          {previews.map((row) => (
            <p key={row.cost}>
              Provider cost: {formatSek(row.cost)} → Customer pays: {formatSek(row.fee)}
            </p>
          ))}
        </div>
      </section>

      <Button size="touch" disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save delivery settings"}
      </Button>
      <ActionResultDialog feedback={feedback} onClose={close} />
    </main>
  );
}

function normalizePricing(pricing: DeliveryPricingConfig): DeliveryPricingConfig {
  if (pricing.strategy === "MARKUP" || pricing.strategy === "MARKUP_WITH_CEILING") {
    return {
      ...pricing,
      markupType: pricing.markupType ?? "PERCENTAGE",
      markupValue: pricing.markupValue ?? 20,
      markupCeilingOre: pricing.strategy === "MARKUP_WITH_CEILING" ? pricing.markupCeilingOre ?? 10000 : undefined,
    };
  }
  if (pricing.strategy === "SUBSIDIZED") {
    return {
      ...pricing,
      subsidyType: pricing.subsidyType ?? "FIXED",
      subsidyValue: pricing.subsidyValue ?? 2000,
    };
  }
  return { strategy: pricing.strategy, enabled: true };
}

function previewCustomerFee(costOre: number, pricing: DeliveryPricingConfig): number {
  if (pricing.strategy === "FREE") {
    return 0;
  }
  if (pricing.strategy === "PASS_THROUGH") {
    return costOre;
  }
  if (pricing.strategy === "SUBSIDIZED") {
    const subsidy =
      pricing.subsidyType === "PERCENTAGE"
        ? Math.round((costOre * (pricing.subsidyValue ?? 0)) / 100)
        : pricing.subsidyValue ?? 0;
    return Math.max(0, costOre - subsidy);
  }
  const ceiling = pricing.markupCeilingOre ?? 0;
  if (pricing.strategy === "MARKUP_WITH_CEILING" && costOre > ceiling) {
    return costOre;
  }
  const markup =
    pricing.markupType === "PERCENTAGE"
      ? Math.round((costOre * (pricing.markupValue ?? 0)) / 100)
      : pricing.markupValue ?? 0;
  return costOre + markup;
}
