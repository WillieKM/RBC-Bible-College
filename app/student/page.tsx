import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Assignment, Course } from "@/lib/types";
import Link from "next/link";

export default async function StudentHomePage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const [{ data: enrollments }, { data: program }, { data: programCourses }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("*, courses(*, cohorts(name))")
      .eq("student_id", profile.id),
    profile.program_id
      ? supabase.from("programs").select("*").eq("id", profile.program_id).single()
      : Promise.resolve({ data: null }),
    profile.program_id
      ? supabase.from("courses").select("*").eq("program_id", profile.program_id)
      : Promise.resolve({ data: [] as Course[] }),
  ]);

  const courseIds = (enrollments ?? []).map((e) => e.courses.id);

  const [{ data: assignments }, { data: submissions }] = await Promise.all([
    courseIds.length > 0
      ? supabase.from("assignments").select("*").in("course_id", courseIds)
      : Promise.resolve({ data: [] as Assignment[] }),
    supabase.from("submissions").select("*").eq("student_id", profile.id),
  ]);

  const submissionMap = new Map((submissions ?? []).map((s) => [s.assignment_id, s]));
  const assignmentsByCourse = new Map<string, Assignment[]>();
  for (const a of assignments ?? []) {
    const list = assignmentsByCourse.get(a.course_id) ?? [];
    list.push(a);
    assignmentsByCourse.set(a.course_id, list);
  }

  const completedCourseIds = new Set(
    courseIds.filter((id) => {
      const courseAssignments = assignmentsByCourse.get(id) ?? [];
      return courseAssignments.length > 0 && courseAssignments.every((a) => submissionMap.get(a.id)?.grade != null);
    })
  );

  const courseTitleMap = new Map((programCourses ?? []).map((c: Course) => [c.id, `${c.title}${c.code ? ` (${c.code})` : ""}`]));
  const totalCredits = (programCourses ?? []).reduce((sum: number, c: Course) => sum + (c.credits ?? 0), 0);
  const completedCredits = (programCourses ?? [])
    .filter((c: Course) => completedCourseIds.has(c.id))
    .reduce((sum: number, c: Course) => sum + (c.credits ?? 0), 0);
  const remainingModules = (programCourses ?? []).filter((c: Course) => !completedCourseIds.has(c.id));

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (assignments ?? [])
    .filter((a) => a.due_date && a.due_date >= today && submissionMap.get(a.id)?.grade == null)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Modules</h1>
      <p className="text-sm text-slate-500">{program ? program.name : "No program assigned yet"}</p>

      {profile.program_id && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Degree Progress</h2>
          <p className="mt-1 text-sm text-slate-600">
            {completedCredits} of {totalCredits} credits completed
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${totalCredits > 0 ? Math.min(100, (completedCredits / totalCredits) * 100) : 0}%` }}
            />
          </div>
          {remainingModules.length > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              Remaining: {remainingModules.map((c: Course) => c.title).join(", ")}
            </p>
          )}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Upcoming Due Dates</h2>
          <div className="mt-3 space-y-2">
            {upcoming.map((a) => {
              const course = (enrollments ?? []).find((e) => e.courses.id === a.course_id)?.courses;
              return (
                <Link
                  key={a.id}
                  href={`/student/assignments/${a.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm hover:border-gold"
                >
                  <span className="font-medium text-slate-800">
                    {a.title} <span className="text-slate-400">— {course?.title}</span>
                  </span>
                  <span className="text-slate-500">Due {a.due_date}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <h2 className="mt-6 text-lg font-semibold text-slate-800">Modules</h2>
      <div className="mt-3 space-y-2">
        {(enrollments ?? []).map((e) => {
          const course = e.courses as Course;
          const prerequisiteTitle = course.prerequisite_id ? courseTitleMap.get(course.prerequisite_id) : null;
          const locked = !!course.prerequisite_id && !completedCourseIds.has(course.prerequisite_id);
          return (
            <Link
              key={e.id}
              href={`/student/courses/${course.id}`}
              className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-gold"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">
                  {course.title} {course.code ? <span className="text-slate-400">({course.code})</span> : null}
                </p>
                {completedCourseIds.has(course.id) && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Completed</span>
                )}
                {locked && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    Locked — complete {prerequisiteTitle} first
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{(e.courses as { cohorts?: { name: string } | null }).cohorts?.name ?? "No cohort"}</p>
            </Link>
          );
        })}
        {(enrollments ?? []).length === 0 && <p className="text-sm text-slate-500">You're not enrolled in any courses yet.</p>}
      </div>
    </div>
  );
}
