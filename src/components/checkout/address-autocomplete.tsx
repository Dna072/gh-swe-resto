"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/i18n/locale-provider";

export type AddressFields = {
  line1: string;
  postalCode: string;
  city: string;
  lat?: number;
  lng?: number;
  formatted?: string;
};

type Prediction = { placeId: string; description: string };

export function AddressAutocomplete({
  value,
  onChange,
}: {
  value: AddressFields;
  onChange: (next: AddressFields) => void;
}) {
  const t = useT();
  const listId = useId();
  const sessionToken = useRef(
    typeof crypto !== "undefined" ? crypto.randomUUID() : "places-session",
  );
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const skipSearch = useRef(false);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }
    const input = value.line1.trim();
    if (input.length < 3) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch("/api/places/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, sessionToken: sessionToken.current }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const body = (await response.json()) as { predictions?: Prediction[] };
          setPredictions(body.predictions ?? []);
          setOpen((body.predictions ?? []).length > 0);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setPredictions([]);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value.line1]);

  const shown = value.line1.trim().length < 3 ? [] : predictions;
  const listOpen = open && shown.length > 0;

  async function choose(prediction: Prediction) {
    skipSearch.current = true;
    setOpen(false);
    setPredictions([]);
    try {
      const response = await fetch("/api/places/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: prediction.placeId, sessionToken: sessionToken.current }),
      });
      const body = (await response.json()) as { address?: AddressFields | null };
      if (!response.ok || !body.address) {
        onChange({ ...value, line1: prediction.description });
        return;
      }
      onChange({
        line1: body.address.line1,
        postalCode: body.address.postalCode,
        city: body.address.city || "Uppsala",
        lat: body.address.lat,
        lng: body.address.lng,
        formatted: body.address.formatted,
      });
    } catch {
      onChange({ ...value, line1: prediction.description });
    }
  }

  return (
    <div className="relative">
      <Input
        id="line1"
        autoComplete="street-address"
        role="combobox"
        aria-expanded={listOpen}
        aria-controls={listId}
        placeholder={t("checkout.addressSearch")}
        value={value.line1}
        onChange={(event) => {
          onChange({
            ...value,
            line1: event.target.value,
            lat: undefined,
            lng: undefined,
            formatted: undefined,
          });
        }}
        onFocus={() => setOpen(shown.length > 0)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
      />
      {listOpen ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-card p-1 shadow-lg ring-1 ring-foreground/10"
        >
          {shown.map((prediction) => (
            <li key={prediction.placeId}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void choose(prediction)}
              >
                {prediction.description}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
