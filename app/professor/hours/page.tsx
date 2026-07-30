import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ProfessorHoursPage() {
  const profile = await requireRole(["professor"]);
  const supabase = await createClient();

  const { data: hours } = await supabase
    .from("professor_hours")
    .select("*")
    .eq("professor_id", profile.id)
    .order("date", { ascending: false });

  const approvedHours = (hours ?? []).filter((h) => h.approved).reduce((s, h) => s + Number(h.hours), 0);
  const totalHours    = (hours ?? []).reduce((s, h) => s + Number(h.hours), 0);
  const pendingCount  = (hours ?? []).filter((h) => !h.approved).length;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">My Hours</h1>
      <p className="mt-1 text-sm text-slate-500">Hours logged and approved by the administration.</p>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approved</p>
          <p className="mt-1 text-3xl font-bold text-green-700">{approvedHours}h</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Logged</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">{totalHours}h</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
          <p className={`mt-1 text-3xl font-bold ${pendingCount > 0 ? "text-amber-600" : "text-slate-400"}`}>{pendingCount}</p>
        </div>
      </div>

      {/* Hours table */}
      {(hours ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No hours recorded yet.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Hours</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(hours ?? []).map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-2.5 text-sm text-slate-700">
                    {new Date(h.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-slate-500">
                    {h.description ?? h.category}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold text-slate-800">{Number(h.hours)}h</td>
                  <td className="px-4 py-2.5 text-right">
                    {h.approved ? (
                      <span className="text-xs font-semibold text-green-600">✓ Approved</span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-600">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
