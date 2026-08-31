"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useT } from "@/components/i18n/locale-provider";

export type PublicDeliveryChoice = {
  provider: string;
  displayName: string;
  estimatedDeliveryMinutes: number;
  customerDeliveryFeeOre: number;
  feeLabel: string;
  quoteId: string;
};

export function DeliveryOptionsList({
  options,
  selectedProvider,
  onSelect,
  customerCanSelect = true,
}: {
  options: PublicDeliveryChoice[];
  selectedProvider?: string;
  onSelect: (provider: string) => void;
  customerCanSelect?: boolean;
}) {
  const t = useT();
  if (options.length === 0) {
    return null;
  }

  const single = options.length === 1 || !customerCanSelect;
  const shown = single ? options.slice(0, 1) : options;

  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium">{t("delivery.optionsTitle")}</p>
      {single ? (
        shown.map((option) => (
          <div key={option.provider} className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
            <p className="font-medium">{option.displayName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("delivery.eta", { eta: option.estimatedDeliveryMinutes })}
            </p>
            <p className="text-sm">{t("delivery.fee", { fee: option.feeLabel })}</p>
          </div>
        ))
      ) : (
        <RadioGroup value={selectedProvider} onValueChange={onSelect} className="gap-3">
          {options.map((option) => (
            <div
              key={option.provider}
              className="flex items-start gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
            >
              <RadioGroupItem id={`provider-${option.provider}`} value={option.provider} className="mt-1" />
              <Label htmlFor={`provider-${option.provider}`} className="grid flex-1 cursor-pointer gap-1 font-normal">
                <span className="font-medium">{option.displayName}</span>
                <span className="text-sm text-muted-foreground">
                  {t("delivery.eta", { eta: option.estimatedDeliveryMinutes })}
                </span>
                <span className="text-sm">{t("delivery.fee", { fee: option.feeLabel })}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </div>
  );
}
