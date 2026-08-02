import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { deletePrayerRequest } from "@/lib/actions/prayers";
import { DeleteButton } from "@/components/DeleteButton";
import type { PrayerRequest } from "@/lib/types";

export default async function AdminPrayersPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const [{ data: requests }, { data: counts }] = await Promise.all([
    supabase
      .from("prayer_requests")
      .select("*, profiles(full_name, role)")
      .order("created_at", { ascending: false }),
    supabase
      .from("prayer_interactions")
      .select("request_id"),
  ]);

  const prayerCounts = new Map<string, number>();
  for (const i of counts ?? []) {
    prayerCounts.set(i.request_id, (prayerCounts.get(i.request_id) ?? 0) + 1);
  }

  const items = (requests ?? []) as (PrayerRequest & { profiles?: { full_name: string; role: string } | null })[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Prayer Board</h1>
      <p className="mt-1 text-sm text-slate-500">
        All prayer requests from students and professors. Admins can remove any request.
      </p>

      {items.length === 0 && (
        <p className="mt-8 text-sm text-slate-400">No prayer requests yet.</p>
      )}

      <div className="mt-6 space-y-3">
        {items.map((req) => {
          const authorName = req.is_anonymous
            ? "Anonymous"
            : (req.profiles?.full_name ?? "Unknown");
          const role = req.profiles?.role ?? "";
          const count = prayerCounts.get(req.id) ?? 0;

          return (
            <div key={req.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm leading-relaxed text-slate-800">{req.body}</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-500">
                    {authorName}
                    {role && !req.is_anonymous && (
                      <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                        {role}
                      </span>
                    )}
                    {" · "}
                    {new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {count > 0 && (
                    <span className="text-xs font-semibold text-amber-700">
                      🙏 {count} praying
                    </span>
                  )}
                </div>
                <form action={deletePrayerRequest}>
                  <input type="hidden" name="id" value={req.id} />
                  <DeleteButton
                    label="Remove"
                    pendingLabel="Removing…"
                    className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                  />
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
