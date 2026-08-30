import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-earth">Phase 3</p>
        <h1 className="mt-2 font-heading text-4xl">Menu and homepage media</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Upload real restaurant photographs only. Do not use AI-generated food. Images go to Cloud
          Storage in production; Firestore stores metadata.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="touch" asChild>
          <Link href="/admin/menu">Manage meals</Link>
        </Button>
        <Button size="touch" variant="outline" asChild>
          <Link href="/admin/homepage">Homepage content</Link>
        </Button>
      </div>
    </main>
  );
}
