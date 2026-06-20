import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Assignment, Submission } from "@/lib/types";

export default async function StudentTranscriptPage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const [{ data: enrollments }, { data: program }] = await Promise.all([
    supabase.from("enrollments").select("*, courses(*)").eq("student_id", profile.id),
    profile.program_id
      ? supabase.from("programs").select("*").eq("id", profile.program_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const courseIds = (enrollments ?? []).map((e) => e.courses.id);

  const [{ data: assignments }, { data: submissions }] = await Promise.all([
    courseIds.length > 0
      ? supabase.from("assignments").select("*").in("course_id", courseIds)
      : Promise.resolve({ data: [] as Assignment[] }),
    supabase.from("submissions").select("*").eq("student_id", profile.id),
  ]);

  const submissionMap = new Map((submissions ?? []).map((s: Submission) => [s.assignment_id, s]));

  const courseData = (enrollments ?? []).map((e) => {
    const course = e.courses;
    const courseAssignments = (assignments ?? []).filter((a: Assignment) => a.course_id === course.id);
    const graded = courseAssignments.filter((a: Assignment) => submissionMap.get(a.id)?.grade != null);
    const totalPoints = graded.reduce((sum: number, a: Assignment) => sum + (a.points_possible ?? 0), 0);
    const earnedPoints = graded.reduce((sum: number, a: Assignment) => {
      const s = submissionMap.get(a.id);
      return sum + (s?.grade ?? 0);
    }, 0);
    const pct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : null;
    return { course, courseAssignments, graded, earnedPoints, totalPoints, pct };
  });

  const overallTotal = courseData.reduce((sum, c) => sum + c.totalPoints, 0);
  const overallEarned = courseData.reduce((sum, c) => sum + c.earnedPoints, 0);
  const overallPct = overallTotal > 0 ? Math.round((overallEarned / overallTotal) * 100) : null;

  function letterGrade(pct: number | null) {
    if (pct === null) return "—";
    if (pct >= 90) return "A";
    if (pct >= 80) return "B";
    if (pct >= 70) return "C";
    if (pct >= 60) return "D";
    return "F";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Transcript</h1>
      <p className="text-sm text-slate-500">{program ? program.name : "No program assigned"}</p>
      {profile.student_number && <p className="text-sm text-slate-500">Student ID: {profile.student_number}</p>}
      {profile.completed_at && (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
          ✓ Program completed {new Date(profile.completed_at).toLocaleDateString()}
        </div>
      )}

      {/* Overall summary */}
      {overallTotal > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Overall Performance</h2>
          <p className="mt-1 text-sm text-slate-600">
            {overallEarned} / {overallTotal} points · {overallPct}% · Grade: <strong>{letterGrade(overallPct)}</strong>
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gold" style={{ width: `${overallPct ?? 0}%` }} />
          </div>
        </div>
      )}

      {/* Per-course breakdown */}
      <div className="mt-6 space-y-6">
        {courseData.map(({ course, courseAssignments, graded, earnedPoints, totalPoints, pct }) => (
          <div key={course.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div>
                <p className="font-semibold text-slate-900">{course.title}</p>
                {course.code && <p className="text-xs text-slate-400">{course.code}</p>}
              </div>
              <div className="text-right">
                {pct !== null ? (
                  <>
                    <p className="text-lg font-bold text-slate-900">{letterGrade(pct)}</p>
                    <p className="text-xs text-slate-500">{pct}% · {earnedPoints}/{totalPoints} pts</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">No grades yet</p>
                )}
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {courseAssignments.map((a: Assignment) => {
                const s = submissionMap.get(a.id);
                return (
                  <div key={a.id} className="flex items-center justify-between px-5 py-2 text-sm">
                    <span className="text-slate-700">{a.title}</span>
                    <span className="text-slate-500">
                      {s?.grade != null
                        ? `${s.grade}${a.points_possible ? ` / ${a.points_possible}` : ""}`
                        : s
                        ? "Submitted — awaiting grade"
                        : "Not submitted"}
                    </span>
                  </div>
                );
              })}
              {courseAssignments.length === 0 && (
                <p className="px-5 py-3 text-sm text-slate-400">No assignments in this course.</p>
              )}
            </div>
          </div>
        ))}
        {courseData.length === 0 && <p className="text-sm text-slate-500">You are not enrolled in any courses yet.</p>}
      </div>
    </div>
  );
}
