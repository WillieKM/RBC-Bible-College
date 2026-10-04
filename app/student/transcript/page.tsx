import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { PrintButton } from "@/components/PrintButton";

function letterGrade(pct: number) {
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}

function gradeColor(pct: number) {
  if (pct >= 70) return "text-green-700";
  if (pct >= 60) return "text-amber-600";
  return "text-red-600";
}

export default async function StudentTranscriptPage() {
  const profile = await requireRole(["student"]);
  const admin = createAdminClient();

  const [{ data: enrollments }, { data: allPrograms }] = await Promise.all([
    admin
      .from("enrollments")
      .select("course_id, courses(id, title, code, credits, program_id, assignments(id, title, points_possible, due_date))")
      .eq("student_id", profile.id),
    admin.from("programs").select("id, name"),
  ]);

  const courseIds = (enrollments ?? []).map((e) => e.course_id);
  const allAssignmentIds: string[] = [];
  for (const e of enrollments ?? []) {
    const c = e.courses as unknown as { assignments?: { id: string }[] } | null;
    for (const a of c?.assignments ?? []) allAssignmentIds.push(a.id);
  }

  const { data: submissions } = allAssignmentIds.length > 0
    ? await admin
        .from("submissions")
        .select("assignment_id, grade, graded_at")
        .eq("student_id", profile.id)
        .in("assignment_id", allAssignmentIds)
    : { data: [] };

  const submissionMap = new Map((submissions ?? []).map((s) => [s.assignment_id, s]));
  const programMap = new Map((allPrograms ?? []).map((p) => [p.id, p.name]));

  type AssignmentRow = { id: string; title: string; points_possible: number | null; due_date: string | null };
  type CourseRow = { id: string; title: string; code: string | null; credits: number | null; program_id: string | null; assignments: AssignmentRow[] };
  type ComputedCourse = {
    id: string; title: string; code: string | null; credits: number | null; programId: string | null;
    assignments: (AssignmentRow & { submission: { assignment_id: string; grade: number | null; graded_at: string | null } | null })[];
    graded: number; total: number; submitted: number; earnedPts: number; possiblePts: number; pct: number | null;
  };

  const courses: ComputedCourse[] = (enrollments ?? []).flatMap((e) => {
    const c = e.courses as unknown as CourseRow | null;
    if (!c) return [];
    const assignments = (c.assignments ?? []).map((a) => ({
      ...a,
      submission: submissionMap.get(a.id) ?? null,
    }));
    const graded = assignments.filter((a) => a.submission?.grade !== null && a.submission?.grade !== undefined);
    const earnedPts = graded.reduce((s, a) => s + (a.submission?.grade ?? 0), 0);
    const possiblePts = graded.reduce((s, a) => s + (a.points_possible ?? 0), 0);
    const pct = possiblePts > 0 ? Math.round((earnedPts / possiblePts) * 100) : null;
    return [{
      id: c.id, title: c.title, code: c.code, credits: c.credits, programId: c.program_id,
      assignments, graded: graded.length, total: assignments.length,
      submitted: assignments.filter((a) => a.submission).length,
      earnedPts, possiblePts, pct,
    }];
  });

  // Group by program
  const byProgram = new Map<string, ComputedCourse[]>();
  for (const c of courses) {
    const key = c.programId ?? "other";
    const list = byProgram.get(key) ?? [];
    list.push(c);
    byProgram.set(key, list);
  }

  const totalCredits = courses.reduce((s, c) => s + (c.credits ?? 0), 0);
  const totalEarned = courses.reduce((s, c) => s + c.earnedPts, 0);
  const totalPossible = courses.reduce((s, c) => s + c.possiblePts, 0);
  const gpa = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transcript</h1>
          <p className="mt-1 text-sm text-slate-500">Your academic record across all enrolled courses.</p>
        </div>
        <PrintButton />
      </div>

      {/* Summary */}
      {gpa !== null && (
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-xs font-medium text-slate-500">Overall Grade</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${gradeColor(gpa)}`}>{gpa}%</p>
            <p className={`text-sm font-semibold ${gradeColor(gpa)}`}>{letterGrade(gpa)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-xs font-medium text-slate-500">Credits Enrolled</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{totalCredits}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-xs font-medium text-slate-500">Assignments</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
              {courses.reduce((s, c) => s + c.graded, 0)}/{courses.reduce((s, c) => s + c.total, 0)}
            </p>
            <p className="text-xs text-slate-400">graded</p>
          </div>
        </div>
      )}

      {/* Per-program course breakdown */}
      <div className="mt-6 space-y-8">
        {[...byProgram.entries()].map(([programId, programCourses]) => (
          <div key={programId}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
              {programMap.get(programId) ?? "Other Courses"}
            </h2>
            <div className="mt-3 space-y-3">
              {programCourses.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{c.title}</p>
                      <p className="text-xs text-slate-400">
                        {c.code && <span>{c.code} · </span>}
                        {c.credits ? `${c.credits} credits · ` : ""}
                        {c.submitted}/{c.total} submitted · {c.graded}/{c.total} graded
                      </p>
                    </div>
                    {c.pct !== null ? (
                      <div className="text-right">
                        <p className={`text-xl font-bold tabular-nums ${gradeColor(c.pct)}`}>{c.pct}%</p>
                        <p className={`text-sm font-semibold ${gradeColor(c.pct)}`}>{letterGrade(c.pct)}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">No grades yet</span>
                    )}
                  </div>
                  {c.assignments.length > 0 && (
                    <div className="border-t border-slate-50">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-left text-slate-500">
                            <th className="px-5 py-2 font-medium">Assignment</th>
                            <th className="px-3 py-2 text-center font-medium">Points</th>
                            <th className="px-3 py-2 text-center font-medium">Grade</th>
                            <th className="px-3 py-2 text-center font-medium">%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {c.assignments.map((a) => {
                            const grade = a.submission?.grade ?? null;
                            const possible = a.points_possible ?? 0;
                            const pct = grade !== null && possible > 0 ? Math.round((grade / possible) * 100) : null;
                            return (
                              <tr key={a.id} className="hover:bg-slate-50">
                                <td className="px-5 py-2 text-slate-700">{a.title}</td>
                                <td className="px-3 py-2 text-center text-slate-500 tabular-nums">{possible || "—"}</td>
                                <td className="px-3 py-2 text-center tabular-nums">
                                  {grade !== null ? (
                                    <span className={`font-semibold ${gradeColor(pct ?? 0)}`}>{grade}</span>
                                  ) : a.submission ? (
                                    <span className="text-amber-600">Submitted</span>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {pct !== null ? (
                                    <span className={`font-semibold ${gradeColor(pct)}`}>{pct}%</span>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <p className="text-sm text-slate-400">No enrolled courses yet.</p>
        )}
      </div>
    </div>
  );
}
