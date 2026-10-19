// Shown by the portal loading.tsx files while a page's data loads, so a click
// gives instant feedback instead of the old page sitting there (or looking blank).
export function PageSkeleton() {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading">
      <div className="h-7 w-48 rounded-lg bg-slate-200" />
      <div className="mt-2 h-4 w-72 rounded bg-slate-200/70" />
      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="h-4 w-1/3 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
