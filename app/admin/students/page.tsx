import { createClient } from "@/lib/supabase/server";
import { updatePaymentStatus, markProgramComplete } from "@/lib/actions/admin";
import { DeleteButton } from "@/components/DeleteButton";
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

  const NO_PROGRAM = "No program assigned";
  const studentGroups = new Map<string, Profile[]>();
  for (const student of (students ?? []) as Profile[]) {
    const programName = student.program_id ? programMap.get(student.program_id)?.name ?? NO_PROGRAM : NO_PROGRAM;
    const list = studentGroups.get(programName) ?? [];
    list.push(student);
    studentGroups.set(programName, list);
  }
  const sortedGroups = [...studentGroups.entries()].sort(([a], [b]) => {
    if (a === NO_PROGRAM) return 1;
    if (b === NO_PROGRAM) return -1;
    return a.localeCompare(b);
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Students</h1>
        <a href="/api/export/students" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Export CSV
        </a>
      </div>

      {sortedGroups.length === 0 && <p className="mt-6 text-sm text-slate-500">No students yet.</p>}

      {sortedGroups.map(([programName, programStudents]) => (
        <div key={programName} className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{programName}</h2>
          <div className="mt-2 space-y-2">
            {programStudents.map((student) => {
              const program = student.program_id ? programMap.get(student.program_id) : null;
              const total = student.program_id ? totalCreditsByProgram.get(student.program_id) ?? 0 : 0;
              const completed = completedCredits(student.id, student.program_id);
              return (
                <div key={student.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    {student.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={student.avatar_url}
                        alt={student.full_name}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-gold/30"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{student.full_name}</p>
                      <p className="text-sm text-slate-500">{student.email}</p>
                      {student.student_number && (
                        <p className="text-xs text-slate-400">ID: {student.student_number}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {program ? (
                      <>
                        <Link href={`/admin/programs/${program.id}`} className="text-sm font-medium text-gold-dark hover:underline">
                          {program.name}
                        </Link>
                        <p className="text-sm text-slate-500">{completed} of {total} credits</p>
                      </>
                    ) : (
                      <span className="text-sm text-slate-400">No program</span>
                    )}
                    {/* Payment status */}
                    <form action={updatePaymentStatus} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={student.id} />
                      <select
                        name="payment_status"
                        defaultValue={student.payment_status ?? "unpaid"}
                        className={`rounded border px-2 py-0.5 text-xs font-semibold ${student.payment_status === "paid" ? "border-green-300 bg-green-50 text-green-700" : student.payment_status === "partial" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700"}`}
                        onChange={undefined}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                      </select>
                      <DeleteButton label="Save" pendingLabel="…" className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50" />
                    </form>
                    {/* Completion */}
                    <form action={markProgramComplete}>
                      <input type="hidden" name="id" value={student.id} />
                      {student.completed_at ? (
                        <>
                          <input type="hidden" name="undo" value="1" />
                          <DeleteButton label="✓ Completed — Undo" pendingLabel="…" className="text-xs font-semibold text-green-600 hover:text-red-500 disabled:opacity-50" />
                        </>
                      ) : (
                        <DeleteButton label="Mark Complete" pendingLabel="…" className="text-xs text-slate-400 hover:text-green-600 disabled:opacity-50" />
                      )}
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
