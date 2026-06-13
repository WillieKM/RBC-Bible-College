import { createClient } from "@/lib/supabase/server";
import { createCohort, deleteCohort } from "@/lib/actions/admin";
import type { Cohort } from "@/lib/types";

export default async function AdminCohortsPage() {
  const supabase = await createClient();
  const { data: cohorts } = await supabase.from("cohorts").select("*").order("start_date", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Cohorts / Terms</h1>

      <form action={createCohort} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input name="name" required placeholder="Fall 2026" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Start date</label>
          <input name="start_date" type="date" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">End date</label>
          <input name="end_date" type="date" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
          Add Cohort
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {(cohorts ?? []).map((cohort: Cohort) => (
          <div key={cohort.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="font-semibold text-slate-900">{cohort.name}</p>
              <p className="text-sm text-slate-500">
                {cohort.start_date ?? "?"} – {cohort.end_date ?? "?"}
              </p>
            </div>
            <form action={deleteCohort}>
              <input type="hidden" name="id" value={cohort.id} />
              <button className="text-sm font-medium text-red-600 hover:underline">Delete</button>
            </form>
          </div>
        ))}
        {(cohorts ?? []).length === 0 && <p className="text-sm text-slate-500">No cohorts yet.</p>}
      </div>
    </div>
  );
}
