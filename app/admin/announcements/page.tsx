import { createClient } from "@/lib/supabase/server";
import { createAnnouncement, deleteAnnouncement } from "@/lib/actions/announcements";
import { sendBulkEmail } from "@/lib/actions/admin";
import { DeleteButton } from "@/components/DeleteButton";
import type { Announcement } from "@/lib/types";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>

      {/* Post announcement */}
      <form action={createAnnouncement} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">Post Announcement</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input name="title" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Message</label>
          <textarea name="body" rows={4} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Audience</label>
            <select name="target" defaultValue="all" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="all">Everyone</option>
              <option value="students">Students only</option>
              <option value="professors">Professors only</option>
            </select>
          </div>
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
            Post
          </button>
        </div>
      </form>

      {/* Bulk email */}
      <form action={sendBulkEmail} className="mt-6 space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">Send Bulk Email</h2>
        <p className="text-xs text-slate-500">Sends an email directly to the chosen group's inboxes (in addition to posting in-portal).</p>
        <div>
          <label className="block text-sm font-medium text-slate-700">Subject</label>
          <input name="title" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Body</label>
          <textarea name="body" rows={4} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Send to</label>
            <select name="target" defaultValue="students" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="students">All students</option>
              <option value="professors">All professors</option>
              <option value="all">Everyone</option>
            </select>
          </div>
          <DeleteButton label="Send Emails" pendingLabel="Sending…" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" />
        </div>
      </form>

      {/* Announcements list */}
      <h2 className="mt-8 text-lg font-semibold text-slate-800">Posted ({(announcements ?? []).length})</h2>
      <div className="mt-3 space-y-2">
        {(announcements ?? []).length === 0 && <p className="text-sm text-slate-500">No announcements yet.</p>}
        {(announcements ?? []).map((a: Announcement & { profiles?: { full_name: string } | null }) => (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{a.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{a.body}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(a.created_at).toLocaleDateString()} · {a.target === "all" ? "Everyone" : a.target === "students" ? "Students" : "Professors"}
                  {a.profiles?.full_name ? ` · by ${a.profiles.full_name}` : ""}
                </p>
              </div>
              <form action={deleteAnnouncement}>
                <input type="hidden" name="id" value={a.id} />
                <DeleteButton label="Delete" pendingLabel="…" className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50" />
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
