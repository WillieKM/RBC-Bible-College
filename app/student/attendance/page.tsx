import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";

export default async function StudentAttendancePage() {
  const profile = await requireRole(["student"]);
  const admin = createAdminClient();

  const [{ data: enrollments }, { data: attendanceRows }] = await Promise.all([
    admin.from("enrollments").select("course_id, courses(title, code)").eq("student_id", profile.id),
    admin.from("attendance").select("course_id, session_date, present").eq("student_id", profile.id),
  ]);

  // Group attendance by course
  const byCourse = new Map<string, { date: string; present: boolean }[]>();
  for (const row of attendanceRows ?? []) {
    const list = byCourse.get(row.course_id) ?? [];
    list.push({ date: row.session_date, present: row.present });
    byCourse.set(row.course_id, list);
  }

  const courses = (enrollments ?? []).map((e) => {
    const course = e.courses as unknown as { title: string; code: string | null } | null;
    const records = byCourse.get(e.course_id) ?? [];
    const total = records.length;
    const present = records.filter((r) => r.present).length;
    const pct = total > 0 ? Math.round((present / total) * 100) : null;
    return { id: e.course_id, title: course?.title ?? "Unknown", code: course?.code ?? null, total, present, pct, records };
  });

  const overallTotal = courses.reduce((s, c) => s + c.total, 0);
  const overallPresent = courses.reduce((s, c) => s + c.present, 0);
  const overallPct = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : null;

  function pctColor(pct: number | null) {
    if (pct === null) return "text-slate-400";
    if (pct >= 80) return "text-green-700";
    if (pct >= 60) return "text-amber-600";
    return "text-red-600";
  }
  function barColor(pct: number | null) {
    if (pct === null) return "bg-slate-200";
    if (pct >= 80) return "bg-green-500";
    if (pct >= 60) return "bg-amber-400";
    return "bg-red-500";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
      <p className="mt-1 text-sm text-slate-500">Session attendance recorded by your professors across all enrolled courses.</p>

      {overallPct !== null && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-700">Overall Attendance</p>
            <span className={`text-2xl font-bold tabular-nums ${pctColor(overallPct)}`}>{overallPct}%</span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${barColor(overallPct)}`} style={{ width: `${overallPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-400 text-right">{overallPresent} of {overallTotal} sessions attended</p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {courses.length === 0 && (
          <p className="text-sm text-slate-400">No courses enrolled yet.</p>
        )}
        {courses.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="font-semibold text-slate-900">{c.title}</p>
                {c.code && <p className="text-xs text-slate-400">{c.code}</p>}
              </div>
              {c.pct !== null ? (
                <span className={`text-xl font-bold tabular-nums ${pctColor(c.pct)}`}>{c.pct}%</span>
              ) : (
                <span className="text-sm text-slate-400">No records yet</span>
              )}
            </div>
            {c.total > 0 && (
              <div className="px-5 py-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${barColor(c.pct)}`} style={{ width: `${c.pct ?? 0}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{c.present} of {c.total} sessions</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.records.sort((a, b) => a.date.localeCompare(b.date)).map((r) => (
                    <span
                      key={r.date}
                      title={r.date}
                      className={`inline-flex h-6 items-center rounded px-2 text-xs font-medium ${r.present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                    >
                      {new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Attendance is marked by your professor each session. Contact your professor or admin if you believe a record is incorrect.
      </p>
    </div>
  );
}
