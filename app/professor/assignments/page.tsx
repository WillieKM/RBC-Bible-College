import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { createAssignment } from "@/lib/actions/professor";
import Link from "next/link";

export default async function ProfessorAssignmentsPage() {
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
        <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">You have no courses assigned yet.</p>
        </div>
      </div>
    );
  }

  const [{ data: assignments }, { data: enrollments }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, title, due_date, points_possible, course_id")
      .in("course_id", courseIds)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("enrollments")
      .select("course_id")
      .in("course_id", courseIds),
  ]);

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: allSubmissions } = assignmentIds.length > 0
    ? await supabase
        .from("submissions")
        .select("assignment_id, grade")
        .in("assignment_id", assignmentIds)
    : { data: [] };

  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));

  const enrollmentCount = new Map<string, number>();
  for (const e of enrollments ?? []) {
    enrollmentCount.set(e.course_id, (enrollmentCount.get(e.course_id) ?? 0) + 1);
  }

  const subCount = new Map<string, number>();
  const ungradedCount = new Map<string, number>();
  for (const s of allSubmissions ?? []) {
    subCount.set(s.assignment_id, (subCount.get(s.assignment_id) ?? 0) + 1);
    if (s.grade == null) {
      ungradedCount.set(s.assignment_id, (ungradedCount.get(s.assignment_id) ?? 0) + 1);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const list = assignments ?? [];

  const needsGrading = list.filter((a) => (ungradedCount.get(a.id) ?? 0) > 0);
  const active = list.filter(
    (a) => (ungradedCount.get(a.id) ?? 0) === 0 && (!a.due_date || a.due_date >= today)
  );
  const past = list.filter(
    (a) => (ungradedCount.get(a.id) ?? 0) === 0 && a.due_date && a.due_date < today
  );

  function formatDue(due: string | null) {
    if (!due) return "No due date";
    return new Date(due).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function AssignmentRow({ a }: { a: (typeof list)[0] }) {
    const course = courseMap.get(a.course_id);
    const submitted = subCount.get(a.id) ?? 0;
    const ungraded = ungradedCount.get(a.id) ?? 0;
    const enrolled = enrollmentCount.get(a.course_id) ?? 0;
    return (
      <Link
        href={`/professor/assignments/${a.id}`}
        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-gold transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate">{a.title}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {course?.title}{course?.code ? ` (${course.code})` : ""}
            {a.points_possible ? ` · ${a.points_possible} pts` : ""}
          </p>
        </div>
        <div className="ml-4 flex shrink-0 flex-col items-end gap-1">
          {ungraded > 0 ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {ungraded} to grade
            </span>
          ) : submitted > 0 ? (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              All graded
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
              No submissions
            </span>
          )}
          <span className="text-xs text-slate-400">
            {submitted}/{enrolled} submitted · {formatDue(a.due_date)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
      <p className="mt-1 text-sm text-slate-500">
        {list.length} assignment{list.length !== 1 ? "s" : ""} across your courses
      </p>

      {/* ── Quick create ── */}
      <details className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-slate-700 hover:text-gold-dark">
          + New Assignment
        </summary>
        <form action={createAssignment} className="flex flex-wrap items-end gap-3 border-t border-slate-100 px-5 pb-5 pt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Course</label>
            <select name="course_id" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select course</option>
              {(courses ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.title}{c.code ? ` (${c.code})` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input name="title" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Due date</label>
            <input name="due_date" type="date" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Points</label>
            <input name="points_possible" type="number" min="0" className="mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea name="description" rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
            Create Assignment
          </button>
        </form>
      </details>

      {list.length === 0 && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">No assignments posted yet.</p>
          <p className="mt-1 text-xs text-slate-400">Go to a course to create an assignment.</p>
        </div>
      )}

      <div className="mt-6 space-y-8">
        {needsGrading.length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Needs Grading ({needsGrading.length})
            </h2>
            <div className="space-y-2">
              {needsGrading.map((a) => <AssignmentRow key={a.id} a={a} />)}
            </div>
          </div>
        )}

        {active.length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Active ({active.length})
            </h2>
            <div className="space-y-2">
              {active.map((a) => <AssignmentRow key={a.id} a={a} />)}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Past ({past.length})
            </h2>
            <div className="space-y-2">
              {past.map((a) => <AssignmentRow key={a.id} a={a} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
