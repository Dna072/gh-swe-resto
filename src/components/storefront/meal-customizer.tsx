"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QuantityStepper } from "@/components/brand/quantity-stepper";
import { useLocale } from "@/components/i18n/locale-provider";
import { useCart } from "@/components/cart/cart-provider";
import { localizePublicItem } from "@/lib/i18n/catalog";
import { track } from "@/lib/analytics/client";
import type { CartModifierSelection } from "@/lib/cart/types";
import { SpiceLevelBadge } from "@/components/brand/spice-level-badge";
import { soldOut } from "@/lib/menu/display";
import { spiceLevelOf } from "@/lib/menu/spice-level";
import type { PublicMenuItem, PublicModifierGroup } from "@/lib/menu/public";
import { addOre, formatSek, multiplyOre } from "@/lib/money";
import { cn } from "@/lib/utils";

function defaultSelections(groups: PublicModifierGroup[]): Record<string, string[]> {
  const next: Record<string, string[]> = {};
  for (const group of groups) {
    if (group.required && group.options[0]) {
      next[group.id] = [group.options[0].id];
    } else {
      next[group.id] = [];
    }
  }
  return next;
}

function toModifiers(
  groups: PublicModifierGroup[],
  selected: Record<string, string[]>,
  quantities: Record<string, number>,
): CartModifierSelection[] {
  const modifiers: CartModifierSelection[] = [];
  for (const group of groups) {
    for (const optionId of selected[group.id] ?? []) {
      modifiers.push({
        groupId: group.id,
        optionId,
        quantity: quantities[optionId] ?? 1,
      });
    }
  }
  return modifiers;
}

export function MealCustomizer({ item }: { item: PublicMenuItem }) {
  const { locale, t } = useLocale();
  const localized = useMemo(() => localizePublicItem(item, locale, t), [item, locale, t]);
  const router = useRouter();
  const cart = useCart();
  const unavailable = soldOut(localized);
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState(() => defaultSelections(localized.modifierGroups));
  const [optionQty, setOptionQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");

  const modifiers = useMemo(
    () => toModifiers(localized.modifierGroups, selected, optionQty),
    [localized.modifierGroups, optionQty, selected],
  );

  const previewOre = useMemo(() => {
    const extras = localized.modifierGroups.reduce((sum, group) => {
      return (
        sum +
        (selected[group.id] ?? []).reduce((groupSum, optionId) => {
          const option = group.options.find((entry) => entry.id === optionId);
          if (!option) {
            return groupSum;
          }
          return addOre(groupSum, multiplyOre(option.priceOre, optionQty[optionId] ?? 1));
        }, 0)
      );
    }, 0);
    return multiplyOre(addOre(localized.displayPriceOre, extras), quantity);
  }, [localized.displayPriceOre, localized.modifierGroups, optionQty, quantity, selected]);

  function toggleMulti(group: PublicModifierGroup, optionId: string, on: boolean) {
    setSelected((current) => {
      const existing = current[group.id] ?? [];
      if (on) {
        if (existing.length >= group.maxSelections) {
          return current;
        }
        return { ...current, [group.id]: [...existing, optionId] };
      }
      return { ...current, [group.id]: existing.filter((id) => id !== optionId) };
    });
  }

  function addToCart() {
    if (unavailable) {
      return;
    }
    for (const group of localized.modifierGroups) {
      const count = selected[group.id]?.length ?? 0;
      if (count < group.minSelections || count > group.maxSelections) {
        toast.error(t("menu.chooseOptions", { name: group.name }));
        return;
      }
    }
    cart.addLine({
      menuItemId: localized.id,
      slug: localized.slug,
      name: localized.name,
      quantity,
      modifiers,
      notes: notes.trim() || undefined,
    });
    track("item_added", { menuItemId: localized.id, slug: localized.slug, quantity });
    toast.success(t("menu.added", { name: localized.name }));
    router.push("/cart");
  }

  return (
    <div className="space-y-8">
      {localized.modifierGroups.map((group) => {
        const single = group.maxSelections === 1;
        return (
          <fieldset key={group.id} className="space-y-3">
            <legend className="flex items-center gap-2 font-heading text-xl">
              {group.name}
              {group.required ? (
                <Badge variant="earth">{t("menu.required")}</Badge>
              ) : (
                <Badge variant="outline">{t("menu.optional")}</Badge>
              )}
            </legend>
            {single ? (
              <RadioGroup
                value={selected[group.id]?.[0] ?? ""}
                onValueChange={(value) => setSelected((current) => ({ ...current, [group.id]: [value] }))}
                className="gap-3"
              >
                {group.options.map((option) => {
                  const heat = spiceLevelOf(option);
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "flex min-h-14 items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <RadioGroupItem value={option.id} />
                        <span className="flex flex-wrap items-center gap-2">
                          <span>{option.name}</span>
                          {heat ? (
                            <SpiceLevelBadge
                              level={heat}
                              label={t("menu.spiceRating", { level: heat, max: 3 })}
                            />
                          ) : null}
                        </span>
                      </span>
                      <span className="text-sm text-muted-foreground">{option.priceLabel}</span>
                    </label>
                  );
                })}
              </RadioGroup>
            ) : (
              <div className="grid gap-3">
                {group.options.map((option) => {
                  const checked = (selected[group.id] ?? []).includes(option.id);
                  const heat = spiceLevelOf(option);
                  return (
                    <div
                      key={option.id}
                      className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
                    >
                      <label className="flex items-center gap-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleMulti(group, option.id, value === true)}
                        />
                        <span className="flex flex-wrap items-center gap-2">
                          <span>{option.name}</span>
                          {heat ? (
                            <SpiceLevelBadge
                              level={heat}
                              label={t("menu.spiceRating", { level: heat, max: 3 })}
                            />
                          ) : null}
                        </span>
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{option.priceLabel}</span>
                        {option.allowsQuantity && checked ? (
                          <QuantityStepper
                            label={option.name}
                            value={optionQty[option.id] ?? 1}
                            min={1}
                            max={option.maxQuantity ?? 2}
                            onChange={(next) => setOptionQty((current) => ({ ...current, [option.id]: next }))}
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </fieldset>
        );
      })}

      <div className="grid gap-2">
        <label htmlFor="kitchen-notes" className="text-sm font-medium">
          {t("menu.kitchenNotes")}
        </label>
        <textarea
          id="kitchen-notes"
          maxLength={200}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={t("menu.kitchenNotesPlaceholder")}
          className="min-h-24 rounded-lg border border-input bg-card px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="sticky bottom-16 z-30 flex items-center justify-between gap-3 bg-ink/95 p-3 text-primary-foreground shadow-[0_18px_40px_-24px_rgba(0,0,0,0.7)] backdrop-blur-md md:bottom-4">
        <QuantityStepper value={quantity} onChange={setQuantity} disabled={unavailable} />
        <Button size="touch" variant="gold" disabled={unavailable} onClick={addToCart}>
          {unavailable ? t("menu.unavailable") : (
            <span className="flex items-center gap-2">
              {t("menu.addPriced", { price: formatSek(previewOre) })}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
