"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/brand/error-state";
import { Price } from "@/components/brand/price";
import { Spinner } from "@/components/brand/loading-state";
import { guestTokenFor } from "@/lib/orders/guest-orders";
import type { PublicOrder } from "@/lib/orders/public";

export function OrderConfirmation({
  orderId,
  tokenFromUrl,
}: {
  orderId: string;
  tokenFromUrl?: string;
}) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = tokenFromUrl || guestTokenFor(orderId);
    if (!token) {
      const timer = window.setTimeout(() => {
        setError("This order link is missing its guest access token.");
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const controller = new AbortController();
    void fetch(`/api/orders/${orderId}?token=${encodeURIComponent(token)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as PublicOrder & { message?: string };
        if (!response.ok) {
          setError(body.message ?? "We could not load this order.");
          return;
        }
        setOrder(body);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setError("We could not load this order.");
      });
    return () => controller.abort();
  }, [orderId, tokenFromUrl]);

  if (error) {
    return (
      <ErrorState
        title="Order unavailable"
        message={error}
        action={
          <Button size="touch" variant="outline" asChild>
            <Link href="/orders">Find an order</Link>
          </Button>
        }
      />
    );
  }

  if (!order) {
    return <Spinner label="Loading order" />;
  }

  return (
    <div className="space-y-6">
      <p className="font-mono text-sm text-earth">{order.publicOrderNumber}</p>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt>Status</dt>
          <dd>{order.orderStatus.replaceAll("_", " ").toLowerCase()}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Payment</dt>
          <dd>{order.paymentStatus.toLowerCase()} — collected in Phase 5</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Fulfillment</dt>
          <dd>{order.fulfillment === "PICKUP" ? "Pickup" : "Delivery"}</dd>
        </div>
      </dl>
      <ul className="grid gap-2">
        {order.items.map((item) => (
          <li key={`${item.menuItemId}-${item.name}`} className="flex justify-between gap-3 text-sm">
            <span>
              {item.quantity}× {item.name}
            </span>
            <Price ore={item.lineTotalOre} size="sm" />
          </li>
        ))}
      </ul>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt>Delivery</dt>
          <dd>
            <Price ore={order.deliveryFeeOre} size="sm" />
          </dd>
        </div>
        <div className="flex justify-between gap-3 font-medium">
          <dt>Total</dt>
          <dd>
            <Price ore={order.totalOre} size="lg" />
          </dd>
        </div>
      </dl>
      <p className="rounded-xl bg-card p-4 text-sm text-muted-foreground ring-1 ring-foreground/10">
        {order.fulfillment === "PICKUP" ? (
          <>
            Pickup at {order.deliveryAddress.line1}, {order.deliveryAddress.postalCode}{" "}
            {order.deliveryAddress.city}.
          </>
        ) : (
          <>
            Deliver to {order.deliveryAddress.line1}, {order.deliveryAddress.postalCode}{" "}
            {order.deliveryAddress.city}.
          </>
        )}
      </p>
      <p className="text-sm text-muted-foreground">
        Keep this page. Guest access uses a one-time token in the link. Kitchen tracking and
        payment come in later phases.
      </p>
      <Button size="touch" asChild>
        <Link href="/menu">Order again</Link>
      </Button>
    </div>
  );
}
