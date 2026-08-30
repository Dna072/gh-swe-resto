import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export default function AdminAnalyticsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-earth">Reports</p>
      <h1 className="mt-2 font-heading text-4xl">Visitors, users, and sales</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        First-party analytics for this restaurant. Locations are city and country only.
      </p>
      <div className="mt-8">
        <AnalyticsDashboard />
      </div>
    </main>
  );
}
