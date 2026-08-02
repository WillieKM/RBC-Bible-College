import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import type { ZoomSession } from "@/lib/types";

const AUDIENCE_LABELS: Record<string, string> = {
  all: "All students", doctorate: "Doctorate", bachelors: "Bachelor's",
  masters: "Master's", diploma: "Diploma", certificate: "Certificate",
};

export default async function ProfessorZoomAttendancePage() {
  await requireRole(["professor"]);
  const admin = createAdminClient();

  const { data: sessionsRaw } = await admin
    .from("zoom_sessions")
    .select("id, title, target_audience, last_sent_at, recurrence, active")
    .eq("active", true)
    .order("last_sent_at", { ascending: false, nullsFirst: false });

  const sessions = (sessionsRaw ?? []) as Pick<ZoomSession, "id" | "title" | "target_audience" | "last_sent_at" | "recurrence" | "active">[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Zoom Attendance</h1>
      <p className="mt-1 text-sm text-slate-500">
        Select a session to take the register after your Zoom class.
      </p>

      <div className="mt-6 space-y-2">
        {sessions.length === 0 && (
          <p className="text-sm text-slate-400">No active Zoom sessions. Ask the admin to set one up.</p>
        )}
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/professor/zoom-attendance/${s.id}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:border-gold"
          >
            <div>
              <p className="font-semibold text-slate-900">{s.title}</p>
              <p className="text-sm text-slate-500">{AUDIENCE_LABELS[s.target_audience] ?? s.target_audience}</p>
              {s.last_sent_at && (
                <p className="text-xs text-slate-400">Last session: {new Date(s.last_sent_at).toLocaleDateString()}</p>
              )}
            </div>
            <span className="text-sm font-medium text-gold-dark">Take register →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
