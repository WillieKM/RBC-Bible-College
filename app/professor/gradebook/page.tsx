import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import Link from "next/link";

function letterGrade(pct: number | null) {
  if (pct == null) return "—";
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}

export default async function GradeBookPage() {
  const profile = await requireRole(["professor"]);
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, code")
    .eq("professor_id", profile.id);

  const courseIds = (courses ?? []).map((c) => c.id);

  if (courseIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Grade Book</h1>
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">No courses assigned yet.</p>
        </div>
      </div>
    );
  }

  const [{ data: assignments }, { data: enrollments }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, title, points_possible, course_id")
      .in("course_id", courseIds)
      .order("due_date", { ascending: true }),
    supabase
      .from("enrollments")
      .select("course_id, student_id, profiles(id, full_name)")
      .in("course_id", courseIds),
  ]);

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: submissions } = assignmentIds.length > 0
    ? await supabase
        .from("submissions")
        .select("assignment_id, student_id, grade")
        .in("assignment_id", assignmentIds)
    : { data: [] };

  // grade lookup: studentId → assignmentId → grade
  const gradeMap = new Map<string, Map<string, number | null>>();
  for (const s of submissions ?? []) {
    if (!gradeMap.has(s.student_id)) gradeMap.set(s.student_id, new Map());
    gradeMap.get(s.student_id)!.set(s.assignment_id, s.grade);
  }
  const submittedSet = new Set((submissions ?? []).map((s) => `${s.student_id}:${s.assignment_id}`));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Grade Book</h1>
      <p className="mt-1 text-sm text-slate-500">All students and grades across your courses.</p>

      <div className="mt-6 space-y-10">
        {(courses ?? []).map((course) => {
          const courseAssignments = (assignments ?? []).filter((a) => a.course_id === course.id);
          const courseStudents = (enrollments ?? [])
            .filter((e) => e.course_id === course.id)
            .map((e) => e.profiles as unknown as { id: string; full_name: string } | null)
            .filter(Boolean) as { id: string; full_name: string }[];

          return (
            <div key={course.id}>
              <h2 className="text-lg font-semibold text-slate-800">
                {course.title}
                {course.code ? <span className="ml-2 text-base text-slate-400">({course.code})</span> : null}
              </h2>

              {courseAssignments.length === 0 || courseStudents.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">
                  {courseAssignments.length === 0 ? "No assignments yet." : "No students enrolled."}
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium text-slate-600" style={{ minWidth: "160px" }}>Student</th>
                        {courseAssignments.map((a) => (
                          <th key={a.id} className="px-3 py-2.5 text-center font-medium text-slate-600" style={{ minWidth: "110px" }}>
                            <Link href={`/professor/assignments/${a.id}`} className="hover:text-gold-dark">
                              <span className="block truncate" style={{ maxWidth: "110px" }}>{a.title}</span>
                              {a.points_possible && (
                                <span className="text-xs font-normal text-slate-400">{a.points_possible} pts</span>
                              )}
                            </Link>
                          </th>
                        ))}
                        <th className="px-3 py-2.5 text-center font-medium text-slate-600" style={{ minWidth: "80px" }}>Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseStudents.map((student) => {
                        const sg = gradeMap.get(student.id);
                        const gradedOnes = courseAssignments.filter((a) => sg?.get(a.id) != null);
                        const earned = gradedOnes.reduce((sum, a) => sum + (sg!.get(a.id) ?? 0), 0);
                        const possible = gradedOnes.reduce((sum, a) => sum + (a.points_possible ?? 0), 0);
                        const pct = possible > 0 ? Math.round((earned / possible) * 100) : null;

                        return (
                          <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="px-4 py-2 font-medium text-slate-800">{student.full_name}</td>
                            {courseAssignments.map((a) => {
                              const grade = sg?.get(a.id);
                              const submitted = submittedSet.has(`${student.id}:${a.id}`);
                              return (
                                <td key={a.id} className="px-3 py-2 text-center">
                                  {grade != null ? (
                                    <span className="font-semibold text-green-700">{grade}</span>
                                  ) : submitted ? (
                                    <span className="text-amber-500" title="Submitted — awaiting grade">●</span>
                                  ) : (
                                    <span className="text-slate-200">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2 text-center font-semibold">
                              {pct != null ? (
                                <span className={pct >= 70 ? "text-green-700" : pct >= 50 ? "text-amber-600" : "text-red-600"}>
                                  {pct}% {letterGrade(pct)}
                                </span>
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
                    <span className="font-semibold text-green-700">number</span> = graded &nbsp;·&nbsp;
                    <span className="text-amber-500">●</span> = submitted, awaiting grade &nbsp;·&nbsp;
                    <span className="text-slate-300">—</span> = not submitted
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
