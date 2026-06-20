import { createClient } from "@/lib/supabase/server";
import { reviewApplication } from "@/lib/actions/applications";
import { deleteApplication } from "@/lib/actions/admin";
import { DeleteButton } from "@/components/DeleteButton";
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

  // Track which emails appear more than once in pending (duplicates)
  const pendingEmailCount = new Map<string, number>();
  for (const a of pending) pendingEmailCount.set(a.email, (pendingEmailCount.get(a.email) ?? 0) + 1);

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
          <div key={app.id} className={`rounded-xl border bg-white p-5 shadow-sm ${(pendingEmailCount.get(app.email) ?? 1) > 1 ? "border-amber-300" : "border-slate-200"}`}>
            {(pendingEmailCount.get(app.email) ?? 1) > 1 && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5">
                <span className="text-xs font-semibold text-amber-700">Duplicate — same email has multiple pending applications</span>
                <form action={deleteApplication}>
                  <input type="hidden" name="id" value={app.id} />
                  <DeleteButton label="Delete this copy" pendingLabel="Deleting…" className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50" />
                </form>
              </div>
            )}
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                {app.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={app.photo_url}
                    alt={app.full_name}
                    className="h-20 w-16 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-2xl font-bold text-slate-400">
                    {app.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">{app.full_name}</p>
                  <p className="text-sm text-slate-500">{app.email}{app.phone ? ` · ${app.phone}` : ""}</p>
                  <p className="mt-1 text-sm text-slate-700">Program: {app.program}</p>
                  <p className="text-sm text-slate-500">
                    {app.program_level === "degree" ? "TBCS (Bachelor's/Master's/Doctorate)" : "RBC Diploma"}
                    {app.region ? ` · ${app.region === "usa" ? "USA Campus" : "Kenya / International"}` : ""}
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
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${app.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {app.status}
              </span>
              <form action={deleteApplication}>
                <input type="hidden" name="id" value={app.id} />
                <DeleteButton label="Delete" pendingLabel="Deleting…" className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50" />
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
