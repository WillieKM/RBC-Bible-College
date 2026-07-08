import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Attendance, Course } from "@/lib/types";

export default async function StudentAttendancePage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const [
    { data: enrollments },
    { data: attendanceRows },
    { data: zoomAttendanceRows },
  ] = await Promise.all([
    supabase.from("enrollments").select("course_id, courses(id, title, code)").eq("student_id", profile.id),
    supabase.from("attendance").select("*").eq("student_id", profile.id).order("session_date", { ascending: false }),
    supabase
      .from("zoom_attendance")
      .select("*, zoom_sessions(title, meeting_link)")
      .eq("student_id", profile.id)
      .order("session_date", { ascending: false }),
  ]);

  const courseMap = new Map(
    (enrollments ?? []).map((e) => {
      const c = e.courses as unknown as Course | null;
      return c ? [c.id, c] : null;
    }).filter(Boolean) as [string, Course][]
  );

  // ── Course attendance ──────────────────────────────────────────────────────
  const byCourse = new Map<string, Attendance[]>();
  for (const row of (attendanceRows ?? []) as Attendance[]) {
    const list = byCourse.get(row.course_id) ?? [];
    list.push(row);
    byCourse.set(row.course_id, list);
  }

  const courseIds = [...courseMap.keys()];

  function attendanceRate(rows: { present: boolean }[]) {
    if (rows.length === 0) return null;
    const present = rows.filter((r) => r.present).length;
    return Math.round((present / rows.length) * 100);
  }

  // ── Zoom attendance ────────────────────────────────────────────────────────
  type ZoomRow = {
    id: string;
    session_date: string;
    present: boolean;
    zoom_sessions: { title: string; meeting_link: string | null } | null;
  };

  const zoomRows = (zoomAttendanceRows ?? []) as ZoomRow[];
  const zoomRate = attendanceRate(zoomRows);
  const zoomPresent = zoomRows.filter((r) => r.present).length;
  const zoomAbsent = zoomRows.filter((r) => !r.present).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Attendance Record</h1>
      <p className="mt-1 text-sm text-slate-500">Your attendance across all sessions — course classes and Zoom meetings.</p>

      {courseIds.length === 0 && zoomRows.length === 0 && (
        <p className="mt-8 text-sm text-slate-400">No attendance records yet.</p>
      )}

      {/* ── Zoom attendance ── */}
      {zoomRows.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="font-semibold text-slate-900">Zoom Sessions</p>
              <p className="text-xs text-slate-400">Online classes via Zoom</p>
            </div>
            {zoomRate !== null ? (
              <div className="text-right">
                <p className={`text-2xl font-bold ${zoomRate >= 75 ? "text-green-600" : zoomRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {zoomRate}%
                </p>
                <p className="text-xs text-slate-500">{zoomPresent} present · {zoomAbsent} absent</p>
              </div>
            ) : null}
          </div>

          {zoomRate !== null && (
            <div className="px-5 pt-3 pb-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${zoomRate >= 75 ? "bg-green-500" : zoomRate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${zoomRate}%` }}
                />
              </div>
              {zoomRate < 75 && (
                <p className="mt-1.5 text-xs text-amber-600">Attendance below 75% — please speak with your professor.</p>
              )}
            </div>
          )}

          <div className="divide-y divide-slate-50 px-5 pb-2">
            {zoomRows.slice(0, 10).map((row) => (
              <div key={row.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-600">
                  {row.zoom_sessions?.title ?? "Zoom Session"} ·{" "}
                  {new Date(row.session_date + "T00:00:00").toLocaleDateString("en-GB", {
                    weekday: "short", day: "numeric", month: "short",
                  })}
                </span>
                <span className={`font-semibold ${row.present ? "text-green-600" : "text-red-500"}`}>
                  {row.present ? "Present" : "Absent"}
                </span>
              </div>
            ))}
            {zoomRows.length > 10 && (
              <p className="py-2 text-xs text-slate-400">+ {zoomRows.length - 10} more sessions</p>
            )}
          </div>
        </div>
      )}

      {/* ── Course attendance ── */}
      <div className="mt-6 space-y-6">
        {courseIds.map((courseId) => {
          const course = courseMap.get(courseId)!;
          const rows = byCourse.get(courseId) ?? [];
          const rate = attendanceRate(rows);
          const present = rows.filter((r) => r.present).length;
          const absent = rows.filter((r) => !r.present).length;

          return (
            <div key={courseId} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{course.title}</p>
                  {course.code && <p className="text-xs text-slate-400">{course.code}</p>}
                </div>
                {rate !== null ? (
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${rate >= 75 ? "text-green-600" : rate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {rate}%
                    </p>
                    <p className="text-xs text-slate-500">{present} present · {absent} absent</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No sessions recorded</p>
                )}
              </div>

              {rate !== null && (
                <div className="px-5 pt-3 pb-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${rate >= 75 ? "bg-green-500" : rate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  {rate < 75 && (
                    <p className="mt-1.5 text-xs text-amber-600">Attendance below 75% — please speak with your professor.</p>
                  )}
                </div>
              )}

              {rows.length > 0 && (
                <div className="divide-y divide-slate-50 px-5 pb-2">
                  {rows.slice(0, 10).map((row) => (
                    <div key={row.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-600">
                        {new Date(row.session_date + "T00:00:00").toLocaleDateString("en-GB", {
                          weekday: "short", day: "numeric", month: "short",
                        })}
                      </span>
                      <span className={`font-semibold ${row.present ? "text-green-600" : "text-red-500"}`}>
                        {row.present ? "Present" : "Absent"}
                      </span>
                    </div>
                  ))}
                  {rows.length > 10 && (
                    <p className="py-2 text-xs text-slate-400">+ {rows.length - 10} more sessions</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
