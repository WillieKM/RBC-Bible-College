import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { postPrayerRequest, deletePrayerRequest, togglePraying } from "@/lib/actions/prayers";
import { DeleteButton } from "@/components/DeleteButton";
import type { PrayerRequest, PrayerInteraction } from "@/lib/types";

export default async function StudentPrayersPage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const [{ data: requests }, { data: interactions }] = await Promise.all([
    supabase
      .from("prayer_requests")
      .select("*, profiles(full_name, role)")
      .order("created_at", { ascending: false }),
    supabase.from("prayer_interactions").select("*").eq("user_id", profile.id),
  ]);

  const prayingSet = new Set(
    ((interactions ?? []) as PrayerInteraction[]).map((i) => i.request_id)
  );

  const prayerCounts = new Map<string, number>();
  const { data: allInteractions } = await supabase.from("prayer_interactions").select("request_id");
  for (const i of allInteractions ?? []) {
    prayerCounts.set(i.request_id, (prayerCounts.get(i.request_id) ?? 0) + 1);
  }

  const items = (requests ?? []) as (PrayerRequest & { profiles?: { full_name: string; role: string } | null })[];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Prayer Board</h1>
      <p className="mt-1 text-sm text-slate-500">
        Share prayer requests with your college community. You may post anonymously.
      </p>

      {/* Post form */}
      <form action={postPrayerRequest} className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">Share a prayer request</label>
        <textarea
          name="body"
          required
          rows={3}
          placeholder="Lord, I ask for prayer regarding…"
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="is_anonymous" className="rounded accent-gold" />
            Post anonymously
          </label>
          <DeleteButton
            label="Post Request"
            pendingLabel="Posting…"
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
          />
        </div>
      </form>

      {/* Requests */}
      <div className="mt-6 space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-slate-400">No prayer requests yet. Be the first to share.</p>
        )}
        {items.map((req) => {
          const isPraying = prayingSet.has(req.id);
          const count = prayerCounts.get(req.id) ?? 0;
          const authorName = req.is_anonymous ? "Anonymous" : (req.profiles?.full_name ?? "A student");
          const isOwn = req.author_id === profile.id;

          return (
            <div key={req.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm leading-relaxed text-slate-800">{req.body}</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-400">
                    {authorName} · {new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                  {count > 0 && (
                    <span className="text-xs font-semibold text-amber-700">
                      🙏 {count} praying
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <form action={togglePraying}>
                    <input type="hidden" name="request_id" value={req.id} />
                    <input type="hidden" name="is_praying" value={String(isPraying)} />
                    <DeleteButton
                      label={isPraying ? "🙏 Praying" : "Pray for this"}
                      pendingLabel="…"
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${isPraying ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    />
                  </form>
                  {isOwn && (
                    <form action={deletePrayerRequest}>
                      <input type="hidden" name="id" value={req.id} />
                      <DeleteButton
                        label="Delete"
                        pendingLabel="…"
                        className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50"
                      />
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
