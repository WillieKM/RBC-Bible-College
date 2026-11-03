import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { answerQuestion, deleteAnswer, deleteQuestion, markBestAnswer } from "@/lib/actions/qa";
import { isQaModerator, qaBase, type QaPortal } from "@/lib/qa";
import { DeleteButton } from "@/components/DeleteButton";
import type { Profile } from "@/lib/types";

type Author = { full_name: string; role: string; secondary_role: string | null } | null;

function when(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function AuthorLine({ author, at }: { author: Author; at: string }) {
  const lecturer = author?.role === "professor" || author?.secondary_role === "professor";
  return (
    <p className="text-xs text-slate-400">
      <span className="font-semibold text-slate-700">{author?.full_name ?? "Former member"}</span>
      {lecturer && (
        <span className="ml-1.5 rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-gold-dark">Lecturer</span>
      )}{" "}
      · {when(at)}
    </p>
  );
}

// One Q&A question with its answers (Student/Professor → Q&A → question).
export async function QaThread({
  viewer,
  portal,
  questionId,
  error,
}: {
  viewer: Profile;
  portal: QaPortal;
  questionId: string;
  error?: string;
}) {
  const base = qaBase(portal);
  const admin = createAdminClient();
  const { data: q } = await admin
    .from("qa_questions")
    .select("id, title, body, author_id, best_answer_id, created_at, author:author_id(full_name, role, secondary_role), course:course_id(title)")
    .eq("id", questionId)
    .maybeSingle();
  if (!q) notFound();
  const bestId: string | null = q.best_answer_id;

  const { data: answerRows } = await admin
    .from("qa_answers")
    .select("id, body, author_id, created_at, author:author_id(full_name, role, secondary_role)")
    .eq("question_id", questionId)
    .order("created_at", { ascending: true });
  const answers = (answerRows ?? []) as unknown as {
    id: string;
    body: string;
    author_id: string | null;
    created_at: string;
    author: Author;
  }[];
  // Best answer first, then the rest in order.
  answers.sort((a, b) => Number(b.id === bestId) - Number(a.id === bestId));

  const moderator = isQaModerator(viewer);
  const canDelete = (authorId: string | null) => moderator || authorId === viewer.id;
  const course = q.course as unknown as { title: string } | null;

  return (
    <div className="max-w-3xl">
      <Link href={base} className="text-sm text-gold-dark hover:underline">← All questions</Link>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <article className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            {course && <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{course.title}</p>}
            <h1 className="mt-0.5 text-xl font-bold text-slate-900">{q.title}</h1>
            <AuthorLine author={q.author as unknown as Author} at={q.created_at} />
          </div>
          {canDelete(q.author_id) && (
            <form action={deleteQuestion}>
              <input type="hidden" name="portal" value={portal} />
              <input type="hidden" name="id" value={q.id} />
              <DeleteButton label="Delete question" pendingLabel="…" className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50" />
            </form>
          )}
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{q.body}</p>
      </article>

      <h2 id="answers" className="mt-8 scroll-mt-20 font-semibold text-slate-800">
        {answers.length} answer{answers.length === 1 ? "" : "s"}
      </h2>
      <div className="mt-3 space-y-3">
        {answers.map((a) => {
          const best = a.id === bestId;
          return (
            <div
              key={a.id}
              className={`rounded-xl border p-4 shadow-sm ${best ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"}`}
            >
              {best && <p className="mb-1 text-xs font-bold text-green-700">✓ Best answer</p>}
              <div className="flex items-start justify-between gap-3">
                <AuthorLine author={a.author} at={a.created_at} />
                <div className="flex shrink-0 items-center gap-3">
                  {moderator && (
                    <form action={markBestAnswer}>
                      <input type="hidden" name="portal" value={portal} />
                      <input type="hidden" name="question_id" value={q.id} />
                      <input type="hidden" name="answer_id" value={a.id} />
                      <button className="text-xs font-medium text-green-700 hover:underline">
                        {best ? "Unmark best" : "Mark as best"}
                      </button>
                    </form>
                  )}
                  {canDelete(a.author_id) && (
                    <form action={deleteAnswer}>
                      <input type="hidden" name="portal" value={portal} />
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="question_id" value={q.id} />
                      <DeleteButton label="Delete" pendingLabel="…" className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50" />
                    </form>
                  )}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{a.body}</p>
            </div>
          );
        })}
        {answers.length === 0 && <p className="text-sm text-slate-400">No answers yet. Can you help?</p>}
      </div>

      <form action={answerQuestion} className="mt-6 space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input type="hidden" name="portal" value={portal} />
        <input type="hidden" name="question_id" value={q.id} />
        <label htmlFor="answer" className="block text-sm font-semibold text-slate-800">Your answer</label>
        <textarea
          id="answer"
          name="body"
          rows={4}
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <div className="flex justify-end">
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">Post answer</button>
        </div>
      </form>
    </div>
  );
}
