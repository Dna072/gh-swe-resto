export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Phase 0</p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Ghana Restaurant — architecture foundation
      </h1>
      <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        The customer homepage is intentionally not built yet. This release establishes
        Firestore, security, repositories, payments, delivery, and Cloud Run foundations
        only.
      </p>
      <p className="text-sm text-zinc-500">
        Next recommended phase: design system, then the customer menu.
      </p>
    </main>
  );
}
