import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { gradeSubmission } from "@/lib/actions/professor";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProfessorAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(["professor"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("*, courses(*)")
    .eq("id", id)
    .single();

  if (!assignment || assignment.courses?.professor_id !== profile.id) notFound();

  const [{ data: submissions }, { data: enrollments }] = await Promise.all([
    supabase.from("submissions").select("*, profiles(*)").eq("assignment_id", id),
    supabase.from("enrollments").select("*, profiles(*)").eq("course_id", assignment.course_id),
  ]);

  const submittedIds = new Set((submissions ?? []).map((s) => s.student_id));
  const notSubmitted = (enrollments ?? []).filter((e) => !submittedIds.has(e.student_id));

  return (
    <div>
      <Link href={`/professor/courses/${assignment.course_id}`} className="text-sm text-gold-dark hover:underline">
        ← Back to {assignment.courses?.title}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{assignment.title}</h1>
      {assignment.description && <p className="mt-1 text-slate-600">{assignment.description}</p>}
      <p className="mt-1 text-sm text-slate-500">
        {assignment.due_date ? `Due ${assignment.due_date}` : "No due date"}
        {assignment.points_possible ? ` · ${assignment.points_possible} pts` : ""}
      </p>

      <h2 className="mt-6 text-lg font-semibold text-slate-800">Submissions ({(submissions ?? []).length})</h2>
      <div className="mt-3 space-y-4">
        {(submissions ?? []).map((s) => (
          <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{s.profiles?.full_name}</p>
              <p className="text-xs text-slate-400">Submitted {new Date(s.submitted_at).toLocaleString()}</p>
            </div>
            {s.content && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{s.content}</p>}
            {s.file_url && (
              <a href={s.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-gold-dark hover:underline">
                View attached file →
              </a>
            )}

            <form action={gradeSubmission} className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
              <input type="hidden" name="submission_id" value={s.id} />
              <input type="hidden" name="assignment_id" value={assignment.id} />
              <div>
                <label className="block text-sm font-medium text-slate-700">Grade</label>
                <input
                  name="grade"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={s.grade ?? ""}
                  max={assignment.points_possible ?? undefined}
                  required
                  className="mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                {assignment.points_possible ? <span className="ml-1 text-sm text-slate-500">/ {assignment.points_possible}</span> : null}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700">Feedback</label>
                <input
                  name="feedback"
                  type="text"
                  defaultValue={s.feedback ?? ""}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
                {s.grade !== null ? "Update Grade" : "Save Grade"}
              </button>
              {s.graded_at && <span className="text-xs text-green-600">Graded {new Date(s.graded_at).toLocaleString()}</span>}
            </form>
          </div>
        ))}
        {(submissions ?? []).length === 0 && <p className="text-sm text-slate-500">No submissions yet.</p>}
      </div>

      {notSubmitted.length > 0 && (
        <>
          <h2 className="mt-6 text-lg font-semibold text-slate-800">Not Submitted</h2>
          <div className="mt-3 space-y-1">
            {notSubmitted.map((e) => (
              <p key={e.id} className="text-sm text-slate-500">{e.profiles?.full_name} — {e.profiles?.email}</p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
