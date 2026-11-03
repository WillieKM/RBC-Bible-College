import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { askQuestion } from "@/lib/actions/qa";
import { qaBase, taggableCourses, type QaPortal } from "@/lib/qa";
import type { Profile } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold";

type Row = {
  id: string;
  title: string;
  body: string;
  course_id: string | null;
  best_answer_id: string | null;
  created_at: string;
  author: { full_name: string; role: string; secondary_role: string | null } | null;
  course: { title: string; code: string | null } | null;
};

function ago(d: string) {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Community Q&A question list (Student/Professor → Q&A).
export async function QaList({
  viewer,
  portal,
  courseFilter,
  error,
}: {
  viewer: Profile;
  portal: QaPortal;
  courseFilter?: string;
  error?: string;
}) {
  const base = qaBase(portal);
  const admin = createAdminClient();
  let query = admin
    .from("qa_questions")
    .select("id, title, body, course_id, best_answer_id, created_at, author:author_id(full_name, role, secondary_role), course:course_id(title, code)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (courseFilter === "general") query = query.is("course_id", null);
  else if (courseFilter) query = query.eq("course_id", courseFilter);

  const [{ data }, courses] = await Promise.all([query, taggableCourses(viewer, portal)]);
  const questions = (data ?? []) as unknown as Row[];

  const ids = questions.map((q) => q.id);
  const { data: answerRows } = ids.length
    ? await admin.from("qa_answers").select("question_id").in("question_id", ids)
    : { data: [] as { question_id: string }[] };
  const answerCount = new Map<string, number>();
  for (const a of answerRows ?? []) answerCount.set(a.question_id, (answerCount.get(a.question_id) ?? 0) + 1);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Q&amp;A</h1>
      <p className="mt-1 text-sm text-slate-500">
        Ask a question and answer others. Scholars and lecturers can all take part.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form action={askQuestion} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-slate-800">Ask a question</h2>
        <input type="hidden" name="portal" value={portal} />
        <input name="title" required maxLength={200} placeholder="Your question in one line" className={inputClass} />
        <textarea name="body" rows={3} required placeholder="Add any details that help others answer…" className={inputClass} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <select name="course_id" defaultValue="" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">General (no course)</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}{c.code ? ` (${c.code})` : ""}</option>
            ))}
          </select>
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">Post question</button>
        </div>
      </form>

      {/* Course filter */}
      <form method="GET" className="mt-6 flex items-center gap-2">
        <label htmlFor="course" className="text-sm text-slate-600">Show:</label>
        <select id="course" name="course" defaultValue={courseFilter ?? ""} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
          <option value="">All questions</option>
          <option value="general">General only</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Filter</button>
      </form>

      <ul className="mt-4 space-y-2">
        {questions.length === 0 && <li className="text-sm text-slate-400">No questions yet — be the first to ask.</li>}
        {questions.map((q) => {
          const count = answerCount.get(q.id) ?? 0;
          const lecturer = q.author?.role === "professor" || q.author?.secondary_role === "professor";
          return (
            <li key={q.id}>
              <Link
                href={`${base}/${q.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-gold"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-slate-900">{q.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      q.best_answer_id
                        ? "bg-green-100 text-green-700"
                        : count > 0
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {q.best_answer_id ? "✓ Answered" : count > 0 ? `${count} answer${count === 1 ? "" : "s"}` : "Unanswered"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{q.body}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {q.author?.full_name ?? "Former member"}
                  {lecturer ? " · Lecturer" : ""} · {ago(q.created_at)}
                  {q.course ? ` · ${q.course.title}` : " · General"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
