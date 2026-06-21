import { createClient } from "@/lib/supabase/server";
import { saveHandbookPage, deleteHandbookPage } from "@/lib/actions/handbook";
import { DeleteButton } from "@/components/DeleteButton";
import type { HandbookPage } from "@/lib/types";

export default async function AdminHandbookPage() {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from("handbook_pages")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Student Handbook</h1>
      <p className="mt-1 text-sm text-slate-500">Pages are visible to all students and professors in their portals.</p>

      {/* Add/Edit form */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800">Add New Page</h2>
        <form action={saveHandbookPage} className="mt-4 space-y-4">
          <input type="hidden" name="id" value="" />
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600">Title *</label>
              <input name="title" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-slate-600">Sort order</label>
              <input name="sort_order" type="number" defaultValue="0" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Content *</label>
            <textarea name="body" required rows={8} placeholder="Write the handbook page content here. Plain text is fine." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
              Save Page
            </button>
          </div>
        </form>
      </div>

      {/* Pages list */}
      <h2 className="mt-8 font-semibold text-slate-800">Pages ({(pages ?? []).length})</h2>
      <div className="mt-3 space-y-4">
        {(pages ?? []).length === 0 && <p className="text-sm text-slate-400">No handbook pages yet.</p>}
        {(pages ?? []).map((page: HandbookPage) => (
          <div key={page.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">#{page.sort_order}</span>
                  <h3 className="font-semibold text-slate-900">{page.title}</h3>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 line-clamp-3">{page.body}</p>
              </div>
              <form action={deleteHandbookPage}>
                <input type="hidden" name="id" value={page.id} />
                <DeleteButton label="Delete" pendingLabel="Deleting…" className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50" />
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
