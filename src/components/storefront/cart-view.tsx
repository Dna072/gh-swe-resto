"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/brand/empty-state";
import { ErrorState } from "@/components/brand/error-state";
import { Price } from "@/components/brand/price";
import { QuantityStepper } from "@/components/brand/quantity-stepper";
import { Spinner } from "@/components/brand/loading-state";
import { useCart } from "@/components/cart/cart-provider";
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
        const body = (await response.json()) as CartQuote & { message?: string };
        if (!response.ok) {
          setResult({ key: requestKey, quote: null, error: body.message ?? "We could not price this cart." });
          return;
        }
        setResult({ key: requestKey, quote: body, error: null });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setResult({ key: requestKey, quote: null, error: "We could not price this cart." });
      });
    return () => controller.abort();
  }, [cart.lines, cart.restaurantId, key]);

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Today’s plates are on the menu. Add a meal and we will price it on the server."
        action={
          <Button size="touch" asChild>
            <Link href="/menu">View today’s menu</Link>
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
                      {line.name}
                    </Link>
                  </p>
                  {matched?.modifiers.length ? (
                    <ul className="mt-2 text-sm text-muted-foreground">
                      {matched.modifiers.map((modifier) => (
                        <li key={`${modifier.groupId}-${modifier.optionId}`}>
                          {modifier.optionName}
                          {modifier.quantity > 1 ? ` ×${modifier.quantity}` : ""}
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
                  Remove
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <aside className="h-fit rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Totals</h2>
        <p className="mt-1 text-sm text-muted-foreground">Priced by the server. Delivery is added at checkout.</p>
        {pending ? <Spinner className="mt-4" label="Pricing cart" /> : null}
        {error ? <ErrorState className="mt-4" message={error} /> : null}
        {quote ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Subtotal</dt>
              <dd>
                <Price ore={quote.subtotalOre} size="sm" />
              </dd>
            </div>
            {quote.discountTotalOre > 0 ? (
              <div className="flex justify-between gap-3">
                <dt>Discount</dt>
                <dd>
                  <Price ore={quote.discountTotalOre} size="sm" />
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3 font-medium">
              <dt>Total</dt>
              <dd>
                <Price ore={quote.totalOre} />
              </dd>
            </div>
          </dl>
        ) : null}
        <Button size="touch" className="mt-6 w-full" asChild>
          <Link href="/checkout">Continue to checkout</Link>
        </Button>
      </aside>
    </div>
  );
}
