import { createClient } from "@/lib/supabase/server";
import type { Course, Profile, Program } from "@/lib/types";
import Link from "next/link";

export default async function AdminStudentsPage() {
  const supabase = await createClient();

  const [{ data: students }, { data: programs }, { data: courses }, { data: enrollments }, { data: assignments }, { data: submissions }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "student").order("full_name", { ascending: true }),
    supabase.from("programs").select("*"),
    supabase.from("courses").select("id, program_id, credits"),
    supabase.from("enrollments").select("course_id, student_id"),
    supabase.from("assignments").select("id, course_id"),
    supabase.from("submissions").select("assignment_id, student_id, grade"),
  ]);

  const programMap = new Map((programs ?? []).map((p: Program) => [p.id, p]));

  const totalCreditsByProgram = new Map<string, number>();
  for (const c of courses ?? []) {
    if (!c.program_id) continue;
    totalCreditsByProgram.set(c.program_id, (totalCreditsByProgram.get(c.program_id) ?? 0) + (c.credits ?? 0));
  }

  const courseById = new Map((courses ?? []).map((c: Pick<Course, "id" | "program_id" | "credits">) => [c.id, c]));

  const assignmentsByCourse = new Map<string, string[]>();
  for (const a of assignments ?? []) {
    const list = assignmentsByCourse.get(a.course_id) ?? [];
    list.push(a.id);
    assignmentsByCourse.set(a.course_id, list);
  }

  const gradedSet = new Set(
    (submissions ?? []).filter((s) => s.grade != null).map((s) => `${s.student_id}:${s.assignment_id}`)
  );

  const enrollmentsByStudent = new Map<string, string[]>();
  for (const e of enrollments ?? []) {
    const list = enrollmentsByStudent.get(e.student_id) ?? [];
    list.push(e.course_id);
    enrollmentsByStudent.set(e.student_id, list);
  }

  function completedCredits(studentId: string, programId: string | null) {
    if (!programId) return 0;
    const enrolledCourseIds = enrollmentsByStudent.get(studentId) ?? [];
    let credits = 0;
    for (const courseId of enrolledCourseIds) {
      const course = courseById.get(courseId);
      if (!course || course.program_id !== programId) continue;
      const courseAssignments = assignmentsByCourse.get(courseId) ?? [];
      const completed = courseAssignments.length > 0 && courseAssignments.every((aid) => gradedSet.has(`${studentId}:${aid}`));
      if (completed) credits += course.credits ?? 0;
    }
    return credits;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Students</h1>

      <div className="mt-6 space-y-2">
        {(students ?? []).map((student: Profile) => {
          const program = student.program_id ? programMap.get(student.program_id) : null;
          const total = student.program_id ? totalCreditsByProgram.get(student.program_id) ?? 0 : 0;
          const completed = completedCredits(student.id, student.program_id);
          return (
            <div key={student.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="font-semibold text-slate-900">{student.full_name}</p>
                <p className="text-sm text-slate-500">{student.email}</p>
              </div>
              <div className="text-right">
                {program ? (
                  <>
                    <Link href={`/admin/programs/${program.id}`} className="text-sm font-medium text-gold-dark hover:underline">
                      {program.name}
                    </Link>
                    <p className="text-sm text-slate-500">{completed} of {total} credits completed</p>
                  </>
                ) : (
                  <span className="text-sm text-slate-400">No program assigned</span>
                )}
              </div>
            </div>
          );
        })}
        {(students ?? []).length === 0 && <p className="text-sm text-slate-500">No students yet.</p>}
      </div>
    </div>
  );
}
