import { createAdminClient } from "@/lib/supabase/admin";
import { createStaffPost, deleteStaffPost, replyStaffPost, togglePinStaffPost } from "@/lib/actions/staff-room";
import { DeleteButton } from "@/components/DeleteButton";
import type { Profile } from "@/lib/types";

type Post = {
  id: string;
  author_id: string | null;
  parent_id: string | null;
  title: string | null;
  body: string;
  pinned: boolean;
  created_at: string;
  author: { full_name: string; role: string } | null;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold";

function when(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Private discussion board for lecturers and admins (Professor/Admin → Staff Room).
export async function StaffRoomBoard({ viewer, error }: { viewer: Profile; error?: string }) {
  const { data } = await createAdminClient()
    .from("staff_room_posts")
    .select("*, author:author_id(full_name, role)")
    .order("created_at", { ascending: true });
  const all = (data ?? []) as unknown as Post[];

  const repliesByPost = new Map<string, Post[]>();
  for (const p of all) {
    if (!p.parent_id) continue;
    repliesByPost.set(p.parent_id, [...(repliesByPost.get(p.parent_id) ?? []), p]);
  }
  // Pinned first, then newest activity first.
  const lastActivity = (p: Post) => {
    const replies = repliesByPost.get(p.id) ?? [];
    return replies.length ? replies[replies.length - 1].created_at : p.created_at;
  };
  const topics = all
    .filter((p) => !p.parent_id)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || lastActivity(b).localeCompare(lastActivity(a)));

  const isAdmin = viewer.role === "admin";
  const canDelete = (p: Post) => isAdmin || p.author_id === viewer.id;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Staff Room</h1>
      <p className="mt-1 text-sm text-slate-500">
        A private space for lecturers and administrators. Students can&apos;t see anything here.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form action={createStaffPost} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-slate-800">Start a topic</h2>
        <input name="title" required placeholder="Topic, e.g. Exam timetable for next term" className={inputClass} />
        <textarea name="body" rows={3} required placeholder="Write your message…" className={inputClass} />
        <div className="flex justify-end">
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">Post</button>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {topics.length === 0 && <p className="text-sm text-slate-400">No topics yet. Start the first one above.</p>}
        {topics.map((t) => {
          const replies = repliesByPost.get(t.id) ?? [];
          return (
            <article
              key={t.id}
              id={`post-${t.id}`}
              className={`scroll-mt-20 rounded-xl border bg-white p-5 shadow-sm ${t.pinned ? "border-gold/50" : "border-slate-200"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {t.pinned && (
                    <span className="mb-1 inline-block rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold-dark">📌 Pinned</span>
                  )}
                  <h3 className="font-semibold text-slate-900">{t.title}</h3>
                  <p className="text-xs text-slate-400">
                    {t.author?.full_name ?? "Former staff"}
                    {t.author?.role === "admin" ? " · Admin" : ""} · {when(t.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {isAdmin && (
                    <form action={togglePinStaffPost}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="pinned" value={String(t.pinned)} />
                      <button className="text-xs font-medium text-slate-500 hover:text-gold-dark">{t.pinned ? "Unpin" : "Pin"}</button>
                    </form>
                  )}
                  {canDelete(t) && (
                    <form action={deleteStaffPost}>
                      <input type="hidden" name="id" value={t.id} />
                      <DeleteButton label="Delete" pendingLabel="…" className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50" />
                    </form>
                  )}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{t.body}</p>

              {replies.length > 0 && (
                <div className="mt-4 space-y-3 border-l-2 border-slate-100 pl-4">
                  {replies.map((r) => (
                    <div key={r.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-400">
                          <span className="font-semibold text-slate-700">{r.author?.full_name ?? "Former staff"}</span> · {when(r.created_at)}
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{r.body}</p>
                      </div>
                      {canDelete(r) && (
                        <form action={deleteStaffPost}>
                          <input type="hidden" name="id" value={r.id} />
                          <DeleteButton label="Delete" pendingLabel="…" className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50" />
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <form action={replyStaffPost} className="mt-4 flex gap-2">
                <input type="hidden" name="parent_id" value={t.id} />
                <input name="body" required placeholder="Write a reply…" className={inputClass} />
                <button className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Reply
                </button>
              </form>
            </article>
          );
        })}
      </div>
    </div>
  );
}
