"use client";

import { useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/brand/field";
import { useT } from "@/components/i18n/locale-provider";
import { customerErrorMessage } from "@/lib/i18n/api-errors";
import {
  rememberGuestOrder,
  readGuestOrders,
  subscribeGuestOrders,
  EMPTY_GUEST_ORDERS,
} from "@/lib/orders/guest-orders";

export function OrderLookup() {
  const t = useT();
  const router = useRouter();
  const recent = useSyncExternalStore(subscribeGuestOrders, readGuestOrders, () => EMPTY_GUEST_ORDERS);
  const [number, setNumber] = useState("");
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/orders/lookup?number=${encodeURIComponent(number)}&token=${encodeURIComponent(token)}`,
      );
      const body = (await response.json()) as {
        id?: string;
        publicOrderNumber?: string;
        message?: string;
        code?: string;
      };
      if (!response.ok || !body.id) {
        setError(customerErrorMessage(body.code, t, "orders.notFound"));
        return;
      }
      rememberGuestOrder({
        id: body.id,
        token,
        publicOrderNumber: body.publicOrderNumber ?? number,
      });
      router.push(`/orders/${body.id}?token=${encodeURIComponent(token)}`);
    } catch {
      setError(t("orders.notFound"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      {recent.length > 0 ? (
        <ul className="grid gap-3">
          {recent.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}?token=${encodeURIComponent(order.token)}`}
                className="flex min-h-14 items-center justify-between rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 hover:text-earth"
              >
                <span className="font-mono">{order.publicOrderNumber}</span>
                <span className="text-sm text-muted-foreground">{t("orders.open")}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <Field id="order-number" label={t("orders.number")} hint={t("orders.numberHint")}>
          <Input
            id="order-number"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            autoComplete="off"
            required
          />
        </Field>
        <Field id="order-token" label={t("orders.token")}>
          <Input
            id="order-token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete="off"
            required
          />
        </Field>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button size="touch" type="submit" disabled={pending}>
          {pending ? t("orders.looking") : t("orders.find")}
        </Button>
      </form>
    </div>
  );
}
