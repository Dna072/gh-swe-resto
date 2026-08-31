"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/brand/field";
import { ActionResultDialog } from "@/components/admin/action-result-dialog";
import { useActionFeedback } from "@/components/admin/use-action-feedback";
import { adminFetch } from "@/lib/admin/client";
import { formatPostalCodes } from "@/lib/geo/postal";
import { formatSek } from "@/lib/money";
import type { DeliverySettings, DeliveryZone } from "@/domains/delivery/models";
import type { DeliveryPricingConfig, DeliveryPricingStrategy } from "@/domains/delivery/pricing";

const STRATEGIES: Array<{ id: DeliveryPricingStrategy; label: string }> = [
  { id: "PASS_THROUGH", label: "Pass-through" },
  { id: "SUBSIDIZED", label: "Subsidized" },
  { id: "FREE", label: "Free" },
  { id: "MARKUP", label: "Markup" },
  { id: "MARKUP_WITH_CEILING", label: "Markup with ceiling" },
];

const PREVIEW_COSTS = [8000, 10000, 12000];

type ZoneDraft = {
  key: string;
  id?: string;
  name: string;
  postalCodesText: string;
  active: boolean;
};

function toDraft(zone: DeliveryZone): ZoneDraft {
  return {
    key: zone.id,
    id: zone.id,
    name: zone.name,
    postalCodesText: formatPostalCodes(zone.postalCodes),
    active: zone.active,
  };
}

function emptyDraft(): ZoneDraft {
  return {
    key: `new-${crypto.randomUUID()}`,
    name: "",
    postalCodesText: "",
    active: true,
  };
}

export default function AdminDeliveryPage() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [zones, setZones] = useState<ZoneDraft[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"zones" | "settings" | null>(null);
  const { feedback, succeed, fail, close } = useActionFeedback();

  useEffect(() => {
    Promise.all([
      adminFetch<{ settings: DeliverySettings }>("/api/admin/delivery-settings"),
      adminFetch<{ zones: DeliveryZone[] }>("/api/admin/delivery-zones"),
    ])
      .then(([settingsBody, zonesBody]) => {
        setSettings(settingsBody.settings);
        setZones(zonesBody.zones.map(toDraft));
      })
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Could not load delivery settings."),
      );
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

  async function saveZones() {
    if (!zones) {
      return;
    }
    setBusy("zones");
    try {
      const saved = await adminFetch<{ zones: DeliveryZone[] }>("/api/admin/delivery-zones", {
        method: "PUT",
        body: JSON.stringify({
          zones: zones.map((zone) => ({
            id: zone.id,
            name: zone.name,
            postalCodes: zone.postalCodesText,
            active: zone.active,
          })),
        }),
      });
      setZones(saved.zones.map(toDraft));
      succeed(
        "Delivery areas saved",
        "Guests can order when their postcode is in an active area. Last-mile quotes still come from the enabled providers below.",
      );
    } catch (cause) {
      fail("Areas not saved", cause instanceof Error ? cause.message : "Could not save delivery areas.");
    } finally {
      setBusy(null);
    }
  }

  async function saveSettings() {
    if (!settings) {
      return;
    }
    setBusy("settings");
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
      setBusy(null);
    }
  }

  if (error) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-destructive">{error}</main>;
  }
  if (!settings || !pricing || !zones) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-muted-foreground">Loading delivery settings…</main>;
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-earth">Admin</p>
        <h1 className="mt-2 font-heading text-4xl">Delivery areas</h1>
        <p className="mt-3 text-muted-foreground">
          Guests can place a delivery order only when their postcode is listed in an active area
          below. After that, checkout quotes the last-mile providers you enable.
        </p>
      </div>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-2 ring-gold/35">
        <div>
          <h2 className="font-heading text-2xl">Where we deliver</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add Swedish five-digit postcodes, one per line or separated by commas. Inactive areas
            are ignored at checkout. Starting Uppsala postcodes are listed below — add others such
            as 75424 (Fålhagen) if guests should be able to order there.
          </p>
        </div>
        {zones.map((zone, index) => (
          <div key={zone.key} className="grid gap-3 rounded-xl bg-background p-4 ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Field id={`zone-name-${zone.key}`} label="Area name" className="min-w-[12rem] flex-1">
                <Input
                  id={`zone-name-${zone.key}`}
                  value={zone.name}
                  onChange={(event) => {
                    const next = [...zones];
                    next[index] = { ...zone, name: event.target.value };
                    setZones(next);
                  }}
                  placeholder="Uppsala centrum"
                />
              </Field>
              <label className="mt-7 flex items-center gap-2 text-sm">
                <Checkbox
                  checked={zone.active}
                  onCheckedChange={(checked) => {
                    const next = [...zones];
                    next[index] = { ...zone, active: checked === true };
                    setZones(next);
                  }}
                />
                Active
              </label>
            </div>
            <Field
              id={`zone-postcodes-${zone.key}`}
              label="Postcodes"
              hint="Example: 75322, 75324, 75424"
            >
              <Textarea
                id={`zone-postcodes-${zone.key}`}
                className="min-h-28 bg-card"
                value={zone.postalCodesText}
                onChange={(event) => {
                  const next = [...zones];
                  next[index] = { ...zone, postalCodesText: event.target.value };
                  setZones(next);
                }}
                placeholder={"75322\n75324\n75424"}
              />
            </Field>
            {zones.length > 1 ? (
              <button
                type="button"
                className="justify-self-start text-sm text-destructive underline-offset-4 hover:underline"
                onClick={() => setZones(zones.filter((_, current) => current !== index))}
              >
                Remove area
              </button>
            ) : null}
          </div>
        ))}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" size="touch" onClick={() => setZones([...zones, emptyDraft()])}>
            Add area
          </Button>
          <Button type="button" size="touch" disabled={busy !== null} onClick={() => void saveZones()}>
            {busy === "zones" ? "Saving areas…" : "Save delivery areas"}
          </Button>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Enabled providers</h2>
        <p className="text-sm text-muted-foreground">
          These partners quote fees and ETAs for addresses already inside an active area.
          Credentials stay in Secret Manager.
        </p>
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

      <Button size="touch" disabled={busy !== null} onClick={() => void saveSettings()}>
        {busy === "settings" ? "Saving…" : "Save delivery settings"}
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
