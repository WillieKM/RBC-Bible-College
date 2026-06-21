import { createClient } from "@/lib/supabase/server";
import type { LibraryResource } from "@/lib/types";

export default async function StudentLibraryPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("library_resources")
    .select("*")
    .order("category")
    .order("title");

  const resources = (data ?? []) as LibraryResource[];

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

      {resources.length === 0 ? (
        <p className="mt-8 text-sm text-slate-400">No resources have been added yet. Check back soon.</p>
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
