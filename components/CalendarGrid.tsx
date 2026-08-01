"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/lib/types";

const TYPE_COLORS: Record<string, { light: string; dot: string }> = {
  holiday:    { light: "bg-red-100 text-red-700",    dot: "bg-red-500"    },
  exam:       { light: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  assignment: { light: "bg-amber-100 text-amber-700",  dot: "bg-amber-500"  },
  class:      { light: "bg-blue-100 text-blue-700",   dot: "bg-blue-500"   },
  other:      { light: "bg-slate-100 text-slate-600", dot: "bg-slate-400"  },
};

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildEventsByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const start = new Date(event.event_date + "T12:00:00");
    const end = event.end_date ? new Date(event.end_date + "T12:00:00") : new Date(start);
    const cur = new Date(start);
    while (cur <= end) {
      const key = dateKey(cur);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
      cur.setDate(cur.getDate() + 1);
    }
  }
  return map;
}

export function CalendarGrid({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const todayKey = dateKey(today);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(todayKey);

  const eventsByDay = buildEventsByDay(events);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }
  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelected(todayKey);
  }

  // Build 6-row × 7-col grid
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { key: string; day: number; current: boolean }[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    const d = daysInPrevMonth - firstDayOfWeek + 1 + i;
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    cells.push({ key: `${py}-${String(pm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ key: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d, current: true });
  }
  const trailing = 42 - cells.length;
  for (let d = 1; d <= trailing; d++) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    cells.push({ key: `${ny}-${String(nm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d, current: false });
  }

  // Deduplicated events for selected day panel
  const rawSelected = selected ? (eventsByDay.get(selected) ?? []) : [];
  const selectedEvents = [...new Map(rawSelected.map((e) => [e.id, e])).values()];

  return (
    <div>
      {/* ── Month navigation ── */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-slate-900">
          {MONTHS[month]} {year}
        </h2>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={goToday}
            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {/* ── Day-of-week headers ── */}
      <div className="mt-4 grid grid-cols-7 text-center">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {d}
          </div>
        ))}
      </div>

      {/* ── Month grid ── */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
        {cells.map((cell) => {
          const dayEvents = eventsByDay.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;
          const isSelected = cell.key === selected;

          return (
            <button
              key={cell.key}
              onClick={() => setSelected(cell.key === selected ? null : cell.key)}
              className={`flex min-h-[80px] flex-col p-1.5 text-left transition-colors focus:outline-none ${
                !cell.current
                  ? "bg-slate-50"
                  : isSelected
                  ? "bg-gold/10"
                  : "bg-white hover:bg-slate-50"
              }`}
            >
              {/* Day number */}
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  isToday
                    ? "bg-blue-600 text-white"
                    : isSelected
                    ? "bg-gold text-ink"
                    : cell.current
                    ? "text-slate-800"
                    : "text-slate-300"
                }`}
              >
                {cell.day}
              </span>

              {/* Event pills */}
              <div className="mt-1 flex w-full flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 2).map((e, i) => {
                  const c = TYPE_COLORS[e.type] ?? TYPE_COLORS.other;
                  return (
                    <span
                      key={`${e.id}-${i}`}
                      className={`truncate rounded px-1 py-px text-[10px] font-medium leading-tight ${c.light}`}
                    >
                      {e.title}
                    </span>
                  );
                })}
                {dayEvents.length > 2 && (
                  <span className="text-[10px] leading-tight text-slate-400">
                    +{dayEvents.length - 2} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Selected day detail panel ── */}
      {selected && selectedEvents.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            {new Date(selected + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric", year: "numeric",
            })}
          </p>
          <div className="mt-3 space-y-3">
            {selectedEvents.map((e) => {
              const c = TYPE_COLORS[e.type] ?? TYPE_COLORS.other;
              return (
                <div key={e.id} className="flex gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${c.dot}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{e.title}</p>
                    {e.description && (
                      <p className="mt-0.5 text-xs text-slate-500">{e.description}</p>
                    )}
                    {e.end_date && e.end_date !== e.event_date && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        Through{" "}
                        {new Date(e.end_date + "T12:00:00").toLocaleDateString("en-US", {
                          month: "long", day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selected && selectedEvents.length === 0 && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-400">No events on this day.</p>
        </div>
      )}
    </div>
  );
}
