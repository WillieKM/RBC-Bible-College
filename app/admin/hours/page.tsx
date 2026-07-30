import { createAdminClient } from "@/lib/supabase/admin";
import { logProfessorHours, approveProfessorHours, deleteProfessorHours } from "@/lib/actions/hours";
import { DeleteButton } from "@/components/DeleteButton";

export default async function AdminHoursPage() {
  const admin = createAdminClient();

  const [{ data: professors }, { data: hours }] = await Promise.all([
    admin.from("profiles").select("id, full_name, email").eq("role", "professor").order("full_name"),
    admin.from("professor_hours").select("*").order("date", { ascending: false }),
  ]);

  const hoursByProfessor = new Map<string, NonNullable<typeof hours>>();
  for (const h of hours ?? []) {
    const list = hoursByProfessor.get(h.professor_id) ?? [];
    list.push(h);
    hoursByProfessor.set(h.professor_id, list);
  }

  const allEmpty = (professors ?? []).every((p) => (hoursByProfessor.get(p.id) ?? []).length === 0);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Professor Hours</h1>
      <p className="mt-1 text-sm text-slate-500">Log and approve teaching hours for each professor.</p>

      {/* Log hours form */}
      <form action={logProfessorHours} className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800">Log Hours</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Professor</label>
            <select name="professor_id" required defaultValue="" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
              <option value="" disabled>Select professor</option>
              {(professors ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Date</label>
            <input type="date" name="date" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold [color-scheme:light]" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Hours</label>
            <input type="number" name="hours" min="0.5" step="0.5" required placeholder="e.g. 2" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
            <select name="category" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
              <option value="Teaching">Teaching</option>
              <option value="Zoom Session">Zoom Session</option>
              <option value="Grading">Grading</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Description (optional)</label>
            <input type="text" name="description" placeholder="e.g. DCM-015 Church History — Week 3" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>

          <div className="col-span-2">
            <DeleteButton label="Log Hours" pendingLabel="Saving…" className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50" />
          </div>
        </div>
      </form>

      {/* Hours by professor */}
      {allEmpty ? (
        <p className="mt-8 text-sm text-slate-500">No hours logged yet.</p>
      ) : (
        (professors ?? []).map((prof) => {
          const profHours = hoursByProfessor.get(prof.id) ?? [];
          if (profHours.length === 0) return null;

          const totalHours    = profHours.reduce((s, h) => s + Number(h.hours), 0);
          const approvedHours = profHours.filter((h) => h.approved).reduce((s, h) => s + Number(h.hours), 0);
          const pendingCount  = profHours.filter((h) => !h.approved).length;

          return (
            <div key={prof.id} className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* Professor header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <div>
                  <p className="font-semibold text-slate-800">{prof.full_name}</p>
                  <p className="text-xs text-slate-500">{prof.email}</p>
                </div>
                <div className="flex items-center gap-5">
                  {pendingCount > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {pendingCount} pending
                    </span>
                  )}
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Approved</p>
                    <p className="text-base font-bold text-green-700">{approvedHours}h</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-base font-bold text-slate-800">{totalHours}h</p>
                  </div>
                </div>
              </div>

              {/* Hours table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-right">Hours</th>
                    <th className="px-4 py-2 text-right">Status</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {profHours.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-sm text-slate-700">
                        {new Date(h.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">{h.category}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-500">{h.description ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-slate-800">{Number(h.hours)}h</td>
                      <td className="px-4 py-2.5 text-right">
                        {h.approved ? (
                          <span className="text-xs font-semibold text-green-600">Approved</span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-600">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-3">
                          {!h.approved && (
                            <form action={approveProfessorHours}>
                              <input type="hidden" name="id" value={h.id} />
                              <DeleteButton label="Approve" pendingLabel="…" className="text-xs font-medium text-green-600 hover:text-green-800 disabled:opacity-50" />
                            </form>
                          )}
                          <form action={deleteProfessorHours}>
                            <input type="hidden" name="id" value={h.id} />
                            <DeleteButton label="Delete" pendingLabel="…" className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50" />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
