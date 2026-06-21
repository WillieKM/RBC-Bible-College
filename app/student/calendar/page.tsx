import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  holiday: "bg-red-100 text-red-700",
  exam: "bg-purple-100 text-purple-700",
  deadline: "bg-amber-100 text-amber-700",
  class: "bg-blue-100 text-blue-700",
  other: "bg-slate-100 text-slate-700",
};

export default async function StudentCalendarPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  const today = new Date().toISOString().split("T")[0];
  const upcoming = (events ?? []).filter((e) => e.event_date >= today);
  const past = (events ?? []).filter((e) => e.event_date < today);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-ZM", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Academic Calendar</h1>

      <div className="mt-6 space-y-3">
        {upcoming.length === 0 && past.length === 0 && (
          <p className="text-sm text-slate-400">No events have been scheduled yet.</p>
        )}
        {upcoming.map((e: CalendarEvent) => (
          <div key={e.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-50 p-2 text-center">
              <p className="text-lg font-bold text-slate-800">{new Date(e.event_date).getDate()}</p>
              <p className="text-xs font-semibold uppercase text-slate-500">{new Date(e.event_date).toLocaleString("default", { month: "short" })}</p>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLORS[e.type] ?? TYPE_COLORS.other}`}>{e.type}</span>
                <span className="font-semibold text-slate-900">{e.title}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{formatDate(e.event_date)}{e.end_date && e.end_date !== e.event_date ? ` – ${formatDate(e.end_date)}` : ""}</p>
              {e.description && <p className="mt-1 text-sm text-slate-600">{e.description}</p>}
            </div>
          </div>
        ))}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Past Events</h2>
          <div className="mt-3 space-y-2">
            {past.reverse().map((e: CalendarEvent) => (
              <div key={e.id} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLORS[e.type] ?? TYPE_COLORS.other} opacity-60`}>{e.type}</span>
                <span className="text-sm text-slate-500">{e.title}</span>
                <span className="ml-auto text-xs text-slate-400">{formatDate(e.event_date)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
