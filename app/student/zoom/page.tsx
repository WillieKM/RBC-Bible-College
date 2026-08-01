import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export default async function StudentZoomPage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const { data: sessionsRaw } = await supabase
    .from("zoom_sessions")
    .select("id, title, description, zoom_url, recording_url, send_at, last_sent_at, recurrence, active")
    .order("created_at", { ascending: false });

  const sessions = (sessionsRaw ?? []) as {
    id: string;
    title: string;
    description: string | null;
    zoom_url: string;
    recording_url: string | null;
    send_at: string | null;
    last_sent_at: string | null;
    recurrence: string;
    active: boolean;
  }[];

  const upcoming = sessions.filter((s) => s.active && !s.last_sent_at);
  const past = sessions.filter((s) => s.last_sent_at || !s.active);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Zoom Sessions</h1>
      <p className="mt-1 text-sm text-slate-500">
        Live class links and recordings of past sessions.
      </p>

      {/* Upcoming / active sessions */}
      {upcoming.length > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-semibold text-slate-800">Upcoming Sessions</h2>
          <div className="mt-3 space-y-3">
            {upcoming.map((s) => (
              <div key={s.id} className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{s.title}</p>
                    {s.description && <p className="mt-0.5 text-sm text-slate-600">{s.description}</p>}
                    {s.send_at && (
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(s.send_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    )}
                  </div>
                  <a
                    href={s.zoom_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Join →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recordings */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-800">Session Recordings</h2>
        <p className="mt-0.5 text-xs text-slate-400">Hosted on YouTube — watch anytime.</p>
        <div className="mt-3 space-y-3">
          {past.filter((s) => s.recording_url).length === 0 && (
            <p className="text-sm text-slate-500">No recordings available yet. Check back after your next live session.</p>
          )}
          {past.filter((s) => s.recording_url).map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{s.title}</p>
                  {s.description && <p className="mt-0.5 text-sm text-slate-500">{s.description}</p>}
                  {s.last_sent_at && (
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(s.last_sent_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </p>
                  )}
                </div>
                <a
                  href={s.recording_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  ▶ Watch
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sessions without recordings */}
      {past.filter((s) => !s.recording_url).length > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-semibold text-slate-500">Past Sessions</h2>
          <div className="mt-2 space-y-2">
            {past.filter((s) => !s.recording_url).map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-700">{s.title}</p>
                {s.last_sent_at && (
                  <p className="text-xs text-slate-400">{new Date(s.last_sent_at).toLocaleDateString()}</p>
                )}
                <p className="mt-0.5 text-xs text-slate-400 italic">Recording not available</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
