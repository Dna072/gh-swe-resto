"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/brand/price";
import { ActionResultDialog } from "@/components/admin/action-result-dialog";
import { useActionFeedback } from "@/components/admin/use-action-feedback";
import { adminFetch } from "@/lib/admin/client";
import type { StaffOrder } from "@/lib/orders/staff";
import { formatSlot } from "@/lib/orders/slot-format";

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<StaffOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { feedback, succeed, fail, close } = useActionFeedback();

  useEffect(() => {
    adminFetch<{ order: StaffOrder }>(`/api/admin/orders/${id}`)
      .then((body) => setOrder(body.order))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load this order."));
  }, [id]);

  async function refund() {
    if (!order) {
      return;
    }
    setBusy(true);
    try {
      const result = await adminFetch<{ order: StaffOrder }>(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setOrder(result.order);
      succeed("Refund recorded", `${order.publicOrderNumber} is marked refunded.`);
    } catch (cause) {
      fail("Refund failed", cause instanceof Error ? cause.message : "Could not refund this order.");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-destructive">{error}</main>;
  }
  if (!order) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-muted-foreground">Loading order…</main>;
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="font-mono text-sm text-earth">{order.publicOrderNumber}</p>
        <h1 className="mt-2 font-heading text-4xl">{order.customerName}</h1>
        <p className="mt-2 text-muted-foreground">
          {order.orderStatus.replaceAll("_", " ").toLowerCase()} · {order.paymentStatus.toLowerCase()}
          {order.scheduledFor ? ` · ${formatSlot(order.scheduledFor, "sv")}` : ""}
        </p>
      </div>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt>Phone</dt>
          <dd>{order.customerPhone}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Email</dt>
          <dd>{order.customerEmail}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Address</dt>
          <dd>{order.addressLabel}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Delivery</dt>
          <dd>{order.deliveryStatus.replaceAll("_", " ").toLowerCase()}</dd>
        </div>
        <div className="flex justify-between gap-3 font-medium">
          <dt>Total</dt>
          <dd>
            <Price ore={order.totalOre} />
          </dd>
        </div>
      </dl>
      {order.trackingUrl ? (
        <p>
          <a href={order.trackingUrl} className="text-earth underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
            Track courier
          </a>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {order.refundable ? (
          <Button size="touch" disabled={busy} onClick={() => void refund()}>
            Refund
          </Button>
        ) : null}
        <Button size="touch" variant="outline" asChild>
          <Link href="/kitchen">Kitchen board</Link>
        </Button>
        <Button size="touch" variant="outline" asChild>
          <Link href="/admin/orders">All orders</Link>
        </Button>
      </div>
      <ActionResultDialog feedback={feedback} onClose={close} />
    </main>
  );
}
