import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { submitAssignment } from "@/lib/actions/student";
import { resolveSignedFileUrl } from "@/lib/storage";
import { SubmitAssignmentButton } from "@/components/SubmitAssignmentButton";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StudentAssignmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string; submit_error?: string }>;
}) {
  const profile = await requireRole(["student"]);
  const { id } = await params;
  const { submitted, submit_error } = await searchParams;
  // Live RLS doesn't reliably let students read their enrollments/courses/assignments
  // (same as professors, see 6745ca7). Every query below is scoped to this student
  // or gated by their enrollment, so read with the service role.
  const supabase = createAdminClient();

  // Approver is looked up separately: embedding via the FK name
  // (assignments_approved_by_fkey) fails the whole query, and 404s the page,
  // if the approved_by column was added without that exact constraint.
  const { data: assignment } = await supabase.from("assignments").select("*, courses(*)").eq("id", id).maybeSingle();
  if (!assignment) notFound();
  const { data: approver } = assignment.approved_by
    ? await supabase.from("profiles").select("full_name").eq("id", assignment.approved_by).maybeSingle()
    : { data: null };

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

  const fileUrl = await resolveSignedFileUrl(supabase, "submissions", submission?.file_url ?? null);

  return (
    <div>
      <Link href={`/student/courses/${assignment.course_id}`} className="text-sm text-gold-dark hover:underline">
        ← Back to {assignment.courses?.title}
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
        {assignment.approved_by && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 border border-green-200">
            ✓ Approved by {approver?.full_name ?? "Professor"}
          </span>
        )}
      </div>
      {assignment.description && <p className="mt-1 text-slate-600">{assignment.description}</p>}
      <p className="mt-1 text-sm text-slate-500">
        {assignment.due_date
          ? new Date(assignment.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
          : "No due date"}
        {assignment.points_possible ? ` · ${assignment.points_possible} pts` : ""}
      </p>

      {submit_error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submit_error}</div>
      )}
      {submitted && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 font-medium">
          ✓ Your work was received. Your professor will review it and give you a grade — you&apos;ll get an email when it&apos;s ready.
        </div>
      )}

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
          <label className="block text-sm font-medium text-slate-700">
            Share link <span className="font-normal text-slate-400">(Google Drive, OneDrive, Dropbox, etc. — optional)</span>
          </label>
          <input
            name="share_link"
            type="url"
            placeholder="https://docs.google.com/..."
            defaultValue={submission?.file_url?.startsWith("http") ? submission.file_url : ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-0.5 text-xs text-slate-400">Set sharing to &ldquo;Anyone with the link&rdquo; so your professor can open it.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Or attach a file <span className="font-normal text-slate-400">(optional — link above takes priority if both are filled)</span>
          </label>
          <input name="file" type="file" className="mt-1 block text-sm" />
          {fileUrl && !submission?.file_url?.startsWith("http") && (
            <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-gold-dark hover:underline">
              View current file →
            </a>
          )}
        </div>
        <SubmitAssignmentButton isResubmit={!!submission} />
        {submission && (
          <p className="text-xs text-slate-400">
            Last submitted {new Date(submission.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        {!submission && (
          <p className="text-xs text-slate-400">
            After you submit, your professor will review your work and give you a grade. You&apos;ll receive an email when it&apos;s ready.
          </p>
        )}
      </form>
    </div>
  );
}
