import { reviewResearchSubmission } from "@/lib/actions/research";
import {
  RESEARCH_KINDS,
  RESEARCH_STATUSES,
  RESEARCH_STATUS_CLASS,
  type ResearchSubmission,
} from "@/lib/research";

export type ResearchRow = ResearchSubmission & {
  profiles: { full_name: string; student_number: string | null } | null;
};

export function ResearchReviewList({ rows, reviewed }: { rows: ResearchRow[]; reviewed?: boolean }) {
  return (
    <>
      {reviewed && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Review saved. The student has been notified.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">No research uploads yet.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((s) => (
            <li key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {s.profiles?.full_name ?? "Unknown student"}
                    {s.profiles?.student_number ? ` · ${s.profiles.student_number}` : ""}
                  </p>
                  <p className="mt-0.5 font-medium text-slate-900">{s.title}</p>
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

              {s.note && <p className="mt-2 text-sm text-slate-600">&ldquo;{s.note}&rdquo;</p>}

              <form action={reviewResearchSubmission} className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
                <input type="hidden" name="id" value={s.id} />
                <div>
                  <label className="block text-xs font-medium text-slate-600">Status</label>
                  <select
                    name="status"
                    defaultValue={s.status}
                    className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {Object.entries(RESEARCH_STATUSES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[14rem] flex-1">
                  <label className="block text-xs font-medium text-slate-600">Feedback for the student</label>
                  <input
                    name="reviewer_comment"
                    type="text"
                    defaultValue={s.reviewer_comment ?? ""}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark"
                >
                  Save review
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
