import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { createZoomSession, updateZoomSession, toggleZoomSession, deleteZoomSession, sendZoomNow, sendZoomReminder, saveProgramZoomUrl, sendProgramZoomNow } from "@/lib/actions/zoom";
import { DeleteButton } from "@/components/DeleteButton";
import Link from "next/link";
import type { ZoomSession } from "@/lib/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All students" },
  { value: "doctorate", label: "Doctorate" },
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "diploma", label: "Diploma" },
  { value: "certificate", label: "Certificate" },
  { value: "specific", label: "Specific emails only" },
];

const RECURRENCE_LABELS: Record<string, string> = {
  none: "One-off",
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  monthly: "Every month",
};

function audienceLabel(s: ZoomSession): string {
  return AUDIENCE_OPTIONS.find((o) => o.value === s.target_audience)?.label ?? "All students";
}

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

function AudienceSelect({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <select name={name} defaultValue={defaultValue ?? "all"} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
      {AUDIENCE_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function RecurrenceFields({ defaultRecurrence, defaultDay, defaultSendAt }: {
  defaultRecurrence?: string;
  defaultDay?: number | null;
  defaultSendAt?: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex-1 min-w-48">
        <label className="block text-sm font-medium text-slate-700">Recurrence</label>
        <select name="recurrence" defaultValue={defaultRecurrence ?? "none"} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="none">One-off (specific date)</option>
          <option value="weekly">Every week</option>
          <option value="biweekly">Every 2 weeks</option>
          <option value="monthly">Every month</option>
        </select>
      </div>
      <div className="flex-1 min-w-48">
        <label className="block text-sm font-medium text-slate-700">Send date / time</label>
        <input name="send_at" type="datetime-local" defaultValue={defaultSendAt ? new Date(defaultSendAt).toISOString().slice(0, 16) : ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <p className="mt-0.5 text-xs text-slate-400">For recurring: the cron fires at 07:00 on the matching day.</p>
      </div>
      <div className="flex-1 min-w-48">
        <label className="block text-sm font-medium text-slate-700">Day of week <span className="font-normal text-slate-400">(weekly / biweekly)</span></label>
        <select name="day_of_week" defaultValue={defaultDay ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Select day…</option>
          {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
        </select>
      </div>
    </div>
  );
}

export default async function AdminZoomPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireRole(["admin"]);
  const { edit } = await searchParams;
  const admin = createAdminClient();

  const [{ data: sessionsRaw }, { data: programs }] = await Promise.all([
    admin.from("zoom_sessions").select("*").order("created_at", { ascending: false }),
    admin.from("programs").select("id, name, zoom_url").order("name", { ascending: true }),
  ]);

  const sessions = (sessionsRaw ?? []) as ZoomSession[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Zoom Sessions</h1>
      <p className="mt-1 text-sm text-slate-500">
        Add class Zoom links, choose which students receive them, and set a one-off or recurring send schedule.
      </p>

      {/* Program quick-send cards */}
      {(programs ?? []).length > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-semibold text-slate-800">Program Zoom Links</h2>
          <p className="mt-0.5 text-xs text-slate-400">Store one Zoom link per program and send instantly to all enrolled students.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(programs ?? []).map((prog: { id: string; name: string; zoom_url: string | null }) => (
              <div key={prog.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="font-semibold text-slate-800 truncate">{prog.name}</p>
                <form action={saveProgramZoomUrl} className="mt-2 flex gap-2">
                  <input type="hidden" name="id" value={prog.id} />
                  <input
                    name="zoom_url"
                    type="url"
                    defaultValue={prog.zoom_url ?? ""}
                    placeholder="https://zoom.us/j/..."
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                  />
                  <button className="shrink-0 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    Save
                  </button>
                </form>
                {prog.zoom_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <a href={prog.zoom_url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-xs text-gold-dark hover:underline">
                      {prog.zoom_url}
                    </a>
                    <form action={sendProgramZoomNow}>
                      <input type="hidden" name="program_id" value={prog.id} />
                      <input type="hidden" name="program_name" value={prog.name} />
                      <input type="hidden" name="zoom_url" value={prog.zoom_url} />
                      <DeleteButton label="Send Now" pendingLabel="Sending…" className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50" />
                    </form>
                  </div>
                )}
                {!prog.zoom_url && (
                  <p className="mt-2 text-xs text-slate-400 italic">No link saved yet</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create form */}
      <form action={createZoomSession} className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
            <label className="block text-sm font-medium text-slate-700">Send to</label>
            <AudienceSelect name="target_audience" />
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
            <textarea name="description" rows={2} placeholder="Topic or notes for students" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Also send to specific emails{" "}
            <span className="font-normal text-slate-400">(optional — comma or newline separated)</span>
          </label>
          <textarea
            name="specific_emails"
            rows={2}
            placeholder={"pastor@example.com, deacon@example.com\nextra@example.com"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">YouTube recording URL <span className="font-normal text-slate-400">(paste after session — optional)</span></label>
          <input name="recording_url" type="url" placeholder="https://youtu.be/..." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <RecurrenceFields />
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
                    <label className="block text-sm font-medium text-slate-700">Send to</label>
                    <AudienceSelect name="target_audience" defaultValue={s.target_audience} />
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-slate-700">Description</label>
                    <textarea name="description" rows={2} defaultValue={s.description ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Also send to specific emails{" "}
                    <span className="font-normal text-slate-400">(optional — comma or newline separated)</span>
                  </label>
                  <textarea
                    name="specific_emails"
                    rows={2}
                    defaultValue={(s as ZoomSession & { specific_emails?: string }).specific_emails ?? ""}
                    placeholder={"pastor@example.com, deacon@example.com"}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">YouTube recording URL <span className="font-normal text-slate-400">(optional)</span></label>
                  <input name="recording_url" type="url" defaultValue={(s as ZoomSession & { recording_url?: string }).recording_url ?? ""} placeholder="https://youtu.be/..." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <RecurrenceFields defaultRecurrence={s.recurrence} defaultDay={s.day_of_week} defaultSendAt={s.send_at} />
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
                  <p className="text-sm text-slate-500">
                    {audienceLabel(s)}
                    {(s as ZoomSession & { specific_emails?: string }).specific_emails && (
                      <span className="ml-2 text-xs text-slate-400">
                        + {(s as ZoomSession & { specific_emails?: string }).specific_emails!
                          .split(/[\n,]/).map(e => e.trim()).filter(Boolean).length} specific
                      </span>
                    )}
                  </p>
                  {s.description && <p className="mt-0.5 text-xs text-slate-400">{s.description}</p>}
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <span className={`text-xs font-medium ${s.active ? "text-blue-600" : "text-slate-400"}`}>
                      {nextSendLabel(s)}
                    </span>
                    <a href={s.zoom_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-dark hover:underline">
                      Open link →
                    </a>
                    {(s as ZoomSession & { recording_url?: string }).recording_url && (
                      <a href={(s as ZoomSession & { recording_url?: string }).recording_url!} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-red-600 hover:underline">
                        ▶ Recording
                      </a>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <Link href={`/admin/zoom/${s.id}/attendance`} className="text-sm font-medium text-blue-600 hover:text-blue-800">Register</Link>
                  <Link href={`?edit=${s.id}`} className="text-sm font-medium text-slate-600 hover:text-slate-900">Edit</Link>
                  <form action={toggleZoomSession}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="active" value={String(s.active)} />
                    <DeleteButton label={s.active ? "Pause" : "Resume"} pendingLabel="…" className="text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50" />
                  </form>
                  <form action={sendZoomNow}>
                    <input type="hidden" name="id" value={s.id} />
                    <DeleteButton label="Send Now" pendingLabel="Sending…" className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50" />
                  </form>
                  <form action={sendZoomReminder} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={s.id} />
                    <select name="starts_in" className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                      <option value="in 1 hour">in 1 hour</option>
                      <option value="in 30 minutes">in 30 min</option>
                      <option value="tomorrow">tomorrow</option>
                    </select>
                    <DeleteButton label="Remind" pendingLabel="…" className="text-sm font-medium text-amber-600 hover:text-amber-800 disabled:opacity-50" />
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
