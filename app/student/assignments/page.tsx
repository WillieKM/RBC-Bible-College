import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Assignment } from "@/lib/types";
import Link from "next/link";

type Status = "graded" | "submitted" | "overdue" | "due-soon" | "pending";

function getStatus(a: Assignment, submissionMap: Map<string, { grade: number | null; submitted_at: string }>): Status {
  const sub = submissionMap.get(a.id);
  if (sub) {
    return sub.grade != null ? "graded" : "submitted";
  }
  if (!a.due_date) return "pending";
  const due = new Date(a.due_date).getTime();
  const now = Date.now();
  if (due < now) return "overdue";
  if (due - now < 7 * 24 * 60 * 60 * 1000) return "due-soon";
  return "pending";
}

const STATUS_LABEL: Record<Status, string> = {
  graded: "Graded",
  submitted: "Submitted",
  overdue: "Overdue",
  "due-soon": "Due Soon",
  pending: "Not Started",
};

const STATUS_CLASS: Record<Status, string> = {
  graded: "bg-green-100 text-green-700",
  submitted: "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-700",
  "due-soon": "bg-amber-100 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
};

const STATUS_ORDER: Status[] = ["overdue", "due-soon", "pending", "submitted", "graded"];

export default async function StudentAssignmentsPage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, courses(id, title)")
    .eq("student_id", profile.id);

  const courseIds = (enrollments ?? []).map((e) => e.course_id);

  if (courseIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">You are not enrolled in any courses yet.</p>
        </div>
      </div>
    );
  }

  const [{ data: assignments }, { data: submissions }] = await Promise.all([
    supabase
      .from("assignments")
      .select("*, courses(title)")
      .in("course_id", courseIds)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("submissions")
      .select("assignment_id, grade, submitted_at")
      .eq("student_id", profile.id),
  ]);

  const submissionMap = new Map(
    (submissions ?? []).map((s) => [s.assignment_id, { grade: s.grade, submitted_at: s.submitted_at }])
  );

  const list = (assignments ?? []) as (Assignment & { courses: { title: string } })[];

  // Group by status in priority order
  const grouped = new Map<Status, typeof list>();
  for (const status of STATUS_ORDER) grouped.set(status, []);
  for (const a of list) {
    const s = getStatus(a, submissionMap);
    grouped.get(s)!.push(a);
  }

  const totalCount = list.length;
  const doneCount = list.filter((a) => {
    const s = getStatus(a, submissionMap);
    return s === "graded" || s === "submitted";
  }).length;

  function formatDue(due: string | null) {
    if (!due) return "No due date";
    return `Due ${new Date(due).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
          <p className="mt-1 text-sm text-slate-500">
            {doneCount} of {totalCount} submitted or graded
          </p>
        </div>
      </div>

      {totalCount === 0 && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">No assignments have been posted yet.</p>
          <p className="mt-1 text-xs text-slate-400">Check back after your next class.</p>
        </div>
      )}

      <div className="mt-6 space-y-8">
        {STATUS_ORDER.map((status) => {
          const items = grouped.get(status)!;
          if (items.length === 0) return null;
          return (
            <div key={status}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {STATUS_LABEL[status]} ({items.length})
              </h2>
              <div className="space-y-2">
                {items.map((a) => {
                  const sub = submissionMap.get(a.id);
                  return (
                    <Link
                      key={a.id}
                      href={`/student/assignments/${a.id}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-gold transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">{a.title}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {a.courses?.title}
                          {a.points_possible ? ` · ${a.points_possible} pts` : ""}
                          {sub?.grade != null ? ` · Grade: ${sub.grade}/${a.points_possible ?? "?"}` : ""}
                        </p>
                      </div>
                      <div className="ml-4 flex shrink-0 flex-col items-end gap-1">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                        <span className="text-xs text-slate-400">{formatDue(a.due_date)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
