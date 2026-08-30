"use client";

import { useEffect, useState } from "react";
import { Field } from "@/components/brand/field";
import { useT } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

type Slot = { value: string; date: string; label: string };
type Day = { date: string; label: string; slots: Slot[] };

const selectClassName =
  "h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export function DeliverySlotFields({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (iso: string) => void;
  error?: string;
}) {
  const t = useT();
  const [days, setDays] = useState<Day[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const selectedDay = days.find((day) => day.slots.some((slot) => slot.value === value));
  const date = selectedDay?.date ?? days[0]?.date ?? "";
  const times = days.find((day) => day.date === date)?.slots ?? [];

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/fulfillment/slots", { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as { dates?: Day[] };
        if (!response.ok || !body.dates?.length) {
          setLoadError(t("checkout.needSlot"));
          return;
        }
        setDays(body.dates);
        setLoadError(null);
        if (!value && body.dates[0]?.slots[0]) {
          onChange(body.dates[0].slots[0].value);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setLoadError(t("checkout.needSlot"));
      });
    return () => controller.abort();
    // First load only — parent owns the selected value afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  function changeDate(nextDate: string) {
    const next = days.find((day) => day.date === nextDate)?.slots[0];
    if (next) {
      onChange(next.value);
    }
  }

  return (
    <fieldset className="grid gap-4">
      <legend className="font-heading text-2xl">{t("checkout.slot")}</legend>
      <p className="text-sm text-muted-foreground">{t("checkout.slotHint")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="delivery-date" label={t("checkout.slotDate")}>
          <select
            id="delivery-date"
            className={cn(selectClassName)}
            value={date}
            onChange={(event) => changeDate(event.target.value)}
            disabled={days.length === 0}
          >
            {days.map((day) => (
              <option key={day.date} value={day.date}>
                {day.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="delivery-time" label={t("checkout.slotTime")} error={error ?? loadError ?? undefined}>
          <select
            id="delivery-time"
            className={cn(selectClassName)}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={times.length === 0}
          >
            {times.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </fieldset>
  );
}
