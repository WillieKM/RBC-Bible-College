"use client";

import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";

type CourseOption = { id: string; title: string; code: string | null; programName: string | null };
type StudentOption = { id: string; full_name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create Assignment"}
    </button>
  );
}

export function AdminAssignmentForm({
  courses,
  action,
}: {
  courses: CourseOption[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [notifyTarget, setNotifyTarget] = useState("none");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (!selectedCourseId) { setStudents([]); return; }
    setLoadingStudents(true);
    fetch(`/api/admin/course-students?course_id=${selectedCourseId}`)
      .then((r) => r.json())
      .then((data) => setStudents(data.students ?? []))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedCourseId]);

  // Group courses by program
  const grouped = new Map<string, CourseOption[]>();
  for (const c of courses) {
    const key = c.programName ?? "Other";
    const list = grouped.get(key) ?? [];
    list.push(c);
    grouped.set(key, list);
  }

  return (
    <form action={action} className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <h2 className="font-semibold text-slate-800">Create Assignment</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Course <span className="text-red-500">*</span></label>
          <select
            name="course_id"
            required
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            <option value="">Select a course…</option>
            {[...grouped.entries()].map(([program, programCourses]) => (
              <optgroup key={program} label={program}>
                {programCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}{c.code ? ` (${c.code})` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Title <span className="text-red-500">*</span></label>
          <input
            name="title"
            required
            placeholder="e.g. Essay on the Sermon on the Mount"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Due date</label>
          <input
            name="due_date"
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 [color-scheme:light]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Points possible</label>
          <input
            name="points_possible"
            type="number"
            min="0"
            placeholder="e.g. 100"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Instructions or context for the assignment…"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>

        {/* Email notification */}
        <div className="sm:col-span-2 border-t border-slate-100 pt-4">
          <label className="block text-sm font-medium text-slate-700">Notify students by email</label>
          <select
            name="notify_target"
            value={notifyTarget}
            onChange={(e) => setNotifyTarget(e.target.value)}
            className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            <option value="none">No notification</option>
            <option value="all">All enrolled students</option>
            <option value="individual">Specific student</option>
          </select>

          {notifyTarget === "individual" && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-slate-700">Select student</label>
              {loadingStudents ? (
                <p className="mt-1 text-xs text-slate-400">Loading enrolled students…</p>
              ) : students.length === 0 ? (
                <p className="mt-1 text-xs text-slate-400">{selectedCourseId ? "No students enrolled in this course." : "Select a course first."}</p>
              ) : (
                <select
                  name="notify_student_id"
                  className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                >
                  <option value="">Select student…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {notifyTarget === "all" && selectedCourseId && (
            <p className="mt-2 text-xs text-slate-500">
              {loadingStudents ? "Loading…" : `${students.length} enrolled student${students.length !== 1 ? "s" : ""} will receive an email.`}
            </p>
          )}
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
