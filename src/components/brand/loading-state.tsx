import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}
    >
      <span className="size-5 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      <span>{label}</span>
    </div>
  );
}

export function MealCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <Spinner label={label} />
    </div>
  );
}
