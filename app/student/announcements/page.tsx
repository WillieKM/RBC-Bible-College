import { createClient } from "@/lib/supabase/server";
import type { Announcement } from "@/lib/types";

export default async function StudentAnnouncementsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("*, profiles(full_name)")
    .in("target", ["all", "students"])
    .order("created_at", { ascending: false });

  const announcements = (data ?? []) as (Announcement & { profiles?: { full_name: string } | null })[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Notices</h1>
      <p className="mt-1 text-sm text-slate-500">Announcements from the college administration.</p>

      {announcements.length === 0 ? (
        <p className="mt-8 text-sm text-slate-400">No announcements yet. Check back soon.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-slate-900">{a.title}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{a.body}</p>
              <p className="mt-3 text-xs text-slate-400">
                {new Date(a.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {a.profiles?.full_name ? ` · ${a.profiles.full_name}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
