import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { gradeSubmission } from "@/lib/actions/professor";
import { gradeWithAI } from "@/lib/actions/ai-grading";
import { resolveSignedFileUrl } from "@/lib/storage";
import { DeleteButton } from "@/components/DeleteButton";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProfessorAssignmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ai_grade?: string; ai_feedback?: string; ai_for?: string; ai_error?: string }>;
}) {
  const profile = await requireRole(["professor"]);
  const { id } = await params;
  const { ai_grade, ai_feedback, ai_for, ai_error } = await searchParams;
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("*, courses(*)")
    .eq("id", id)
    .single();

  if (!assignment || assignment.courses?.professor_id !== profile.id) notFound();

  const [{ data: submissions }, { data: enrollments }, { data: programs }] = await Promise.all([
    supabase.from("submissions").select("*, profiles(*)").eq("assignment_id", id),
    supabase.from("enrollments").select("*, profiles(*)").eq("course_id", assignment.course_id),
    supabase.from("programs").select("id, name"),
  ]);

  const submissionsWithUrls = await Promise.all(
    (submissions ?? []).map(async (s) => ({
      ...s,
      file_url: await resolveSignedFileUrl(supabase, "submissions", s.file_url),
    }))
  );

  const submittedIds = new Set(submissionsWithUrls.map((s) => s.student_id));
  const notSubmitted = (enrollments ?? []).filter((e) => !submittedIds.has(e.student_id));

  const programNameById = new Map((programs ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));
  const NO_PROGRAM = "No program assigned";

  function groupByProgram<T extends { profiles?: { program_id?: string | null } | null }>(items: T[]) {
    const groups = new Map<string, T[]>();
    for (const item of items) {
      const programId = item.profiles?.program_id ?? null;
      const programName = programId ? programNameById.get(programId) ?? NO_PROGRAM : NO_PROGRAM;
      const list = groups.get(programName) ?? [];
      list.push(item);
      groups.set(programName, list);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }

  const submissionsByProgram = groupByProgram(submissionsWithUrls);
  const notSubmittedByProgram = groupByProgram(notSubmitted);

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

      {ai_error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          AI grading error: {ai_error}
        </div>
      )}

      {ai_for && ai_grade !== undefined && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          AI suggested grade pre-filled below — review and click Save Grade to confirm.
        </div>
      )}

      <h2 className="mt-6 text-lg font-semibold text-slate-800">Submissions ({submissionsWithUrls.length})</h2>
      {submissionsByProgram.length === 0 && <p className="mt-3 text-sm text-slate-500">No submissions yet.</p>}
      {submissionsByProgram.map(([programName, programSubmissions]) => (
        <div key={programName} className="mt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{programName}</h3>
          <div className="mt-2 space-y-4">
            {programSubmissions.map((s) => {
              const isAiTarget = ai_for === s.id;
              const gradeDefault = isAiTarget && ai_grade !== undefined ? ai_grade : (s.grade ?? "");
              const feedbackDefault = isAiTarget && ai_feedback !== undefined ? decodeURIComponent(ai_feedback) : (s.feedback ?? "");

              return (
                <div key={s.id} className={`rounded-xl border bg-white p-5 shadow-sm ${isAiTarget ? "border-blue-300" : "border-slate-200"}`}>
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

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    {/* Grade with AI — works for text submissions and Google Docs links */}
                    {(s.content || s.file_url?.startsWith("http")) && (
                      <form action={gradeWithAI} className="mb-3">
                        <input type="hidden" name="submission_id" value={s.id} />
                        <input type="hidden" name="assignment_id" value={assignment.id} />
                        <DeleteButton
                          label="✦ Grade with AI"
                          pendingLabel="Grading…"
                          className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                        />
                        {!s.content && (
                          <span className="ml-2 text-xs text-slate-400">(text submission required)</span>
                        )}
                      </form>
                    )}

                    <form action={gradeSubmission} className="flex flex-wrap items-end gap-3">
                      <input type="hidden" name="submission_id" value={s.id} />
                      <input type="hidden" name="assignment_id" value={assignment.id} />
                      <div>
                        <label className="block text-sm font-medium text-slate-700">
                          Grade {isAiTarget && <span className="text-blue-600">(AI suggested)</span>}
                        </label>
                        <input
                          name="grade"
                          type="number"
                          step="0.1"
                          min="0"
                          defaultValue={gradeDefault}
                          max={assignment.points_possible ?? undefined}
                          required
                          className={`mt-1 w-24 rounded-lg border px-3 py-2 text-sm ${isAiTarget ? "border-blue-300 bg-blue-50" : "border-slate-300"}`}
                        />
                        {assignment.points_possible ? <span className="ml-1 text-sm text-slate-500">/ {assignment.points_possible}</span> : null}
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700">
                          Feedback {isAiTarget && <span className="text-blue-600">(AI suggested)</span>}
                        </label>
                        <input
                          name="feedback"
                          type="text"
                          defaultValue={feedbackDefault}
                          className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${isAiTarget ? "border-blue-300 bg-blue-50" : "border-slate-300"}`}
                        />
                      </div>
                      <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
                        {s.grade !== null ? "Update Grade" : "Save Grade"}
                      </button>
                      {s.graded_at && <span className="text-xs text-green-600">Graded {new Date(s.graded_at).toLocaleString()}</span>}
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {notSubmittedByProgram.length > 0 && (
        <>
          <h2 className="mt-6 text-lg font-semibold text-slate-800">Not Submitted</h2>
          {notSubmittedByProgram.map(([programName, programEnrollments]) => (
            <div key={programName} className="mt-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{programName}</h3>
              <div className="mt-2 space-y-1">
                {programEnrollments.map((e) => (
                  <p key={e.id} className="text-sm text-slate-500">{e.profiles?.full_name} — {e.profiles?.email}</p>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
