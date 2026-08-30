"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/brand/error-state";
import { Price } from "@/components/brand/price";
import { Spinner } from "@/components/brand/loading-state";
import { useLocale, useT } from "@/components/i18n/locale-provider";
import { useCart } from "@/components/cart/cart-provider";
import { customerErrorMessage } from "@/lib/i18n/api-errors";
import { localizeMenuName } from "@/lib/i18n/catalog";
import { formatSek } from "@/lib/money";
import type { MessageKey, Translator } from "@/lib/i18n/messages";
import { track } from "@/lib/analytics/client";
import { guestTokenFor } from "@/lib/orders/guest-orders";
import type { PublicOrder } from "@/lib/orders/public";
import { formatSlot } from "@/lib/orders/slot-format";

export function OrderConfirmation({
  orderId,
  tokenFromUrl,
}: {
  orderId: string;
  tokenFromUrl?: string;
}) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const cart = useCart();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = tokenFromUrl || guestTokenFor(orderId);
    if (!token) {
      const timer = window.setTimeout(() => {
        setError(t("order.missingToken"));
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const controller = new AbortController();
    void fetch(`/api/orders/${orderId}?token=${encodeURIComponent(token)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as PublicOrder & { message?: string; code?: string };
        if (!response.ok) {
          setError(customerErrorMessage(body.code, t, "order.loadError"));
          return;
        }
        setOrder(body);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setError(t("order.loadError"));
      });
    return () => controller.abort();
  }, [orderId, tokenFromUrl, t]);

  async function pay() {
    const token = tokenFromUrl || guestTokenFor(orderId);
    if (!token) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/pay?token=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const body = (await response.json()) as PublicOrder & { order?: PublicOrder; message?: string };
      if (!response.ok) {
        setError(body.message ?? t("order.payError"));
        return;
      }
      setOrder(body.order ?? body);
      track("payment_completed", { orderId });
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    const token = tokenFromUrl || guestTokenFor(orderId);
    if (!token) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel?token=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const body = (await response.json()) as PublicOrder & { message?: string; code?: string };
      if (!response.ok) {
        setError(customerErrorMessage(body.code, t, "order.cancelError"));
        return;
      }
      setOrder(body);
    } finally {
      setBusy(false);
    }
  }

  async function reorder() {
    const token = tokenFromUrl || guestTokenFor(orderId);
    if (!token) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/reorder?token=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const body = (await response.json()) as {
        lines?: Parameters<typeof cart.replaceWith>[0];
        message?: string;
        code?: string;
      };
      if (!response.ok || !body.lines) {
        setError(customerErrorMessage(body.code, t, "order.reorderError"));
        return;
      }
      cart.replaceWith(body.lines);
      router.push("/cart");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <ErrorState
        title={t("order.unavailable")}
        message={error}
        action={
          <Button size="touch" variant="outline" asChild>
            <Link href="/orders">{t("nav.findOrder")}</Link>
          </Button>
        }
      />
    );
  }

  if (!order) {
    return <Spinner label={t("order.loading")} />;
  }

  return (
    <div className="space-y-6">
      <p className="font-mono text-sm text-earth">{order.publicOrderNumber}</p>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt>{t("order.status")}</dt>
          <dd>{statusLabel(order.orderStatus, t)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{t("order.payment")}</dt>
          <dd>
            {paymentLabel(order.paymentStatus, t)}
            {order.payable ? t("order.paymentDue") : ""}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{t("order.fulfillment")}</dt>
          <dd>{order.fulfillment === "PICKUP" ? t("order.pickup") : t("order.delivery")}</dd>
        </div>
        {order.scheduledFor ? (
          <div className="flex justify-between gap-3">
            <dt>{t("order.scheduledFor")}</dt>
            <dd>{formatSlot(order.scheduledFor, locale)}</dd>
          </div>
        ) : null}
      </dl>
      {order.tracking.length > 0 ? (
        <ol className="grid gap-2">
          {order.tracking.map((step) => (
            <li
              key={step.status}
              className={
                step.current
                  ? "font-medium text-earth"
                  : step.done
                    ? "text-foreground"
                    : "text-muted-foreground"
              }
            >
              {step.done ? "✓ " : step.current ? "→ " : "○ "}
              {trackingLabel(step.status, order.fulfillment, t)}
            </li>
          ))}
        </ol>
      ) : order.orderStatus === "CANCELLED" ? (
        <p className="rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">{t("order.cancelled")}</p>
      ) : null}
      <ul className="grid gap-2">
        {order.items.map((item) => (
          <li key={`${item.menuItemId}-${item.name}`} className="flex justify-between gap-3 text-sm">
            <span>
              {item.quantity}× {localizeMenuName(item.menuItemId, item.name, locale)}
            </span>
            <Price ore={item.lineTotalOre} size="sm" />
          </li>
        ))}
      </ul>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt>{t("order.delivery")}</dt>
          <dd>
            <Price ore={order.deliveryFeeOre} size="sm" />
          </dd>
        </div>
        <div className="flex justify-between gap-3 font-medium">
          <dt>{t("order.total")}</dt>
          <dd>
            <Price ore={order.totalOre} size="lg" />
          </dd>
        </div>
      </dl>
      <p className="rounded-xl bg-card p-4 text-sm text-muted-foreground ring-1 ring-foreground/10">
        {order.fulfillment === "PICKUP" ? (
          <>
            {t("order.pickupAt", {
              address: `${order.deliveryAddress.line1}, ${order.deliveryAddress.postalCode} ${order.deliveryAddress.city}`,
            })}
          </>
        ) : (
          <>
            {t("order.deliverTo", {
              address: `${order.deliveryAddress.line1}, ${order.deliveryAddress.postalCode} ${order.deliveryAddress.city}`,
            })}
          </>
        )}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {order.payable ? (
          <Button size="touch" disabled={busy} onClick={() => void pay()}>
            {t("order.pay", { price: formatSek(order.totalOre) })}
          </Button>
        ) : null}
        {order.cancellable ? (
          <Button size="touch" variant="outline" disabled={busy} onClick={() => void cancel()}>
            {t("order.cancel")}
          </Button>
        ) : null}
        <Button size="touch" variant="outline" disabled={busy} onClick={() => void reorder()}>
          {t("order.again")}
        </Button>
        <Button size="touch" asChild>
          <Link href="/menu">{t("nav.menu")}</Link>
        </Button>
      </div>
    </div>
  );
}

function statusLabel(status: string, t: Translator): string {
  const key = `order.status.${status}` as MessageKey;
  return key in {
    "order.status.PENDING_PAYMENT": true,
    "order.status.CONFIRMED": true,
    "order.status.PREPARING": true,
    "order.status.READY": true,
    "order.status.COURIER_ASSIGNED": true,
    "order.status.OUT_FOR_DELIVERY": true,
    "order.status.DELIVERED": true,
    "order.status.CANCELLED": true,
    "order.status.REFUNDED": true,
  }
    ? t(key)
    : status.replaceAll("_", " ").toLowerCase();
}

function paymentLabel(status: string, t: Translator): string {
  const key = `order.payment.${status}` as MessageKey;
  return key in {
    "order.payment.UNPAID": true,
    "order.payment.PENDING": true,
    "order.payment.PAID": true,
    "order.payment.FAILED": true,
    "order.payment.REFUNDED": true,
  }
    ? t(key)
    : status.toLowerCase();
}

function trackingLabel(status: string, fulfillment: "DELIVERY" | "PICKUP", t: Translator): string {
  if (status === "READY") {
    return t(fulfillment === "PICKUP" ? "tracking.READY_PICKUP" : "tracking.READY_DELIVERY");
  }
  if (status === "DELIVERED") {
    return t(fulfillment === "PICKUP" ? "tracking.DELIVERED_PICKUP" : "tracking.DELIVERED_DELIVERY");
  }
  const key = `tracking.${status}` as MessageKey;
  return key in {
    "tracking.CONFIRMED": true,
    "tracking.PREPARING": true,
    "tracking.COURIER_ASSIGNED": true,
    "tracking.OUT_FOR_DELIVERY": true,
  }
    ? t(key)
    : status.replaceAll("_", " ").toLowerCase();
}
