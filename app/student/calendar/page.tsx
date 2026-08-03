import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { CalendarGrid } from "@/components/CalendarGrid";
import type { CalendarEvent } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  holiday:    "bg-red-100 text-red-700",
  exam:       "bg-purple-100 text-purple-700",
  assignment: "bg-amber-100 text-amber-700",
  class:      "bg-blue-100 text-blue-700",
  other:      "bg-slate-100 text-slate-700",
};

export default async function StudentCalendarPage() {
  await requireRole(["student"]);
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  const all = (events ?? []) as CalendarEvent[];
  const today = new Date().toISOString().split("T")[0];
  const upcoming = all.filter((e) => e.event_date >= today);

  function formatDate(d: string) {
    return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Academic Calendar</h1>
      <p className="mt-1 text-sm text-slate-500">
        Click any day to see events. Use the arrows to navigate months.
      </p>

      {all.length === 0 ? (
        <p className="mt-8 text-sm text-slate-400">No events have been scheduled yet.</p>
      ) : (
        <>
          <div className="mt-6">
            <CalendarGrid events={all} />
          </div>

          {upcoming.length > 0 && (
            <div className="mt-10">
              <h2 className="text-base font-semibold text-slate-800">Upcoming Events</h2>
              <div className="mt-3 space-y-3">
                {upcoming.map((e: CalendarEvent) => (
                  <div key={e.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-50 p-2 text-center">
                      <p className="text-lg font-bold text-slate-800">
                        {new Date(e.event_date + "T12:00:00").getDate()}
                      </p>
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        {new Date(e.event_date + "T12:00:00").toLocaleString("default", { month: "short" })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLORS[e.type] ?? TYPE_COLORS.other}`}>
                          {e.type}
                        </span>
                        <span className="font-semibold text-slate-900">{e.title}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(e.event_date)}
                        {e.end_date && e.end_date !== e.event_date
                          ? ` – ${formatDate(e.end_date)}`
                          : ""}
                      </p>
                      {e.description && (
                        <p className="mt-1 text-sm text-slate-600">{e.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
