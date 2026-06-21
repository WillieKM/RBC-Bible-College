import { createClient } from "@/lib/supabase/server";
import { createEvent, deleteEvent } from "@/lib/actions/calendar";
import { DeleteButton } from "@/components/DeleteButton";
import type { CalendarEvent } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  holiday: "bg-red-100 text-red-700",
  exam: "bg-purple-100 text-purple-700",
  deadline: "bg-amber-100 text-amber-700",
  class: "bg-blue-100 text-blue-700",
  other: "bg-slate-100 text-slate-700",
};

export default async function AdminCalendarPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  const upcoming = (events ?? []).filter(
    (e) => new Date(e.event_date) >= new Date(new Date().toDateString())
  );
  const past = (events ?? []).filter(
    (e) => new Date(e.event_date) < new Date(new Date().toDateString())
  );

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-ZM", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Academic Calendar</h1>
      <p className="mt-1 text-sm text-slate-500">Events are visible to all students and professors in their portal.</p>

      {/* Add event form */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800">Add Event</h2>
        <form action={createEvent} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600">Title *</label>
            <input name="title" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Start Date *</label>
            <input type="date" name="event_date" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">End Date (optional)</label>
            <input type="date" name="end_date" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Type</label>
            <select name="type" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
              <option value="class">Class / Lecture</option>
              <option value="exam">Exam / Test</option>
              <option value="deadline">Assignment Deadline</option>
              <option value="holiday">Holiday</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600">Description (optional)</label>
            <textarea name="description" rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
              Add Event
            </button>
          </div>
        </form>
      </div>

      {/* Upcoming events */}
      <h2 className="mt-8 font-semibold text-slate-800">Upcoming ({upcoming.length})</h2>
      <div className="mt-3 space-y-3">
        {upcoming.length === 0 && <p className="text-sm text-slate-400">No upcoming events.</p>}
        {upcoming.map((e: CalendarEvent) => (
          <div key={e.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLORS[e.type] ?? TYPE_COLORS.other}`}>{e.type}</span>
                <span className="font-medium text-slate-900">{e.title}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDate(e.event_date)}{e.end_date && e.end_date !== e.event_date ? ` → ${formatDate(e.end_date)}` : ""}
              </p>
              {e.description && <p className="mt-1 text-sm text-slate-600">{e.description}</p>}
            </div>
            <form action={deleteEvent}>
              <input type="hidden" name="id" value={e.id} />
              <DeleteButton label="Remove" pendingLabel="Removing…" className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50" />
            </form>
          </div>
        ))}
      </div>

      {/* Past events */}
      {past.length > 0 && (
        <>
          <h2 className="mt-8 font-semibold text-slate-500">Past Events</h2>
          <div className="mt-3 space-y-2">
            {past.map((e: CalendarEvent) => (
              <div key={e.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-500">{e.type}</span>
                    <span className="font-medium text-slate-500">{e.title}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{formatDate(e.event_date)}</p>
                </div>
                <form action={deleteEvent}>
                  <input type="hidden" name="id" value={e.id} />
                  <DeleteButton label="Remove" pendingLabel="…" className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-400 hover:bg-slate-100 disabled:opacity-50" />
                </form>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
