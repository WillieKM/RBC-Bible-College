import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProgramLevel } from "@/lib/research-server";
import {
  RESEARCH_KINDS,
  RESEARCH_STATUSES,
  RESEARCH_STATUS_CLASS,
  isResearchLevel,
  type ResearchSubmission,
} from "@/lib/research";
import { ResearchUploadForm } from "@/components/ResearchUploadForm";

export default async function StudentResearchPage() {
  const profile = await requireRole(["student"]);
  const level = await getProgramLevel(profile.program_id);

  if (!isResearchLevel(level)) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dissertation &amp; Research</h1>
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Dissertation and research submissions are for Master&apos;s and Doctorate scholars.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            If you are a Master&apos;s or Doctorate scholar, your account isn&apos;t linked to your program yet.
            Please contact the admin office.
          </p>
        </div>
      </div>
    );
  }

  const { data } = await createAdminClient()
    .from("research_submissions")
    .select("*")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false });
  const submissions = (data ?? []) as ResearchSubmission[];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Dissertation &amp; Research</h1>
      <p className="mt-1 text-sm text-slate-500">
        Submit your proposal, chapters, drafts, and final dissertation here. Your professor will review each submission.
      </p>

      <ResearchUploadForm />

      <h2 className="mt-8 font-semibold text-slate-800">Your submissions</h2>
      {submissions.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Nothing submitted yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {submissions.map((s) => (
            <li key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{s.title}</p>
                  <p className="text-xs text-slate-500">
                    {RESEARCH_KINDS[s.kind]} · {new Date(s.created_at).toLocaleDateString()} ·{" "}
                    <a href={`/api/research-file/${s.id}`} className="text-gold-dark underline">
                      {s.file_name}
                    </a>
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${RESEARCH_STATUS_CLASS[s.status]}`}>
                  {RESEARCH_STATUSES[s.status]}
                </span>
              </div>
              {s.note && <p className="mt-2 text-sm text-slate-600">{s.note}</p>}
              {s.reviewer_comment && (
                <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="font-semibold">Professor&apos;s feedback:</span> {s.reviewer_comment}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
