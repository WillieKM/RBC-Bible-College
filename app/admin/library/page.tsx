import { createClient } from "@/lib/supabase/server";
import { saveLibraryResource, deleteLibraryResource } from "@/lib/actions/library";
import { DeleteButton } from "@/components/DeleteButton";
import type { LibraryResource } from "@/lib/types";

const CATEGORIES = ["General", "Old Testament", "New Testament", "Theology", "Church History", "Homiletics", "Pastoral Ministry", "Missions", "Christian Living", "Prayer"];

export default async function AdminLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data } = await supabase
    .from("library_resources")
    .select("*")
    .order("category")
    .order("title");

  const resources = (data ?? []) as LibraryResource[];
  const editId = params.edit ?? null;
  const editItem = editId ? resources.find((r) => r.id === editId) ?? null : null;

  const grouped = new Map<string, LibraryResource[]>();
  for (const r of resources) {
    const list = grouped.get(r.category) ?? [];
    list.push(r);
    grouped.set(r.category, list);
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Library</h1>
          <p className="mt-1 text-sm text-slate-500">{resources.length} resource{resources.length !== 1 ? "s" : ""} across {grouped.size} categor{grouped.size !== 1 ? "ies" : "y"}</p>
        </div>
        <a href="/student/library" target="_blank" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Preview →
        </a>
      </div>

      {/* Editor */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800">{editItem ? `Editing: "${editItem.title}"` : "Add Resource"}</h2>
        <form action={saveLibraryResource} className="mt-4 space-y-4">
          {editItem && <input type="hidden" name="id" value={editItem.id} />}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
              <select
                name="category"
                defaultValue={editItem?.category ?? "General"}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Title</label>
              <input
                name="title"
                required
                defaultValue={editItem?.title ?? ""}
                placeholder="e.g. Systematic Theology — Wayne Grudem"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editItem?.description ?? ""}
              placeholder="Brief description of what this resource covers…"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">URL (link to book, article, PDF, or video)</label>
            <input
              name="url"
              type="url"
              defaultValue={editItem?.url ?? ""}
              placeholder="https://…"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div className="flex items-center gap-3">
            <DeleteButton
              label={editItem ? "Save Changes" : "Add Resource"}
              pendingLabel="Saving…"
              className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
            />
            {editItem && (
              <a href="/admin/library" className="text-sm text-slate-500 hover:text-slate-700">Cancel</a>
            )}
          </div>
        </form>
      </div>

      {/* Resources grouped by category */}
      {[...grouped.entries()].map(([category, items]) => (
        <div key={category}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {category} · {items.length}
          </h2>
          <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {items.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{r.title}</p>
                  {r.description && <p className="mt-0.5 text-sm text-slate-500">{r.description}</p>}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 block truncate text-xs text-gold-dark hover:underline">
                      {r.url}
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <a href={`/admin/library?edit=${r.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Edit</a>
                  <form action={deleteLibraryResource}>
                    <input type="hidden" name="id" value={r.id} />
                    <DeleteButton label="Delete" pendingLabel="…" className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50" />
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {resources.length === 0 && (
        <p className="text-sm text-slate-400">No resources yet. Add your first one above.</p>
      )}
    </div>
  );
}
