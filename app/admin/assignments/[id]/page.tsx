import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { adminGradeSubmission } from "@/lib/actions/admin";
import { gradeWithAI } from "@/lib/actions/ai-grading";
import { DeleteButton } from "@/components/DeleteButton";
import Link from "next/link";
import { notFound } from "next/navigation";

function letterGrade(pct: number | null): string {
  if (pct == null) return "—";
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}

export default async function AdminAssignmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ai_grade?: string; ai_feedback?: string; ai_for?: string; ai_error?: string }>;
}) {
  await requireRole(["admin"]);
  const { id } = await params;
  const { ai_grade, ai_feedback, ai_for, ai_error } = await searchParams;

  const admin = createAdminClient();

  const { data: assignment } = await admin
    .from("assignments")
    .select("*, courses(id, title, code)")
    .eq("id", id)
    .single();

  if (!assignment) notFound();

  const course = assignment.courses as unknown as { id: string; title: string; code: string | null } | null;

  const { data: submissions } = await admin
    .from("submissions")
    .select("id, student_id, content, file_url, grade, feedback, graded_at, submitted_at, profiles(full_name, student_number)")
    .eq("assignment_id", id)
    .order("submitted_at", { ascending: false });

  const aiSuggestedFor = ai_for ?? null;
  const aiGrade = ai_grade ? Number(ai_grade) : null;
  const aiGradePct = aiGrade !== null && assignment.points_possible
    ? Math.round((aiGrade / assignment.points_possible) * 100)
    : null;

  return (
    <div className="max-w-4xl">
      <Link href="/admin/assignments" className="text-sm text-gold-dark hover:underline">← All Assignments</Link>

      <h1 className="mt-2 text-2xl font-bold text-slate-900">{assignment.title}</h1>
      {course && (
        <p className="mt-0.5 text-sm text-slate-500">
          Course:{" "}
          <Link href={`/admin/courses/${course.id}`} className="text-gold-dark hover:underline">
            {course.title}{course.code && ` (${course.code})`}
          </Link>
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
        {assignment.points_possible != null && <span>{assignment.points_possible} pts</span>}
        {assignment.due_date && (
          <span>Due: {new Date(assignment.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
        )}
        <span>{(submissions ?? []).length} submission{(submissions ?? []).length !== 1 ? "s" : ""}</span>
      </div>

      {assignment.description && (
        <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
          {assignment.description}
        </p>
      )}

      {/* AI error banner */}
      {ai_error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          AI grading error: {decodeURIComponent(ai_error)}
        </div>
      )}

      {/* AI suggestion banner */}
      {aiSuggestedFor && aiGrade !== null && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="font-semibold text-blue-900">
            AI suggested grade: <span className="text-blue-700">{aiGrade} / {assignment.points_possible ?? "?"} pts</span>
            {aiGradePct !== null && (
              <span className="ml-2 text-sm font-normal">({aiGradePct}% · {letterGrade(aiGradePct)})</span>
            )}
          </p>
          {ai_feedback && (
            <p className="mt-1 text-sm text-blue-800">{decodeURIComponent(ai_feedback)}</p>
          )}
          <form action={adminGradeSubmission} className="mt-3 flex flex-wrap items-end gap-3">
            <input type="hidden" name="submission_id" value={aiSuggestedFor} />
            <input type="hidden" name="assignment_id" value={id} />
            <div>
              <label className="block text-xs font-semibold text-blue-700">Grade (pts)</label>
              <input
                name="grade"
                type="number"
                min={0}
                max={assignment.points_possible ?? undefined}
                defaultValue={aiGrade}
                className="mt-1 w-24 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-blue-700">Feedback (optional)</label>
              <input
                name="feedback"
                defaultValue={ai_feedback ? decodeURIComponent(ai_feedback) : ""}
                className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm"
              />
            </div>
            <DeleteButton
              label="Apply Grade"
              pendingLabel="Saving…"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            />
          </form>
        </div>
      )}

      {/* Submissions */}
      <h2 className="mt-8 text-lg font-semibold text-slate-800">Submissions</h2>
      {(submissions ?? []).length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No submissions yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {(submissions ?? []).map((sub) => {
            const student = sub.profiles as unknown as { full_name: string; student_number: string | null } | null;
            const pct = sub.grade != null && assignment.points_possible
              ? Math.round((sub.grade / assignment.points_possible) * 100)
              : null;
            const isAiTarget = sub.id === aiSuggestedFor;

            return (
              <div
                key={sub.id}
                className={`rounded-xl border bg-white shadow-sm ${isAiTarget ? "border-blue-300" : "border-slate-200"}`}
              >
                <div className="flex items-start justify-between px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{student?.full_name ?? "Unknown"}</p>
                    {student?.student_number && (
                      <p className="text-xs text-slate-400">{student.student_number}</p>
                    )}
                    {sub.submitted_at && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        Submitted {new Date(sub.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                    {sub.content && (
                      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 line-clamp-3 whitespace-pre-wrap">
                        {sub.content}
                      </p>
                    )}
                    {sub.file_url && !sub.content && (
                      <a
                        href={sub.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm text-gold-dark hover:underline"
                      >
                        View submission ↗
                      </a>
                    )}
                    {sub.feedback && (
                      <p className="mt-2 text-xs text-slate-500 italic">&ldquo;{sub.feedback}&rdquo;</p>
                    )}
                  </div>

                  <div className="ml-4 shrink-0 text-right">
                    {sub.grade != null ? (
                      <>
                        <p className="text-xl font-bold text-slate-900">{letterGrade(pct)}</p>
                        <p className="text-xs text-slate-500">{sub.grade}/{assignment.points_possible ?? "?"} pts</p>
                        <p className="text-xs text-slate-400">{pct}%</p>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-slate-400">Ungraded</span>
                    )}
                  </div>
                </div>

                {/* Manual grade form */}
                <div className="border-t border-slate-100 px-5 py-3">
                  <form action={adminGradeSubmission} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="submission_id" value={sub.id} />
                    <input type="hidden" name="assignment_id" value={id} />
                    <div>
                      <label className="block text-xs text-slate-500">Grade (pts)</label>
                      <input
                        name="grade"
                        type="number"
                        min={0}
                        max={assignment.points_possible ?? undefined}
                        defaultValue={sub.grade ?? ""}
                        placeholder="0"
                        className="mt-1 w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <label className="block text-xs text-slate-500">Feedback</label>
                      <input
                        name="feedback"
                        defaultValue={sub.feedback ?? ""}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      />
                    </div>
                    <DeleteButton
                      label="Save Grade"
                      pendingLabel="Saving…"
                      className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
                    />
                  </form>

                  {/* AI grade button */}
                  <form action={gradeWithAI} className="mt-2">
                    <input type="hidden" name="submission_id" value={sub.id} />
                    <input type="hidden" name="assignment_id" value={id} />
                    <DeleteButton
                      label="Grade with AI"
                      pendingLabel="Analyzing…"
                      className="text-xs font-medium text-slate-500 hover:text-blue-600 disabled:opacity-50"
                    />
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
