"use client";

import { useState } from "react";
import { saveAttendance } from "@/lib/actions/professor";
import { useFormStatus } from "react-dom";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Saving…" : "Save Attendance"}
    </button>
  );
}

export function AttendanceForm({
  courseId,
  today,
  enrollments,
}: {
  courseId: string;
  today: string;
  enrollments: { student_id: string; profiles: { full_name: string } | null }[];
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(enrollments.map((e) => [e.student_id, false]))
  );

  const allPresent = enrollments.every((e) => checked[e.student_id]);

  function toggleAll() {
    const next = !allPresent;
    setChecked(Object.fromEntries(enrollments.map((e) => [e.student_id, next])));
  }

  return (
    <form action={saveAttendance} className="mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="course_id" value={courseId} />
      <div>
        <label className="block text-sm font-medium text-slate-700">Session date</label>
        <input name="session_date" type="date" defaultValue={today} required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div className="mt-4 mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Students</span>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-semibold text-gold-dark hover:underline"
        >
          {allPresent ? "Unmark all" : "Mark all present"}
        </button>
      </div>

      <div className="space-y-2">
        {enrollments.map((e) => (
          <label
            key={e.student_id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              name={`present_${e.student_id}`}
              checked={checked[e.student_id] ?? false}
              onChange={(ev) =>
                setChecked((prev) => ({ ...prev, [e.student_id]: ev.target.checked }))
              }
              className="h-4 w-4 accent-gold"
            />
            <span className="text-sm text-slate-800">{e.profiles?.full_name}</span>
            <span className="ml-auto text-xs text-slate-400">
              {checked[e.student_id] ? "Present" : "Absent"}
            </span>
          </label>
        ))}
      </div>

      <SaveButton />
    </form>
  );
}
