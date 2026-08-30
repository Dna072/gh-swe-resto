import { KitchenBoard } from "@/components/kitchen/kitchen-board";

export default function KitchenPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <p className="text-xs uppercase tracking-[0.2em] text-earth">Phase 5</p>
      <h1 className="mt-2 font-heading text-4xl">Kitchen board</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Accept prepaid online orders, cook, pack, and hand over. Guests must pay
        before the kitchen can start — there is no cash-at-counter path and no
        table booking. Unpaid tickets stay in Incoming until they are paid or cancelled.
      </p>
      <div className="mt-8">
        <KitchenBoard />
      </div>
    </main>
  );
}
