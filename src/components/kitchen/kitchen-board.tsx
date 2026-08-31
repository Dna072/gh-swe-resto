"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/brand/price";
import { adminFetch } from "@/lib/admin/client";
import type { KitchenAction, StaffOrder } from "@/lib/orders/staff";
import { formatSlot } from "@/lib/orders/slot-format";
import { SpiceLevelBadge } from "@/components/brand/spice-level-badge";
import { spiceLevelOf } from "@/lib/menu/spice-level";
import { toast } from "sonner";

const COLUMNS: Array<{ id: string; title: string; statuses: StaffOrder["orderStatus"][] }> = [
  { id: "incoming", title: "Incoming", statuses: ["PENDING_PAYMENT", "PAID"] },
  { id: "kitchen", title: "Kitchen", statuses: ["CONFIRMED", "PREPARING", "PACKING"] },
  { id: "ready", title: "Ready", statuses: ["READY"] },
  { id: "out", title: "Out", statuses: ["COURIER_ASSIGNED", "OUT_FOR_DELIVERY"] },
  { id: "attention", title: "Attention", statuses: ["DELIVERY_FAILED"] },
];

export function KitchenBoard() {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);

  const load = useCallback(() => {
    adminFetch<{ orders: StaffOrder[] }>("/api/admin/orders")
      .then((payload) => {
        setOrders(payload.orders);
        setError(null);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Could not load the kitchen board.");
      });
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function act(order: StaffOrder, action: KitchenAction) {
    setBusyId(order.id);
    try {
      if (action.to === "SEND_TO_KITCHEN") {
        const result = await adminFetch<{ order: StaffOrder; job?: { payload: Record<string, unknown> } }>(
          `/api/admin/orders/${order.id}`,
          { method: "POST", body: JSON.stringify({ action: "send_to_kitchen" }) },
        );
        setOrders((current) => current.map((entry) => (entry.id === order.id ? result.order : entry)));
        toast.success(`${order.publicOrderNumber} sent to the kitchen.`);
        if (result.job?.payload) {
          setTicket(formatTicket(result.job.payload));
        }
        return;
      }
      if (action.to === "CLAIM") {
        const result = await adminFetch<{ order: StaffOrder }>(`/api/admin/orders/${order.id}`, {
          method: "POST",
          body: JSON.stringify({ action: "claim" }),
        });
        setOrders((current) => current.map((entry) => (entry.id === order.id ? result.order : entry)));
        toast.success(`${order.publicOrderNumber}: you are working on this order.`);
        return;
      }
      const result = await adminFetch<{ order: StaffOrder }>(`/api/admin/orders/${order.id}`, {
        method: "POST",
        body: JSON.stringify({ action: "transition", to: action.to }),
      });
      setOrders((current) => current.map((entry) => (entry.id === order.id ? result.order : entry)));
      toast.success(`${order.publicOrderNumber}: ${action.label}.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not update the order.";
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  async function printTicket(order: StaffOrder) {
    try {
      const result = await adminFetch<{ job: { payload: Record<string, unknown> } }>(
        `/api/admin/orders/${order.id}/print`,
        { method: "POST" },
      );
      setTicket(formatTicket(result.job.payload));
      toast.success(`Ticket ready for ${order.publicOrderNumber}.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not prepare the ticket.";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Refreshes every five seconds. Only prepaid online orders can be sent to
          the kitchen. Unpaid tickets wait here until the guest pays — there is no
          cash-at-counter path.
        </p>
        <Button size="touch" variant="outline" onClick={load}>
          Refresh
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-5">
        {COLUMNS.map((column) => {
          const items = orders.filter((order) => column.statuses.includes(order.orderStatus));
          return (
            <section key={column.id} className="space-y-3">
              <h2 className="font-heading text-2xl">
                {column.title}{" "}
                <span className="text-base text-muted-foreground">{items.length}</span>
              </h2>
              <ul className="grid gap-3">
                {items.map((order) => (
                  <li key={order.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                    <p className="font-mono text-sm text-earth">{order.publicOrderNumber}</p>
                    <p className="mt-1 font-heading text-xl">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.fulfillment === "PICKUP" ? "Pickup" : "Delivery"} · {order.addressLabel}
                    </p>
                    {order.scheduledFor ? (
                      <p className="mt-1 text-sm font-medium text-earth">
                        Scheduled {formatSlot(order.scheduledFor, "sv")}
                      </p>
                    ) : null}
                    <ul className="mt-3 space-y-1 text-sm">
                      {order.items.map((item) => (
                        <li key={`${order.id}-${item.menuItemId}-${item.name}`}>
                          <span>
                            {item.quantity}× {item.name}
                          </span>
                          {item.modifiers.length > 0 ? (
                            <ul className="mt-1 space-y-0.5 text-muted-foreground">
                              {item.modifiers.map((modifier) => {
                                const heat = spiceLevelOf(modifier);
                                return (
                                  <li
                                    key={`${item.menuItemId}-${modifier.groupId}-${modifier.optionId}`}
                                    className="flex flex-wrap items-center gap-2"
                                  >
                                    {modifier.optionName}
                                    {heat ? <SpiceLevelBadge level={heat} /> : null}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    {order.specialInstructions ? (
                      <p className="mt-2 text-sm text-earth">{order.specialInstructions}</p>
                    ) : null}
                    {order.assignedKitchenStaffName ? (
                      <p className="mt-2 text-sm font-medium text-earth">
                        Working: {order.assignedKitchenStaffName}
                      </p>
                    ) : null}
                    {order.fulfillment !== "PICKUP" ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        Delivery: {order.deliveryStatus.replaceAll("_", " ").toLowerCase()}
                      </p>
                    ) : null}
                    {order.trackingUrl ? (
                      <p className="mt-2">
                        <a
                          href={order.trackingUrl}
                          className="text-sm text-earth underline-offset-4 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Track courier
                        </a>
                      </p>
                    ) : null}
                    <div className="mt-3 flex items-center justify-between">
                      <Price ore={order.totalOre} />
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {order.orderStatus.replaceAll("_", " ").toLowerCase()}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {order.actions.map((action) => (
                        <Button
                          key={`${order.id}-${action.to}`}
                          size="touch"
                          variant={action.to === "CANCELLED" || action.to === "DELIVERY_FAILED" ? "outline" : "default"}
                          disabled={busyId === order.id}
                          onClick={() => void act(order, action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                      <Button
                        size="touch"
                        variant="outline"
                        disabled={busyId === order.id}
                        onClick={() => void printTicket(order)}
                      >
                        Print ticket
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {ticket ? (
        <div className="rounded-2xl bg-card p-5 font-mono text-sm ring-1 ring-foreground/10">
          <div className="mb-3 flex justify-between gap-3">
            <h2 className="font-heading text-2xl font-sans">Ticket</h2>
            <Button size="touch" variant="outline" onClick={() => window.print()}>
              Print
            </Button>
          </div>
          <pre className="whitespace-pre-wrap">{ticket}</pre>
        </div>
      ) : null}
    </div>
  );
}

type TicketLine = { quantity: number; name: string; modifiers?: Array<{ name: string }> };

function formatTicket(payload: Record<string, unknown>): string {
  const items = (Array.isArray(payload.items) ? payload.items : []) as TicketLine[];
  const lines = items.map((item) => {
    const extras = item.modifiers?.map((modifier) => modifier.name).join(", ");
    return `  ${item.quantity}× ${item.name}${extras ? ` (${extras})` : ""}`;
  });
  return [
    String(payload.restaurantName ?? "Meridian Fusion Cuisine"),
    String(payload.orderNumber ?? ""),
    String(payload.customerName ?? ""),
    String(payload.phone ?? ""),
    String(payload.address ?? ""),
    payload.scheduledFor ? `When: ${formatSlot(String(payload.scheduledFor), "sv")}` : "",
    "",
    ...lines,
    "",
    payload.instructions ? `Note: ${payload.instructions}` : "",
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}
