import { createClient } from "@/lib/supabase/server";
import { saveHandbookPage, deleteHandbookPage } from "@/lib/actions/handbook";
import { DeleteButton } from "@/components/DeleteButton";
import type { HandbookPage } from "@/lib/types";

const SECTIONS = [
  "Welcome",
  "Academic Policies",
  "Student Conduct",
  "Financial Policies",
  "Programs & Graduation",
  "Student Life",
  "General",
];

export default async function AdminHandbookPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data } = await supabase
    .from("handbook_pages")
    .select("*")
    .order("section")
    .order("sort_order");

  const pages = (data ?? []) as HandbookPage[];
  const editId = params.edit ?? null;
  const editPage = editId ? pages.find((p) => p.id === editId) ?? null : null;

  // Group by section
  const grouped = new Map<string, HandbookPage[]>();
  for (const page of pages) {
    const sec = page.section || "General";
    const list = grouped.get(sec) ?? [];
    list.push(page);
    grouped.set(sec, list);
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Handbook</h1>
          <p className="mt-1 text-sm text-slate-500">
            {pages.length} page{pages.length !== 1 ? "s" : ""} across {grouped.size} section{grouped.size !== 1 ? "s" : ""}
          </p>
        </div>
        <a
          href="/student/handbook"
          target="_blank"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Preview →
        </a>
      </div>

      {/* Editor */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800">
          {editPage ? `Editing: "${editPage.title}"` : "Add New Page"}
        </h2>
        <form action={saveHandbookPage} className="mt-4 space-y-4">
          {editPage && <input type="hidden" name="id" value={editPage.id} />}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Section
              </label>
              <select
                name="section"
                defaultValue={editPage?.section ?? "Welcome"}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sort Order
              </label>
              <input
                type="number"
                name="sort_order"
                defaultValue={editPage?.sort_order ?? (pages.length + 1) * 10}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Page Title
            </label>
            <input
              name="title"
              required
              defaultValue={editPage?.title ?? ""}
              placeholder="e.g. Attendance Policy"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Content
              <span className="ml-1 font-normal normal-case text-slate-400">
                — blank lines between paragraphs; UPPERCASE headings stand out as sub-headings
              </span>
            </label>
            <textarea
              name="body"
              required
              rows={14}
              defaultValue={editPage?.body ?? ""}
              placeholder={"OVERVIEW\nWrite an introductory paragraph here.\n\nKEY POLICY\nWrite detail here. Use blank lines to separate paragraphs."}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div className="flex items-center gap-3">
            <DeleteButton
              label={editPage ? "Save Changes" : "Add Page"}
              pendingLabel="Saving…"
              className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
            />
            {editPage && (
              <a
                href="/admin/handbook"
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cancel
              </a>
            )}
          </div>
        </form>
      </div>

      {/* Pages grouped by section */}
      {grouped.size === 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-800">
          <strong>No pages yet.</strong> Run <code className="rounded bg-amber-100 px-1">migration_018_handbook_sections.sql</code> in your Supabase SQL editor to add the section column and seed all 18 handbook pages automatically.
        </div>
      )}

      {[...grouped.entries()].map(([section, sectionPages]) => (
        <div key={section}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {section} · {sectionPages.length} page{sectionPages.length !== 1 ? "s" : ""}
          </h2>
          <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {sectionPages.map((page) => (
              <div
                key={page.id}
                className="flex items-start justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{page.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                    {page.body.slice(0, 140)}…
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Order: {page.sort_order} · Updated{" "}
                    {new Date(page.updated_at ?? page.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={`/admin/handbook?edit=${page.id}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Edit
                  </a>
                  <form action={deleteHandbookPage}>
                    <input type="hidden" name="id" value={page.id} />
                    <DeleteButton
                      label="Delete"
                      pendingLabel="…"
                      className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                    />
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
