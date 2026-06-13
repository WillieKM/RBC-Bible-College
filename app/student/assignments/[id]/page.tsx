import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { submitAssignment } from "@/lib/actions/student";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StudentAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(["student"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: assignment } = await supabase.from("assignments").select("*, courses(*)").eq("id", id).single();
  if (!assignment) notFound();

  // Confirm enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", assignment.course_id)
    .eq("student_id", profile.id)
    .single();
  if (!enrollment) notFound();

  const { data: submission } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignment_id", id)
    .eq("student_id", profile.id)
    .single();

  return (
    <div>
      <Link href={`/student/courses/${assignment.course_id}`} className="text-sm text-gold-dark hover:underline">
        ← Back to {assignment.courses?.title}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{assignment.title}</h1>
      {assignment.description && <p className="mt-1 text-slate-600">{assignment.description}</p>}
      <p className="mt-1 text-sm text-slate-500">
        {assignment.due_date ? `Due ${assignment.due_date}` : "No due date"}
        {assignment.points_possible ? ` · ${assignment.points_possible} pts` : ""}
      </p>

      {submission?.grade !== null && submission?.grade !== undefined && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm font-semibold text-green-800">
            Grade: {submission.grade}{assignment.points_possible ? ` / ${assignment.points_possible}` : ""}
          </p>
          {submission.feedback && <p className="mt-2 text-sm text-green-700 whitespace-pre-wrap">{submission.feedback}</p>}
        </div>
      )}

      <h2 className="mt-6 text-lg font-semibold text-slate-800">
        {submission ? "Your Submission" : "Submit Your Work"}
      </h2>
      <form action={submitAssignment} encType="multipart/form-data" className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="assignment_id" value={assignment.id} />
        <div>
          <label className="block text-sm font-medium text-slate-700">Response</label>
          <textarea
            name="content"
            rows={6}
            defaultValue={submission?.content ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Attach a file (optional)</label>
          <input name="file" type="file" className="mt-1 block text-sm" />
          {submission?.file_url && (
            <a href={submission.file_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-gold-dark hover:underline">
              View current file →
            </a>
          )}
        </div>
        <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
          {submission ? "Resubmit" : "Submit"}
        </button>
        {submission && (
          <p className="text-xs text-slate-400">Last submitted {new Date(submission.submitted_at).toLocaleString()}</p>
        )}
      </form>
    </div>
  );
}
