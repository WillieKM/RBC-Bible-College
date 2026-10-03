import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import Link from "next/link";

export default async function AdminAttendanceReportPage() {
  await requireRole(["admin"]);
  const supabase = createAdminClient();

  const [
    { data: students },
    { data: enrollments },
    { data: courses },
    { data: attendance },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, student_number, program_id").eq("role", "student").order("full_name"),
    supabase.from("enrollments").select("student_id, course_id"),
    supabase.from("courses").select("id, title, code, program_id"),
    supabase.from("attendance").select("student_id, course_id, present"),
  ]);

  const courseMap = new Map((courses ?? []).map((c) => [c.id as string, c as { id: string; title: string; code: string | null; program_id: string | null }]));

  // attendance[studentId][courseId] = { present, total }
  type CourseAtt = { present: number; total: number };
  const attMap = new Map<string, Map<string, CourseAtt>>();
  for (const a of attendance ?? []) {
    if (!attMap.has(a.student_id)) attMap.set(a.student_id, new Map());
    const courseMap2 = attMap.get(a.student_id)!;
    const cur = courseMap2.get(a.course_id) ?? { present: 0, total: 0 };
    courseMap2.set(a.course_id, { present: cur.present + (a.present ? 1 : 0), total: cur.total + 1 });
  }

  // enrolled courses per student
  const enrolledCoursesByStudent = new Map<string, string[]>();
  for (const e of enrollments ?? []) {
    const list = enrolledCoursesByStudent.get(e.student_id) ?? [];
    list.push(e.course_id);
    enrolledCoursesByStudent.set(e.student_id, list);
  }

  const studentList = (students ?? []) as { id: string; full_name: string; student_number: string | null; program_id: string | null }[];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Report</h1>
          <p className="mt-1 text-sm text-slate-500">Per-student attendance rate across all enrolled courses.</p>
        </div>
        <a
          href="/api/export/attendance"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Export CSV
        </a>
      </div>

      {studentList.length === 0 && <p className="mt-6 text-sm text-slate-500">No students yet.</p>}

      <div className="mt-6 space-y-4">
        {studentList.map((student) => {
          const courseIds = enrolledCoursesByStudent.get(student.id) ?? [];
          const courseAttRows = courseIds
            .map((cid) => {
              const course = courseMap.get(cid);
              if (!course) return null;
              const att = attMap.get(student.id)?.get(cid);
              return { course, att };
            })
            .filter(Boolean) as { course: { id: string; title: string; code: string | null }; att: CourseAtt | undefined }[];

          const overallPresent = courseAttRows.reduce((s, r) => s + (r.att?.present ?? 0), 0);
          const overallTotal = courseAttRows.reduce((s, r) => s + (r.att?.total ?? 0), 0);
          const overallPct = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : null;

          return (
            <div key={student.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <div>
                  <Link href={`/admin/students/${student.id}`} className="font-semibold text-slate-900 hover:text-gold-dark">
                    {student.full_name}
                  </Link>
                  {student.student_number && (
                    <span className="ml-2 text-xs text-slate-400">{student.student_number}</span>
                  )}
                </div>
                <div className="text-right">
                  {overallPct !== null ? (
                    <>
                      <span className={`text-sm font-bold ${overallPct >= 80 ? "text-green-700" : overallPct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                        {overallPct}% overall
                      </span>
                      <p className="text-xs text-slate-400">{overallPresent}/{overallTotal} sessions</p>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400">No attendance recorded</span>
                  )}
                </div>
              </div>

              {courseAttRows.length === 0 ? (
                <p className="px-5 py-3 text-xs text-slate-400">Not enrolled in any courses.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {courseAttRows.map(({ course, att }) => {
                    const pct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
                    return (
                      <div key={course.id} className="flex items-center justify-between px-5 py-2.5">
                        <p className="text-sm text-slate-700">
                          {course.title}
                          {course.code && <span className="ml-1 text-xs text-slate-400">({course.code})</span>}
                        </p>
                        <div className="text-right">
                          {pct !== null ? (
                            <>
                              <span className={`text-sm font-semibold ${pct >= 80 ? "text-green-700" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                                {pct}%
                              </span>
                              <span className="ml-1.5 text-xs text-slate-400">{att!.present}/{att!.total}</span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
