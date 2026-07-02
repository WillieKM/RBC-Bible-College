import { createAdminClient } from "@/lib/supabase/admin";
import { createZoomSession, updateZoomSession, toggleZoomSession, deleteZoomSession } from "@/lib/actions/zoom";
import { DeleteButton } from "@/components/DeleteButton";
import Link from "next/link";
import type { Program, ZoomSession } from "@/lib/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const RECURRENCE_LABELS: Record<string, string> = {
  none: "One-off",
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  monthly: "Every month",
};

function nextSendLabel(s: ZoomSession): string {
  if (!s.active) return "Paused";
  if (s.recurrence === "none") {
    if (s.last_sent_at) return `Sent ${new Date(s.last_sent_at).toLocaleString()}`;
    if (s.send_at) return `Scheduled ${new Date(s.send_at).toLocaleString()}`;
    return "Not scheduled";
  }
  const recLabel = RECURRENCE_LABELS[s.recurrence];
  const dayLabel = s.day_of_week != null ? ` · ${DAYS[s.day_of_week]}s` : "";
  const lastLabel = s.last_sent_at ? ` · Last sent ${new Date(s.last_sent_at).toLocaleDateString()}` : "";
  return `${recLabel}${dayLabel}${lastLabel}`;
}

export default async function AdminZoomPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const admin = createAdminClient();

  const [{ data: sessionsRaw }, { data: programs }] = await Promise.all([
    admin.from("zoom_sessions").select("*").order("created_at", { ascending: false }),
    admin.from("programs").select("id, name").order("name"),
  ]);

  const sessions = (sessionsRaw ?? []) as ZoomSession[];
  const programMap = new Map((programs ?? []).map((p: Pick<Program, "id" | "name">) => [p.id, p.name]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Zoom Sessions</h1>
      <p className="mt-1 text-sm text-slate-500">
        Add class Zoom links per program. Set a one-off date or a recurring schedule — the link emails automatically.
      </p>

      {/* Create form */}
      <form action={createZoomSession} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">Add Zoom Session</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700">Title *</label>
            <input name="title" required placeholder="e.g. Tuesday Evening Class" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700">Zoom link *</label>
            <input name="zoom_url" type="url" required placeholder="https://zoom.us/j/..." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700">Program</label>
            <select name="program_id" defaultValue="" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">All students</option>
              {(programs ?? []).map((p: Pick<Program, "id" | "name">) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700">Recurrence</label>
            <select name="recurrence" defaultValue="none" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="none">One-off (specific date)</option>
              <option value="weekly">Weekly (same day every week)</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly (same day each month)</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700">Send date / time</label>
            <input name="send_at" type="datetime-local" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <p className="mt-0.5 text-xs text-slate-400">For recurring: only the time of day matters — the cron fires at 07:00 on the matching day.</p>
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700">Day of week <span className="font-normal text-slate-400">(for weekly / biweekly)</span></label>
            <select name="day_of_week" defaultValue="" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select day…</option>
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
          <textarea name="description" rows={2} placeholder="Topic, reading material, or any notes for students" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <DeleteButton label="Save Session" pendingLabel="Saving…" className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50" />
      </form>

      {/* Session list */}
      <h2 className="mt-8 text-lg font-semibold text-slate-800">Sessions ({sessions.length})</h2>
      <div className="mt-3 space-y-2">
        {sessions.length === 0 && <p className="text-sm text-slate-500">No Zoom sessions yet.</p>}
        {sessions.map((s) => (
          <div key={s.id} className={`rounded-xl border bg-white shadow-sm ${s.active ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
            {edit === s.id ? (
              /* ── Inline edit form ── */
              <form action={updateZoomSession} className="space-y-3 px-5 py-4">
                <input type="hidden" name="id" value={s.id} />
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-slate-700">Title *</label>
                    <input name="title" required defaultValue={s.title} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-slate-700">Zoom link *</label>
                    <input name="zoom_url" type="url" required defaultValue={s.zoom_url} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-slate-700">Program</label>
                    <select name="program_id" defaultValue={s.program_id ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                      <option value="">All students</option>
                      {(programs ?? []).map((p: Pick<Program, "id" | "name">) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-slate-700">Recurrence</label>
                    <select name="recurrence" defaultValue={s.recurrence} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                      <option value="none">One-off</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 weeks</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-slate-700">Send date / time</label>
                    <input name="send_at" type="datetime-local" defaultValue={s.send_at ? new Date(s.send_at).toISOString().slice(0, 16) : ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-slate-700">Day of week</label>
                    <select name="day_of_week" defaultValue={s.day_of_week ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                      <option value="">Select day…</option>
                      {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Description</label>
                  <textarea name="description" rows={2} defaultValue={s.description ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div className="flex items-center gap-3">
                  <DeleteButton label="Save" pendingLabel="Saving…" className="rounded-lg bg-gold px-4 py-1.5 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50" />
                  <Link href="/admin/zoom" className="text-sm text-slate-500 hover:text-slate-700">Cancel</Link>
                </div>
              </form>
            ) : (
              /* ── Read-only row ── */
              <div className="flex items-start justify-between px-5 py-4">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{s.title}</p>
                  <p className="text-sm text-slate-500">{s.program_id ? programMap.get(s.program_id) ?? "Unknown program" : "All students"}</p>
                  {s.description && <p className="mt-0.5 text-xs text-slate-400">{s.description}</p>}
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <span className={`text-xs font-medium ${s.active ? "text-blue-600" : "text-slate-400"}`}>
                      {nextSendLabel(s)}
                    </span>
                    <a href={s.zoom_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-dark hover:underline">
                      Open link →
                    </a>
                  </div>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <Link href={`?edit=${s.id}`} className="text-sm font-medium text-slate-600 hover:text-slate-900">Edit</Link>
                  <form action={toggleZoomSession}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="active" value={String(s.active)} />
                    <DeleteButton label={s.active ? "Pause" : "Resume"} pendingLabel="…" className="text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50" />
                  </form>
                  <form action={deleteZoomSession}>
                    <input type="hidden" name="id" value={s.id} />
                    <DeleteButton label="Delete" pendingLabel="…" className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50" />
                  </form>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
