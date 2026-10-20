import { createAdminClient } from "@/lib/supabase/admin";
import { deleteStaffPost, togglePinStaffPost } from "@/lib/actions/staff-room";
import { StaffPostForm } from "@/components/StaffPostForm";
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

  const { data: fileRows } = await createAdminClient()
    .from("staff_room_attachments")
    .select("id, post_id, file_name")
    .order("created_at", { ascending: true });
  const filesByPost = new Map<string, { id: string; file_name: string }[]>();
  for (const f of fileRows ?? []) {
    filesByPost.set(f.post_id, [...(filesByPost.get(f.post_id) ?? []), { id: f.id, file_name: f.file_name }]);
  }
  const attachments = (postId: string) => {
    const files = filesByPost.get(postId) ?? [];
    if (files.length === 0) return null;
    return (
      <ul className="mt-2 flex flex-wrap gap-2">
        {files.map((f) => (
          <li key={f.id}>
            <a
              href={`/api/staff-file/${f.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-gold hover:text-gold-dark"
            >
              📎 {f.file_name}
            </a>
          </li>
        ))}
      </ul>
    );
  };

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

      <StaffPostForm mode="topic" />

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
              {attachments(t.id)}

              {replies.length > 0 && (
                <div className="mt-4 space-y-3 border-l-2 border-slate-100 pl-4">
                  {replies.map((r) => (
                    <div key={r.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-400">
                          <span className="font-semibold text-slate-700">{r.author?.full_name ?? "Former staff"}</span> · {when(r.created_at)}
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{r.body}</p>
                        {attachments(r.id)}
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

              <StaffPostForm mode="reply" parentId={t.id} />
            </article>
          );
        })}
      </div>
    </div>
  );
}
