import { createClient } from "@/lib/supabase/server";
import type { HandbookPage } from "@/lib/types";

export default async function StudentHandbookPage() {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from("handbook_pages")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Student Handbook</h1>

      {(pages ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-slate-400">The handbook is not yet available. Check back soon.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {(pages ?? []).map((page: HandbookPage) => (
            <div key={page.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{page.title}</h2>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{page.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
