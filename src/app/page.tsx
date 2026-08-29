import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { FlagAccent } from "@/components/brand/flag-accent";

export default function Home() {
  return (
    <main id="main" className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <FlagAccent className="max-w-24" />
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-earth">Phase 1</p>
      <h1 className="font-heading text-4xl text-balance">The design system is ready. The customer homepage is not.</h1>
      <AdinkraRule />
      <p className="text-lg leading-8 text-muted-foreground">
        This release defines typography, colour, and the restaurant UI primitives. The marketing
        homepage and menu arrive in Phase 2.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="touch" asChild>
          <Link href="/design-system">Open design system</Link>
        </Button>
        <Button size="touch" variant="outline" asChild>
          <Link href="/api/health">Health check</Link>
        </Button>
      </div>
    </main>
  );
}
