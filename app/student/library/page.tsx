import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { LibraryResource } from "@/lib/types";

export default async function StudentLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole(["student"]);
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("library_resources")
    .select("*")
    .order("category")
    .order("title");

  const allResources = (data ?? []) as LibraryResource[];
  const query = (q ?? "").toLowerCase().trim();
  const resources = query
    ? allResources.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          (r.description ?? "").toLowerCase().includes(query) ||
          r.category.toLowerCase().includes(query)
      )
    : allResources;

  const grouped = new Map<string, LibraryResource[]>();
  for (const r of resources) {
    const list = grouped.get(r.category) ?? [];
    list.push(r);
    grouped.set(r.category, list);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Library</h1>
      <p className="mt-1 text-sm text-slate-500">
        Curated books, articles, and resources to support your studies.
      </p>

      <form method="GET" className="mt-4">
        <input
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search by title, category, or keyword…"
          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </form>
      {query && (
        <p className="mt-2 text-sm text-slate-500">
          {resources.length} result{resources.length !== 1 ? "s" : ""} for &ldquo;{q}&rdquo; —{" "}
          <a href="/student/library" className="text-gold-dark hover:underline">clear</a>
        </p>
      )}

      {resources.length === 0 && allResources.length === 0 ? (
        <p className="mt-8 text-sm text-slate-400">No resources have been added yet. Check back soon.</p>
      ) : resources.length === 0 ? (
        <p className="mt-8 text-sm text-slate-400">No resources match &ldquo;{q}&rdquo;.</p>
      ) : (
        <div className="mt-6 space-y-8">
          {[...grouped.entries()].map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                {category}
              </h2>
              <div className="mt-3 space-y-3">
                {items.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{r.title}</p>
                        {r.description && (
                          <p className="mt-1 text-sm text-slate-600">{r.description}</p>
                        )}
                      </div>
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-ink hover:bg-gold-dark"
                        >
                          Open →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
