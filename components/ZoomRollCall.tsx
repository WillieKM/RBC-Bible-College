"use client";

import { useState } from "react";
import { recordZoomAttendance } from "@/lib/actions/zoom";
import { DeleteButton } from "@/components/DeleteButton";

type Student = { id: string; full_name: string; email: string };
type PastRecord = { session_date: string; present: boolean };
type AttendanceSummary = Map<string, boolean>; // studentId -> present

export function ZoomRollCall({
  sessionId,
  sessionTitle,
  students,
  existingByStudent,
  pastDates,
  returnPath,
}: {
  sessionId: string;
  sessionTitle: string;
  students: Student[];
  existingByStudent: AttendanceSummary;
  pastDates: string[];
  returnPath: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const presentCount = [...existingByStudent.values()].filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-slate-700">Session date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {pastDates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700">Past sessions</label>
            <select
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value={today}>Today ({today})</option>
              {pastDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {existingByStudent.size > 0 && (
        <p className="mt-3 text-sm text-slate-500">
          Last saved: {presentCount} / {students.length} present
        </p>
      )}

      <form action={recordZoomAttendance} className="mt-4">
        <input type="hidden" name="session_id" value={sessionId} />
        <input type="hidden" name="session_date" value={date} />
        <input type="hidden" name="return_path" value={returnPath} />
        {students.map((s) => (
          <input key={s.id} type="hidden" name="student_id" value={s.id} />
        ))}

        <div className="space-y-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {students.length} student{students.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-slate-400">Check box = Present</span>
          </div>
          {students.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center gap-4 border-b border-slate-50 px-5 py-3 hover:bg-slate-50 last:border-0"
            >
              <input
                type="checkbox"
                name="present"
                value={s.id}
                defaultChecked={existingByStudent.get(s.id) ?? false}
                className="h-5 w-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <div className="flex-1">
                <p className="font-medium text-slate-900">{s.full_name}</p>
                <p className="text-xs text-slate-400">{s.email}</p>
              </div>
            </label>
          ))}
          {students.length === 0 && (
            <p className="px-5 py-6 text-sm text-slate-400 text-center">No students found for this audience.</p>
          )}
        </div>

        {students.length > 0 && (
          <div className="mt-4">
            <DeleteButton
              label="Save Attendance"
              pendingLabel="Saving…"
              className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
            />
          </div>
        )}
      </form>
    </div>
  );
}
