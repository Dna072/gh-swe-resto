"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin/client";
import type { StaffOrder } from "@/lib/orders/staff";
import { formatSlot } from "@/lib/orders/slot-format";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminFetch<{ orders: StaffOrder[] }>("/api/admin/orders")
      .then((payload) => {
        if (!cancelled) {
          setOrders(payload.orders);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load orders.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl">Orders</h1>
          <p className="mt-2 text-muted-foreground">The same board the kitchen uses, as a compact list.</p>
        </div>
        <Button size="touch" asChild>
          <Link href="/kitchen">Open kitchen board</Link>
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="mt-6 divide-y divide-border rounded-2xl bg-card ring-1 ring-foreground/10">
        {orders.map((order) => (
          <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <p className="font-mono text-sm text-earth">{order.publicOrderNumber}</p>
              <p className="font-heading text-xl">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">
                {order.totalLabel} · {order.orderStatus.replaceAll("_", " ").toLowerCase()}
                {order.scheduledFor ? ` · ${formatSlot(order.scheduledFor, "sv")}` : ""}
              </p>
            </div>
            <Button size="touch" variant="outline" asChild>
              <Link href="/kitchen">Open</Link>
            </Button>
          </li>
        ))}
      </ul>
    </main>
  );
}
