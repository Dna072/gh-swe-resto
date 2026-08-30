"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/brand/empty-state";
import { ErrorState } from "@/components/brand/error-state";
import { Price } from "@/components/brand/price";
import { QuantityStepper } from "@/components/brand/quantity-stepper";
import { SpiceLevelBadge } from "@/components/brand/spice-level-badge";
import { spiceLevelOf } from "@/lib/menu/spice-level";
import { Spinner } from "@/components/brand/loading-state";
import { useLocale, useT } from "@/components/i18n/locale-provider";
import { useCart } from "@/components/cart/cart-provider";
import { customerErrorMessage } from "@/lib/i18n/api-errors";
import { localizeMenuName, localizeOptionName } from "@/lib/i18n/catalog";
import { track } from "@/lib/analytics/client";
import type { CartQuote } from "@/domains/cart/models";

type QuoteResult = {
  key: string;
  quote: CartQuote | null;
  error: string | null;
};

function linesKey(restaurantId: string, lines: { menuItemId: string; quantity: number; modifiers: unknown; notes?: string }[]) {
  return JSON.stringify({ restaurantId, lines });
}

export function CartView() {
  const t = useT();
  const { locale } = useLocale();
  const cart = useCart();
  const key = useMemo(
    () =>
      linesKey(
        cart.restaurantId,
        cart.lines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          modifiers: line.modifiers,
          notes: line.notes,
        })),
      ),
    [cart.lines, cart.restaurantId],
  );
  const [result, setResult] = useState<QuoteResult>({ key: "", quote: null, error: null });

  useEffect(() => {
    track("cart_viewed", { lineCount: cart.lines.length });
  }, [cart.lines.length]);

  useEffect(() => {
    if (cart.lines.length === 0) {
      return;
    }
    const requestKey = key;
    const controller = new AbortController();
    void fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: cart.restaurantId,
        lines: cart.lines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          modifiers: line.modifiers,
          notes: line.notes,
        })),
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as CartQuote & { message?: string; code?: string };
        if (!response.ok) {
          setResult({ key: requestKey, quote: null, error: customerErrorMessage(body.code, t, "cart.priceError") });
          return;
        }
        setResult({ key: requestKey, quote: body, error: null });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setResult({ key: requestKey, quote: null, error: t("cart.priceError") });
      });
    return () => controller.abort();
  }, [cart.lines, cart.restaurantId, key, t]);

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        title={t("cart.emptyTitle")}
        description={t("cart.emptyBody")}
        action={
          <Button size="touch" asChild>
            <Link href="/menu">{t("cart.viewMenu")}</Link>
          </Button>
        }
      />
    );
  }

  const quote = result.key === key ? result.quote : null;
  const error = result.key === key ? result.error : null;
  const pending = result.key !== key && !error;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
      <ul className="grid gap-4">
        {cart.lines.map((line, index) => {
          const matched = quote?.lines[index];
          return (
            <li key={line.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-xl">
                    <Link href={`/menu/${line.slug}`} className="hover:text-earth">
                      {localizeMenuName(line.menuItemId, line.name, locale)}
                    </Link>
                  </p>
                  {matched?.modifiers.length ? (
                    <ul className="mt-2 text-sm text-muted-foreground">
                      {matched.modifiers.map((modifier) => (
                        <li key={`${modifier.groupId}-${modifier.optionId}`}>
                          <span className="inline-flex flex-wrap items-center gap-2">
                            {localizeOptionName(modifier.optionId, modifier.optionName, locale)}
                            {spiceLevelOf(modifier) ? (
                              <SpiceLevelBadge level={spiceLevelOf(modifier)!} />
                            ) : null}
                            {modifier.quantity > 1 ? ` ×${modifier.quantity}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {line.notes ? <p className="mt-2 text-sm text-muted-foreground">{line.notes}</p> : null}
                </div>
                {matched ? <Price ore={matched.lineTotalOre} /> : null}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <QuantityStepper
                  value={line.quantity}
                  onChange={(next) => cart.updateQuantity(line.id, next)}
                />
                <Button variant="ghost" onClick={() => cart.removeLine(line.id)}>
                  {t("cart.remove")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <aside className="h-fit rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">{t("cart.totals")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("cart.totalsHint")}</p>
        {pending ? <Spinner className="mt-4" label={t("cart.pricing")} /> : null}
        {error ? <ErrorState className="mt-4" message={error} /> : null}
        {quote ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt>{t("cart.subtotal")}</dt>
              <dd>
                <Price ore={quote.subtotalOre} size="sm" />
              </dd>
            </div>
            {quote.discountTotalOre > 0 ? (
              <div className="flex justify-between gap-3">
                <dt>{t("cart.discount")}</dt>
                <dd>
                  <Price ore={quote.discountTotalOre} size="sm" />
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3 font-medium">
              <dt>{t("cart.total")}</dt>
              <dd>
                <Price ore={quote.totalOre} />
              </dd>
            </div>
          </dl>
        ) : null}
        <Button size="touch" className="mt-6 w-full" asChild>
          <Link href="/checkout">{t("cart.checkout")}</Link>
        </Button>
      </aside>
    </div>
  );
}
