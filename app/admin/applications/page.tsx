import { createClient } from "@/lib/supabase/server";
import { reviewApplication } from "@/lib/actions/applications";
import type { Application, Cohort } from "@/lib/types";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: applications }, { data: cohorts }] = await Promise.all([
    supabase.from("applications").select("*").order("created_at", { ascending: false }),
    supabase.from("cohorts").select("*").order("start_date", { ascending: false }),
  ]);

  const pending = (applications ?? []).filter((a: Application) => a.status === "pending");
  const reviewed = (applications ?? []).filter((a: Application) => a.status !== "pending");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Applications</h1>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <h2 className="mt-6 text-lg font-semibold text-slate-800">Pending ({pending.length})</h2>
      <div className="mt-3 space-y-3">
        {pending.length === 0 && <p className="text-sm text-slate-500">No pending applications.</p>}
        {pending.map((app: Application) => (
          <div key={app.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">{app.full_name}</p>
                <p className="text-sm text-slate-500">{app.email}{app.phone ? ` · ${app.phone}` : ""}</p>
                <p className="mt-1 text-sm text-slate-700">Program: {app.program}</p>
                <p className="text-sm text-slate-500">
                  {app.region === "usa" ? "RBCI-USA" : "RBCI-KE (TBCS)"}
                </p>
                {app.statement && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{app.statement}</p>
                )}
                {app.details && Object.keys(app.details).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-slate-600">Full application details</summary>
                    <dl className="mt-2 space-y-1 text-sm text-slate-600">
                      {Object.entries(app.details).map(([key, value]) => (
                        <div key={key} className="flex flex-wrap gap-2">
                          <dt className="font-medium text-slate-500">{key.replace(/_/g, " ")}:</dt>
                          <dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "")}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}
              </div>
              <form action={reviewApplication} className="flex shrink-0 flex-col gap-2">
                <input type="hidden" name="id" value={app.id} />
                <select
                  name="cohort_id"
                  defaultValue=""
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                >
                  <option value="">No cohort</option>
                  {(cohorts ?? []).map((c: Cohort) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    name="decision"
                    value="approve"
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    name="decision"
                    value="reject"
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </form>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-800">Reviewed</h2>
      <div className="mt-3 space-y-2">
        {reviewed.length === 0 && <p className="text-sm text-slate-500">No reviewed applications yet.</p>}
        {reviewed.map((app: Application) => (
          <div key={app.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm">
            <span className="font-medium text-slate-800">{app.full_name}</span>
            <span className="text-slate-500">{app.email}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${app.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {app.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
