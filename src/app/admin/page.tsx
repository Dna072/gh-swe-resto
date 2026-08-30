import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-earth">Phase 4</p>
        <h1 className="mt-2 font-heading text-4xl">Kitchen and menu</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Run the board, print tickets, and manage meals. Card payment remains Phase 5. Upload real
          kitchen photographs only — never AI-generated food.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="touch" asChild>
          <Link href="/kitchen">Kitchen board</Link>
        </Button>
        <Button size="touch" variant="outline" asChild>
          <Link href="/admin/orders">Orders</Link>
        </Button>
        <Button size="touch" variant="outline" asChild>
          <Link href="/admin/menu">Meals</Link>
        </Button>
        <Button size="touch" variant="outline" asChild>
          <Link href="/admin/homepage">Homepage</Link>
        </Button>
      </div>
    </main>
  );
}
