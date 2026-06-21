import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  holiday: "bg-red-100 text-red-700",
  exam: "bg-purple-100 text-purple-700",
  deadline: "bg-amber-100 text-amber-700",
  class: "bg-blue-100 text-blue-700",
  other: "bg-slate-100 text-slate-700",
};

export async function CalendarWidget() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", new Date().toISOString().split("T")[0])
    .order("event_date", { ascending: true })
    .limit(8);

  if (!events || events.length === 0) return null;

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-ZM", { month: "short", day: "numeric" });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-800">Upcoming Events</h2>
      <div className="mt-3 space-y-2">
        {events.map((e: CalendarEvent) => (
          <div key={e.id} className="flex items-start gap-3">
            <div className="w-12 shrink-0 text-center">
              <p className="text-xs font-bold text-slate-500">{formatDate(e.event_date)}</p>
            </div>
            <div className="flex-1 border-l border-slate-100 pl-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[e.type] ?? TYPE_COLORS.other}`}>{e.type}</span>
                <span className="text-sm font-medium text-slate-800">{e.title}</span>
              </div>
              {e.description && <p className="mt-0.5 text-xs text-slate-500">{e.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
